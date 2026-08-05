"""
hive_api_gateway — plain Python FastAPI service, ZERO ROS 2 dependency.

Talks to the robot only via MQTT (see mqtt_client.py) plus a local map.pgm
file mount. This is the entire point of the 2026 refactor: this process can
now run `pip install -r requirements.txt && python -m app.main` on a laptop,
in CI, or on a cloud VM — no rclpy, no colcon workspace, no shared DDS domain
with the robot. All ROS 2 code moved to backend/hive_mqtt_bridge/, which is
the only place that still imports rclpy.

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
from .mqtt_client import GatewayMqttClient, MqttUnavailable, TaskAckTimeout

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
    allow_origins=["*"],
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
    bid     = int(payload.get("id", 0))

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
    except TaskAckTimeout as exc:
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


@api_app.get("/health")
async def health():
    """
    Returns gateway + robot liveness.

    robot_alive is True only when BOTH /global_costmap/costmap and /scan have
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
            "topics": {"/global_costmap/costmap": None, "/scan": None},
            "mqtt_connected": mqtt_client.connected,
        }
    return {**mqtt_client.latest_health, "mqtt_connected": True}


# =============================================================================
# Map image endpoints — plain file I/O, no ROS, no MQTT
# =============================================================================

@api_app.get("/api/map")
async def get_robot_map():
    """Serve the robot's operational map.pgm as a PNG image."""
    pgm_path = Path(config.ROBOT_MAP_DIR) / "map.pgm"
    if not pgm_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"map.pgm not found in {config.ROBOT_MAP_DIR}. "
                   f"Set ROBOT_MAP_DIR env var to the correct folder.",
        )
    img = Image.open(str(pgm_path))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png", headers={"Cache-Control": "no-cache"})


@api_app.get("/api/map/meta")
async def get_robot_map_meta():
    """Return map.yaml metadata (resolution, origin) for the operational map."""
    map_dir   = Path(config.ROBOT_MAP_DIR)
    yaml_path = map_dir / "map.yaml"
    meta: dict = {
        "resolution": 0.05,
        "origin_x":   -10.0,
        "origin_y":   -10.0,
        "map_dir":    str(map_dir),
        "pgm_exists": (map_dir / "map.pgm").exists(),
    }
    if yaml_path.exists():
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
