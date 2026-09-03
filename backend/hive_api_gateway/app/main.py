"""
hive_api_gateway — plain Python FastAPI service, ZERO ROS 2 dependency.

Talks to the robot only via MQTT (see mqtt_client.py) plus a local map.pgm
file mount — with one narrow exception: POST /webrtc/offer proxies the
browser's WebRTC SDP offer to hive_camera_bridge's signaling endpoint over
plain HTTP, because live video isn't something MQTT is built to carry. This
is the entire point of the 2026 refactor: this process can now run
`pip install -r requirements.txt && python -m app.main` on a laptop, in CI,
or on a cloud VM — no rclpy, no colcon workspace, no shared DDS domain with
the robot. All ROS 2 code moved to backend/hive_mqtt_bridge/ and
backend/hive_camera_bridge/, the only two places that still import rclpy.

Every REST/WebSocket path and payload shape below is unchanged from the old
ApiNode-backed gateway — the frontend hooks in src/hooks/ need zero changes.
"""
import asyncio
import io
import json
import logging
import math
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from . import config, geometry
from .mqtt_client import GatewayMqttClient, MqttUnavailable, AckTimeout

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(message)s')
logger = logging.getLogger('gateway')

mqtt_client = GatewayMqttClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"[gateway] starting — MQTT target {config.MQTT_HOST}:{config.MQTT_PORT}, "
        f"robot_id={config.ROBOT_ID}, map_dir={config.ROBOT_MAP_DIR}"
    )
    mqtt_client.start()
    yield
    await mqtt_client.stop()


api_app = FastAPI(lifespan=lifespan)
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# /tasks — mission dispatch
# =============================================================================

@api_app.post("/tasks")
async def create_task(payload: dict):
    """
    Unified task endpoint. Accepts three input formats:

    1. pixel_waypoints[] — webapp sends raw pixel coords (preferred new format):
       {"id":22, "behavior_name":"FollowRoute",
        "pixel_waypoints":[{"col":254,"row":389,"yaw_deg":-3}, ...]}

    2. poses[] with pixel values — webapp sends poses[] but with pixel values
       in position.x/y (auto-detected and converted):
       {"id":22, "behavior_name":"FollowRoute",
        "poses":[{"header":{"frame_id":"map"},
                  "pose":{"position":{"x":247,"y":387,"z":0},
                          "orientation":{"x":0,"y":0,"z":0,"w":1}}}]}

    3. poses[] with real map coords — external clients, no conversion needed:
       {"id":22, "behavior_name":"FollowRoute",
        "poses":[{"header":{"frame_id":"map"},
                  "pose":{"position":{"x":2.8,"y":0.95,"z":0},
                          "orientation":{"x":0,"y":0,"z":-0.026,"w":0.999}}}]}

    Coordinate conversion happens HERE (pure Python, see geometry.py) — the
    bridge on the ROS 2 side only ever sees map-frame poses. This call
    publishes hive/<robot_id>/cmd/task over MQTT and waits (up to
    TASK_ACK_TIMEOUT_S) for the bridge's task/ack before responding, so the
    response shape/status codes match what this endpoint always returned.
    """
    task_id = payload.get("task_id") or str(uuid.uuid4())
    try:
        bid = int(payload.get("id", 0))
    except (TypeError, ValueError):
        # A non-numeric id used to raise straight out of the handler, which
        # uvicorn turns into a bare 500 + traceback. It's client input, so
        # it gets the same 422 treatment as a malformed waypoint.
        raise HTTPException(422, f"'id' must be an integer, got {payload.get('id')!r}")

    logger.info(f"[/tasks] id={bid} behavior='{payload.get('behavior_name','')}' task={task_id}")

    pixel_wps = payload.get("pixel_waypoints", [])

    if pixel_wps:
        for i, wp in enumerate(pixel_wps):
            if "col" not in wp and "x" not in wp:
                raise HTTPException(422, f"pixel_waypoints[{i}] missing 'col'")
            if "row" not in wp and "y" not in wp:
                raise HTTPException(422, f"pixel_waypoints[{i}] missing 'row'")
        poses  = geometry.pixels_to_poses(pixel_wps)
        source = "pixel_waypoints"

    else:
        raw_poses = payload.get("poses", [])
        if raw_poses:
            poses, was_converted = geometry.auto_convert_poses(raw_poses)
            source = "poses_auto_converted" if was_converted else "poses_map_coords"
        else:
            poses  = []
            source = "none"

    logger.info(f"  [resolved] {len(poses)} pose(s) -> cmd/task  source={source}")

    cmd_payload = {
        "task_id":       task_id,
        "id":            bid,
        "behavior_name": payload.get("behavior_name", ""),
        "poses":         poses,
    }
    for key in ("speed", "priority", "pause_ms", "json_payload"):
        if key in payload:
            cmd_payload[key] = payload[key]

    try:
        ack = await mqtt_client.publish_task(cmd_payload)
    except MqttUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except AckTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))

    if not ack.get("accepted"):
        raise HTTPException(status_code=500, detail=ack.get("detail", "Goal rejected"))

    return {
        "accepted":       True,
        "task_id":        task_id,
        "behavior":       ack.get("behavior"),
        "waypoint_count": ack.get("waypoint_count"),
        "source":         source,
        "nav_mode":       ack.get("nav_mode"),
    }


@api_app.post("/nav_goal")
async def nav_goal(payload: dict):
    """
    Direct Nav2 dispatch — publishes cmd/goal; the bridge publishes the
    route's final pose straight to /goal_pose, bypassing the Hive
    behavior-tree layer entirely (same "skip Hive/BT" pattern
    /api/velocity_ctrl already uses for /cmd_vel):

        ros2 topic pub --once /goal_pose geometry_msgs/msg/PoseStamped \\
          "{header: {frame_id: 'map'}, pose: {...}}"

    Only the last entry in poses[] is used — /goal_pose carries a single
    pose, so earlier entries (route shaping) are dropped; waypoint_count
    in the response reflects that.

    Waits for the bridge's goal/ack (accept/reject) before responding —
    NOT for the robot to finish driving. Use POST /cancel_nav to stop it
    early. Use POST /tasks instead when you want BT-managed retries,
    pause/cancel, and feedback.

    Accepts ONE of:
    1. pixel_waypoints — [{"col": 254, "row": 389, "yaw_deg": -3}, ...]
    2. poses — PoseStamped-shaped dicts, map-frame metres or pixel values
       (auto-detected exactly like POST /tasks' poses[] does)

    curl -X POST http://localhost:1717/nav_goal \\
      -H 'Content-Type: application/json' \\
      -d '{"poses": [
             {"header": {"frame_id": "map"},
              "pose": {"position": {"x": 1.0, "y": 1.0, "z": 0.0},
                        "orientation": {"x": 0, "y": 0, "z": 0, "w": 1}}},
             {"header": {"frame_id": "map"},
              "pose": {"position": {"x": 2.0, "y": 0.0, "z": 0.0},
                        "orientation": {"x": 0, "y": 0, "z": 0, "w": 1}}}
           ]}'
    """
    pixel_wps = payload.get("pixel_waypoints", [])
    raw_poses = payload.get("poses", [])

    if pixel_wps:
        poses  = geometry.pixels_to_poses(pixel_wps)
        source = "pixel_waypoints"
    elif raw_poses:
        poses, was_converted = geometry.auto_convert_poses(raw_poses)
        source = "poses_auto_converted" if was_converted else "poses_map_coords"
    else:
        raise HTTPException(422, "Provide pixel_waypoints[] or poses[]")

    logger.info(f"[/nav_goal] dispatching {len(poses)} waypoint(s) directly to Nav2, source={source}")

    try:
        ack = await mqtt_client.publish_goal(poses)
    except MqttUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except AckTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))

    if not ack.get("accepted"):
        raise HTTPException(status_code=500, detail=ack.get("detail", "Goal rejected"))

    return {
        "accepted":       True,
        "goal_id":        ack.get("goal_id"),
        "waypoint_count": ack.get("waypoint_count", len(poses)),
        "source":         source,
        "nav_mode":       ack.get("nav_mode", "goal_pose_direct"),
        "cancellable":    ack.get("cancellable", True),
        "detail":         ack.get("detail"),
    }


@api_app.post("/cancel_nav")
async def cancel_nav():
    """
    Cancels whatever goal is currently active on Nav2's NavigateToPose
    action server — equivalent to:

        ros2 action cancel /navigate_to_pose

    That covers goals dispatched by POST /nav_goal (which publishes to
    /goal_pose; NavigateToPose picks it up and runs it in-process) as well
    as POST /tasks' Nav2-fallback path (NavigateThroughPoses). Not an
    error if nothing was running — check the response's "cancelled" field
    to tell the difference.

    curl -X POST http://localhost:1717/cancel_nav
    """
    try:
        ack = await mqtt_client.publish_cancel_nav()
    except MqttUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except AckTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))

    return {"cancelled": ack.get("cancelled", False), "detail": ack.get("detail")}


@api_app.post("/set_pose")
async def set_pose(payload: dict):
    """
    Sets AMCL's initial pose — publishes cmd/set_pose, the bridge publishes
    once to /initialpose. Fire-and-forget, same semantics as:

        ros2 topic pub -1 /initialpose geometry_msgs/msg/PoseWithCovarianceStamped "{...}"

    Same mechanism RViz's "2D Pose Estimate" tool uses, and the same one
    turtlebot_mcp_ros2's entrypoint_sim.sh calls on sim boot to match
    AMCL's estimate to the Gazebo spawn pose.

    Accepts ONE of:
    1. pixel_waypoint — {"col": 254, "row": 389, "yaw_deg": -3}
    2. pose — a full PoseStamped-shaped dict, map-frame metres or pixel
       values (auto-detected)

    Optional top-level "covariance" (36 floats, row-major 6x6) — defaults
    to the same estimate the sim's own boot sequence uses if omitted.

    curl -X POST http://localhost:1717/set_pose \\
      -H 'Content-Type: application/json' \\
      -d '{"pose": {"header": {"frame_id": "map"},
                     "pose": {"position": {"x": 0.0, "y": 0.0, "z": 0.0},
                               "orientation": {"x": 0, "y": 0, "z": 0, "w": 1}}}}'
    """
    pixel_wp = payload.get("pixel_waypoint")
    raw_pose = payload.get("pose")

    if pixel_wp:
        pose   = geometry.pixels_to_poses([pixel_wp])[0]
        source = "pixel_waypoint"
    elif raw_pose:
        poses, was_converted = geometry.auto_convert_poses([raw_pose])
        pose   = poses[0]
        source = "pose_auto_converted" if was_converted else "pose_map_coords"
    else:
        raise HTTPException(422, "Provide pixel_waypoint or pose")

    covariance = payload.get("covariance")

    logger.info(f"[/set_pose] setting initial pose x={pose['pose']['position']['x']} "
                f"y={pose['pose']['position']['y']} source={source}")

    try:
        await mqtt_client.publish_set_pose(pose, covariance)
    except MqttUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"accepted": True, "topic": "/initialpose", "source": source, "pose": pose}


# =============================================================================
# Localisation / map metadata
# =============================================================================

@api_app.get("/localization")
async def get_localization():
    """
    Returns the robot's current pose (from hive/<id>/localisation, sourced
    from /amcl_pose on the robot), converted to source-image pixel
    coordinates (col, row) + yaw_deg.
    """
    loc = mqtt_client.latest_localisation
    if loc is None:
        return {"available": False, "reason": "No localisation received yet from the bridge"}

    map_x, map_y = float(loc["x"]), float(loc["y"])
    col, row     = geometry.map_to_pixel(map_x, map_y)
    yaw_deg      = round(math.degrees(loc["yaw"]), 2)

    return {
        "col":       col,
        "row":       row,
        "yaw_deg":   yaw_deg,
        "map_x":     map_x,
        "map_y":     map_y,
        "timestamp": int(time.time() * 1000),
    }


@api_app.get("/map/meta")
async def get_map_meta():
    """Return active map conversion parameters and valid bounds."""
    return {
        **geometry.MAP_META,
        "bounds": {
            "x": [geometry.MAP_X_MIN, geometry.MAP_X_MAX],
            "y": [geometry.MAP_Y_MIN, geometry.MAP_Y_MAX],
        },
    }


@api_app.post("/map/preview")
async def preview_pixel_conversion(payload: dict):
    """Dry-run conversion without dispatching to the robot. Accepts
    pixel_waypoints[] OR poses[] (auto-detects format)."""
    pixel_wps = payload.get("pixel_waypoints", [])
    raw_poses = payload.get("poses", [])

    if pixel_wps:
        poses, source = geometry.pixels_to_poses(pixel_wps), "pixel_waypoints"
    elif raw_poses:
        poses, was_converted = geometry.auto_convert_poses(raw_poses)
        source = "poses_auto_converted" if was_converted else "poses_map_coords"
    else:
        raise HTTPException(422, "Provide pixel_waypoints[] or poses[]")

    return {"poses": poses, "source": source, "map_meta": geometry.MAP_META}


@api_app.get("/ping")
async def ping():
    return {"status": "ok"}


# =============================================================================
# WebSocket streams — all fed from the MQTT-populated cache in mqtt_client
# =============================================================================

@api_app.websocket("/api/telemetry")
async def telemetry_ws(ws: WebSocket):
    """Relays hive/<id>/telemetry ({"type":"telemetry","x","y","theta"}) at ~1Hz."""
    await ws.accept()
    try:
        while True:
            if mqtt_client.latest_telemetry:
                await ws.send_json(mqtt_client.latest_telemetry)
            await asyncio.sleep(1.0)
    except (WebSocketDisconnect, Exception):
        pass


@api_app.websocket("/api/localisation")
async def localisation_ws(ws: WebSocket):
    """Relays hive/<id>/localisation ({"type","x","y","yaw","frame_id","age_s"}) at ~1Hz."""
    await ws.accept()
    try:
        while True:
            if mqtt_client.latest_localisation:
                await ws.send_json({"type": "localisation", **mqtt_client.latest_localisation})
            await asyncio.sleep(1.0)
    except (WebSocketDisconnect, Exception):
        pass


# Teleop safety limits — commands are clamped to these regardless of what the
# client asks for (matches the UI's slider maximums: 0.8 m/s, 1.0 rad/s).
# Also re-enforced bridge-side (defense in depth across the MQTT hop).
_TELEOP_MAX_LINEAR  = 0.8   # m/s
_TELEOP_MAX_ANGULAR = 1.0   # rad/s


@api_app.websocket("/api/velocity_ctrl")
async def velocity_ctrl_ws(ws: WebSocket):
    """
    Teleoperation channel: frontend -> hive/<id>/cmd/velocity -> bridge -> /cmd_vel.

    Protocol (client -> server), sent at ~10 Hz ONLY while an input is active:
        {"type": "cmd_vel", "linear": <m/s>, "angular": <rad/s>}
    On release the client sends ONE final all-zero frame and then goes quiet.

    Safety:
      * Values are clamped to _TELEOP_MAX_LINEAR / _TELEOP_MAX_ANGULAR here,
        AND independently by the bridge before it ever touches /cmd_vel.
      * 400ms deadman here: if the stream goes quiet mid-drive, publish zero.
      * The bridge runs a SECOND, independent 500ms deadman keyed off MQTT
        message arrival — covers the case where the browser<->gateway
        WebSocket is fine but the gateway<->broker or broker<->bridge MQTT
        hop drops, which this WebSocket-side watchdog alone can't see.
    """
    await ws.accept()
    moving = False
    try:
        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=0.4)
            except asyncio.TimeoutError:
                if moving:
                    await mqtt_client.publish_velocity(0.0, 0.0)
                    moving = False
                continue

            try:
                data = json.loads(raw)
            except ValueError:
                continue
            if data.get("type") != "cmd_vel":
                continue

            lin = max(-_TELEOP_MAX_LINEAR,  min(_TELEOP_MAX_LINEAR,  float(data.get("linear",  0.0))))
            ang = max(-_TELEOP_MAX_ANGULAR, min(_TELEOP_MAX_ANGULAR, float(data.get("angular", 0.0))))

            await mqtt_client.publish_velocity(lin, ang)
            moving = (lin != 0.0 or ang != 0.0)
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if moving:
            try:
                await mqtt_client.publish_velocity(0.0, 0.0)
            except Exception:
                pass


@api_app.websocket("/api/plan")
async def plan_ws(ws: WebSocket):
    """Relays hive/<id>/plan at 2 Hz. Empty "points" means no active plan."""
    await ws.accept()
    try:
        while True:
            plan = mqtt_client.latest_plan
            if plan:
                await ws.send_json(plan)
            else:
                await ws.send_json({"type": "plan", "frame_id": "map", "age_s": None, "points": []})
            await asyncio.sleep(0.5)
    except (WebSocketDisconnect, Exception):
        pass


@api_app.websocket("/api/scan")
async def scan_ws(ws: WebSocket):
    """
    Relays hive/<id>/scan — but ONLY while the client has opted in via a
    toggle message. The bridge now always publishes scan @ ~1Hz (MQTT has no
    per-subscriber "is anyone listening" signal the way the old in-process
    WebSocket toggle did) — this handler is where the opt-in is still
    enforced, so browsers that never ask still get nothing.

    Client -> server, at any time (idle keepalive doubles as the poll tick):
        {"type": "scan_toggle", "enabled": true}
        {"type": "scan_toggle", "enabled": false}
    """
    await ws.accept()
    enabled = False
    try:
        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=1.0)
                data = json.loads(raw)
                if data.get("type") == "scan_toggle":
                    enabled = bool(data.get("enabled", False))
            except asyncio.TimeoutError:
                pass
            except ValueError:
                pass

            if enabled and mqtt_client.latest_scan:
                await ws.send_json(mqtt_client.latest_scan)
    except (WebSocketDisconnect, Exception):
        pass


# =============================================================================
# WebRTC signaling — relayed over MQTT (cmd/webrtc_offer -> webrtc/answer),
# same path as every other robot-bound command. See
# mqtt_client.publish_webrtc_offer's docstring for why this used to be a
# direct HTTP call to hive_camera_bridge and no longer is: that only worked
# when the gateway and the robot shared a host/LAN, which stopped being true
# once the gateway could run on AWS while the robot stays on its own network
# (see README's AWS section). Only the one-time SDP exchange rides MQTT —
# once this call returns, the actual video (RTP, continuous) flows directly
# between the browser and hive_camera_bridge; it never touches this process.
# =============================================================================

@api_app.post("/webrtc/offer")
async def webrtc_offer(payload: dict):
    """
    Relay a browser's WebRTC SDP offer to hive_camera_bridge (via the robot's
    MQTT bridge) and return its answer unchanged.

    Request/response body: {"sdp": "...", "type": "offer"|"answer"}

    curl -X POST http://localhost:1717/webrtc/offer \\
      -H 'Content-Type: application/json' \\
      -d '{"sdp": "v=0...", "type": "offer"}'
    """
    sdp  = payload.get("sdp")
    type_ = payload.get("type", "offer")
    if not sdp:
        raise HTTPException(422, "Provide 'sdp'")

    try:
        answer = await mqtt_client.publish_webrtc_offer(sdp, type_)
    except MqttUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except AckTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except ValueError as exc:
        # Bridge reached fine, but hive_camera_bridge itself didn't answer
        # (not running, crashed, wrong CAMERA_TOPIC, etc).
        raise HTTPException(status_code=503, detail=str(exc))

    return answer


@api_app.get("/health")
async def health():
    """
    Returns gateway + robot liveness.

    robot_alive is True when ANY of /cmd_vel, /scan, or /camera/image_raw have
    published within the last 5 seconds on the robot side (computed by the
    bridge, forwarded here as hive/<id>/health). If the bridge process dies
    or its MQTT connection drops uncleanly, its Last Will and Testament
    flips this topic to robot_alive:false automatically — no staleness
    timeout needed on this end for that case. mqtt_connected additionally
    reports whether THIS gateway's own broker connection is currently up.
    """
    if not mqtt_client.connected or mqtt_client.latest_health is None:
        return {
            "ros_ready": False,
            "robot_alive": False,
            "topics": {"/cmd_vel": None, "/scan": None, "/camera/image_raw": None},
            "mqtt_connected": mqtt_client.connected,
        }
    return {**mqtt_client.latest_health, "mqtt_connected": True}


# =============================================================================
# Map image endpoints — plain file I/O, no ROS, no MQTT
# =============================================================================

@api_app.get("/api/map")
async def get_robot_map():
    """Serve whichever map .pgm is currently active in ROBOT_MAP_DIR as a PNG image."""
    map_dir = Path(config.ROBOT_MAP_DIR)
    pgm_path, _ = config.resolve_map_files(map_dir)
    if pgm_path is None:
        raise HTTPException(
            status_code=404,
            detail=f"No .pgm map found in {map_dir}. Drop a .pgm (and matching .yaml) "
                   f"in there, or set ROBOT_MAP_DIR to the correct folder.",
        )
    img = Image.open(str(pgm_path))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png", headers={"Cache-Control": "no-cache"})


@api_app.get("/api/map/meta")
async def get_robot_map_meta():
    """Return the active map's .yaml metadata (resolution, origin) — see resolve_map_files()."""
    map_dir = Path(config.ROBOT_MAP_DIR)
    pgm_path, yaml_path = config.resolve_map_files(map_dir)
    meta: dict = {
        "resolution": 0.05,
        "origin_x":   -10.0,
        "origin_y":   -10.0,
        "map_dir":    str(map_dir),
        "map_file":   pgm_path.name if pgm_path else None,
        "pgm_exists": pgm_path is not None,
    }
    if yaml_path is not None:
        try:
            import yaml
            with open(yaml_path) as f:
                data = yaml.safe_load(f)
            meta["resolution"] = data.get("resolution", 0.05)
            origin = data.get("origin", [-10.0, -10.0, 0])
            meta["origin_x"] = origin[0]
            meta["origin_y"] = origin[1]
        except Exception:
            pass
    return meta


@api_app.get("/map_image")
async def get_map_image(file: str = "new_office_map.pgm"):
    """Serve any .pgm map image bundled in resource/ as PNG."""
    if "/" in file or "\\" in file or not file.endswith(".pgm"):
        raise HTTPException(400, "Invalid filename — must be a .pgm file with no path separators")

    image_path = config.MAP_RESOURCE_DIR / file
    if not image_path.exists():
        available = [f.name for f in config.MAP_RESOURCE_DIR.glob("*.pgm")] \
            if config.MAP_RESOURCE_DIR.exists() else []
        raise HTTPException(404, {"error": f"'{file}' not found in resource folder", "available": available})

    img = Image.open(str(image_path))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@api_app.get("/map_image/list")
async def list_map_images():
    if not config.MAP_RESOURCE_DIR.exists():
        return {"maps": [], "count": 0}
    files = [f.name for f in config.MAP_RESOURCE_DIR.glob("*.pgm")]
    return {"maps": files, "count": len(files)}


# =============================================================================
# Entry point
# =============================================================================

def main():
    import uvicorn
    uvicorn.run(api_app, host="0.0.0.0", port=config.APP_PORT, log_level="info", access_log=False)


if __name__ == "__main__":
    main()
