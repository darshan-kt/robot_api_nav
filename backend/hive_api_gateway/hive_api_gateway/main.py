import threading, uuid, json, asyncio, math, subprocess, io, time, os
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import ament_index_python.packages as ament_index
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.qos import QoSProfile, QoSDurabilityPolicy, QoSReliabilityPolicy
from nav2_msgs.action import NavigateToPose, NavigateThroughPoses
from hive_interfaces.action import ExecuteBehavior
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav_msgs.msg import OccupancyGrid, Odometry
from sensor_msgs.msg import LaserScan
from PIL import Image
import uvicorn

APP_PORT = 1717

# =============================================================================
# MAP METADATA — update this block when the map changes
# Sourced from new_office_map.yaml:
#   resolution: 0.05  |  origin: [-9.9, -14.85, 0.0]  |  size: 513 x 706 px
# =============================================================================
MAP_META = {
    "resolution": 0.05,
    "origin_x":   -10.0,
    "origin_y":   -10.0,
    "img_w_px":    384,
    "img_h_px":    384,
    "frame_id":   "map",
}

# Pre-computed valid map-frame bounds (metres) — used for pixel auto-detection
_MAP_X_MIN = MAP_META["origin_x"]
_MAP_X_MAX = MAP_META["origin_x"] + MAP_META["img_w_px"] * MAP_META["resolution"]
_MAP_Y_MIN = MAP_META["origin_y"]
_MAP_Y_MAX = MAP_META["origin_y"] + MAP_META["img_h_px"] * MAP_META["resolution"]

print(f"[gateway] Map bounds: X=[{_MAP_X_MIN:.2f}, {_MAP_X_MAX:.2f}] "
      f"Y=[{_MAP_Y_MIN:.2f}, {_MAP_Y_MAX:.2f}] metres")

# Map image resource directory
_PKG_SHARE        = ament_index.get_package_share_directory('hive_api_gateway')
_MAP_RESOURCE_DIR = Path(_PKG_SHARE) / "resource"

# Operational map folder — override with ROBOT_MAP_DIR env var if needed
_ROBOT_MAP_DIR = Path(os.environ.get("ROBOT_MAP_DIR", "/home/darshan/appstore/map"))

print(f"[gateway] Map resource dir: {_MAP_RESOURCE_DIR}")
print(f"[gateway] Robot map dir:    {_ROBOT_MAP_DIR}")

# =============================================================================
# Coordinate conversion
# =============================================================================

def pixel_to_map(col: float, row: float) -> tuple[float, float]:
    """
    Source-image pixel → ROS map-frame metres.

        map_x = origin_x + col * resolution
        map_y = origin_y + (img_h - 1 - row) * resolution

    Y is flipped: row=0 (top of image) = maximum map Y.
    """
    res = MAP_META["resolution"]
    map_x = round(MAP_META["origin_x"] + col * res, 3)
    map_y = round(MAP_META["origin_y"] + (MAP_META["img_h_px"] - 1 - row) * res, 3)
    return map_x, map_y


def map_to_pixel(map_x: float, map_y: float) -> tuple[float, float]:
    """
    ROS map-frame metres → source-image pixel (col, row).
    Inverse of pixel_to_map.
    """
    res = MAP_META["resolution"]
    col = round((map_x - MAP_META["origin_x"]) / res, 1)
    row = round(MAP_META["img_h_px"] - 1 - (map_y - MAP_META["origin_y"]) / res, 1)
    return col, row


def yaw_deg_to_quat(yaw_deg: float) -> dict:
    """Yaw degrees → unit quaternion (zero roll/pitch, ROS CCW-positive)."""
    r = math.radians(yaw_deg)
    return {"x": 0.0, "y": 0.0,
            "z": round(math.sin(r / 2.0), 6),
            "w": round(math.cos(r / 2.0), 6)}


def quat_to_yaw_deg(qz: float, qw: float) -> float:
    """Quaternion z,w → yaw degrees."""
    return round(math.degrees(2.0 * math.atan2(qz, qw)), 2)


def _looks_like_pixels(x: float, y: float) -> bool:
    """
    Return True if (x, y) appear to be pixel coordinates rather than
    map-frame metres, i.e. they fall outside the valid map bounds.
    """
    x_out = not (_MAP_X_MIN <= x <= _MAP_X_MAX)
    y_out = not (_MAP_Y_MIN <= y <= _MAP_Y_MAX)
    return x_out or y_out


def pixels_to_poses(pixel_waypoints: list) -> list:
    """
    Convert pixel-space waypoint list to ROS PoseStamped list.

    Input:  [{"col": 254, "row": 389, "yaw_deg": -3}, ...]
    Output: [{"header":{"frame_id":"map"}, "pose":{"position":{...}, "orientation":{...}}}, ...]
    """
    poses = []
    for i, wp in enumerate(pixel_waypoints):
        col     = float(wp.get("col", wp.get("x", 0)))
        row     = float(wp.get("row", wp.get("y", 0)))
        yaw_deg = float(wp.get("yaw_deg", 0.0))
        frame   = wp.get("frame_id", MAP_META["frame_id"])

        map_x, map_y = pixel_to_map(col, row)
        quat         = yaw_deg_to_quat(yaw_deg)

        print(f"  [pixel->map] WP[{i}]: pixel({col:.0f},{row:.0f}) yaw={yaw_deg}"
              f" -> map({map_x}, {map_y})  qz={quat['z']} qw={quat['w']}")
        poses.append({
            "header": {"frame_id": frame},
            "pose": {
                "position":    {"x": map_x, "y": map_y, "z": 0.0},
                "orientation": quat,
            },
        })
    return poses


def _auto_convert_poses(poses: list) -> tuple[list, bool]:
    """
    Inspect poses[] from the client. If ANY pose contains coordinates
    outside valid map bounds, treat ALL poses as pixel-space and convert.

    Returns:
        (converted_poses, was_converted: bool)
    """
    if not poses:
        return poses, False

    first_pos = poses[0].get("pose", {}).get("position", {})
    x = float(first_pos.get("x", 0.0))
    y = float(first_pos.get("y", 0.0))

    if not _looks_like_pixels(x, y):
        return poses, False

    print(f"  [auto-detect] poses[] contain pixel values (x={x}, y={y} "
          f"outside map bounds [{_MAP_X_MIN:.1f},{_MAP_X_MAX:.1f}] x "
          f"[{_MAP_Y_MIN:.1f},{_MAP_Y_MAX:.1f}]) -- converting pixel->map")

    pixel_wps = []
    for p in poses:
        pos    = p.get("pose", {}).get("position", {})
        orient = p.get("pose", {}).get("orientation", {})
        frame  = p.get("header", {}).get("frame_id", MAP_META["frame_id"])

        col = float(pos.get("x", 0.0))
        row = float(pos.get("y", 0.0))

        qz = float(orient.get("z", 0.0))
        qw = float(orient.get("w", 1.0))
        yaw_deg = quat_to_yaw_deg(qz, qw)

        pixel_wps.append({"col": col, "row": row, "yaw_deg": yaw_deg, "frame_id": frame})

    converted = pixels_to_poses(pixel_wps)
    return converted, True


# =============================================================================
# ROS 2 node
# =============================================================================

class ApiNode(Node):
    def __init__(self):
        super().__init__('hive_api_gateway')
        self.client = ActionClient(self, ExecuteBehavior, '/hive/execute_behavior')

        self.nav_client              = ActionClient(self, NavigateToPose,        '/navigate_to_pose')
        self.nav_through_client      = ActionClient(self, NavigateThroughPoses, '/navigate_through_poses')

        # ── Localization subscriber (/amcl_pose → used by /localization endpoint) ──
        self._latest_pose      = None
        self._latest_pose_time = 0.0
        self._pose_lock        = threading.Lock()

        # Nav2 AMCL publishes with TRANSIENT_LOCAL + RELIABLE; must match.
        _amcl_qos = QoSProfile(
            depth=10,
            durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
            reliability=QoSReliabilityPolicy.RELIABLE,
        )
        self.create_subscription(
            PoseWithCovarianceStamped,
            '/amcl_pose',
            self._localization_cb,
            _amcl_qos,
        )

        # ── Robot-alive heartbeat subscribers ───────────────────────────────────
        # BEST_EFFORT + VOLATILE is compatible with any publisher QoS.
        # We only record the timestamp; no message data is parsed.
        self._costmap_time = 0.0
        self._scan_time    = 0.0
        self._alive_lock   = threading.Lock()

        _be_qos = QoSProfile(
            depth=5,
            reliability=QoSReliabilityPolicy.BEST_EFFORT,
        )
        self._latest_scan    = None
        self._scan_received  = False
        self._scan_data_lock = threading.Lock()

        self.create_subscription(OccupancyGrid, '/global_costmap/costmap',
                                 self._costmap_cb, _be_qos)
        self.create_subscription(LaserScan, '/scan',
                                 self._scan_cb, _be_qos)

        # ── Odometry subscriber (/odom → telemetry WebSocket) ───────────────────
        self._odom_x         = 0.0
        self._odom_y         = 0.0
        self._odom_yaw       = 0.0
        self._odom_received  = False
        self._odom_lock      = threading.Lock()

        self.create_subscription(Odometry, '/odom', self._odom_cb, _be_qos)
        self.get_logger().info(
            "Subscribed to /amcl_pose, /global_costmap/costmap, /scan, /odom"
        )

    def _localization_cb(self, msg: PoseWithCovarianceStamped):
        """Cache the latest AMCL pose."""
        pose_dict = {
            "frame_id": msg.header.frame_id,
            "position": {
                "x": msg.pose.pose.position.x,
                "y": msg.pose.pose.position.y,
                "z": msg.pose.pose.position.z,
            },
            "orientation": {
                "x": msg.pose.pose.orientation.x,
                "y": msg.pose.pose.orientation.y,
                "z": msg.pose.pose.orientation.z,
                "w": msg.pose.pose.orientation.w,
            },
        }
        with self._pose_lock:
            self._latest_pose      = pose_dict
            self._latest_pose_time = time.monotonic()

    def get_localization(self) -> dict | None:
        """Return latest pose or None if stale (>10 s) or never received."""
        with self._pose_lock:
            if self._latest_pose is None:
                return None
            age = time.monotonic() - self._latest_pose_time
            if age > 10.0:
                return None  # consider stale
            return {**self._latest_pose, "age_s": round(age, 2)}

    def _costmap_cb(self, msg: OccupancyGrid):
        with self._alive_lock:
            self._costmap_time = time.monotonic()

    def _scan_cb(self, msg: LaserScan):
        with self._alive_lock:
            self._scan_time = time.monotonic()
        # Replace NaN/Inf with None so JSON serialisation is clean
        raw = msg.ranges
        ranges = [round(r, 3) if math.isfinite(r) else None for r in raw]
        with self._scan_data_lock:
            self._latest_scan = {
                "frame_id":        msg.header.frame_id,
                "angle_min":       round(msg.angle_min,       4),
                "angle_max":       round(msg.angle_max,       4),
                "angle_increment": round(msg.angle_increment, 6),
                "range_min":       round(msg.range_min,       3),
                "range_max":       round(msg.range_max,       3),
                "ranges":          ranges,
            }
            self._scan_received = True

    def get_scan(self) -> dict | None:
        with self._scan_data_lock:
            return dict(self._latest_scan) if self._scan_received else None

    def is_robot_alive(self, max_age: float = 5.0) -> dict:
        """
        True when both /global_costmap/costmap and /scan have published
        within the last max_age seconds.
        """
        now = time.monotonic()
        with self._alive_lock:
            costmap_age = (now - self._costmap_time) if self._costmap_time > 0 else None
            scan_age    = (now - self._scan_time)    if self._scan_time    > 0 else None

        costmap_ok = costmap_age is not None and costmap_age < max_age
        scan_ok    = scan_age    is not None and scan_age    < max_age

        return {
            "alive":        costmap_ok and scan_ok,
            "costmap_age_s": round(costmap_age, 2) if costmap_age is not None else None,
            "scan_age_s":    round(scan_age,    2) if scan_age    is not None else None,
        }

    def _odom_cb(self, msg: Odometry):
        qz  = msg.pose.pose.orientation.z
        qw  = msg.pose.pose.orientation.w
        yaw = 2.0 * math.atan2(qz, qw)
        with self._odom_lock:
            self._odom_x        = msg.pose.pose.position.x
            self._odom_y        = msg.pose.pose.position.y
            self._odom_yaw      = yaw
            self._odom_received = True

    def get_odom(self) -> dict | None:
        with self._odom_lock:
            if not self._odom_received:
                return None
            return {
                "x":   round(self._odom_x,   3),
                "y":   round(self._odom_y,   3),
                "yaw": round(self._odom_yaw, 4),
            }


def _dict_to_pose_stamped(pose_dict: dict) -> PoseStamped:
    """Convert a poses[] dict entry to a ROS PoseStamped message."""
    ps  = PoseStamped()
    ps.header.frame_id = pose_dict.get("header", {}).get("frame_id", "map")
    pos = pose_dict.get("pose", {}).get("position",    {})
    ori = pose_dict.get("pose", {}).get("orientation", {})
    ps.pose.position.x    = float(pos.get("x", 0.0))
    ps.pose.position.y    = float(pos.get("y", 0.0))
    ps.pose.position.z    = float(pos.get("z", 0.0))
    ps.pose.orientation.x = float(ori.get("x", 0.0))
    ps.pose.orientation.y = float(ori.get("y", 0.0))
    ps.pose.orientation.z = float(ori.get("z", 0.0))
    ps.pose.orientation.w = float(ori.get("w", 1.0))
    return ps


# =============================================================================
# FastAPI app
# =============================================================================

api_app = FastAPI()
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ros_ready = False
_node: ApiNode = None


@api_app.on_event("startup")
def on_startup():
    global _ros_ready, _node
    rclpy.init(args=None)
    _node = ApiNode()
    _ros_ready = True
    threading.Thread(target=rclpy.spin, args=(_node,), daemon=True).start()
    print(f"[gateway] ROS ready. Map bounds: "
          f"X=[{_MAP_X_MIN:.2f},{_MAP_X_MAX:.2f}] "
          f"Y=[{_MAP_Y_MIN:.2f},{_MAP_Y_MAX:.2f}] metres")
    print(f"[gateway] Map resource dir: {_MAP_RESOURCE_DIR}")
    available = [f.name for f in _MAP_RESOURCE_DIR.glob("*.pgm")] \
        if _MAP_RESOURCE_DIR.exists() else []
    print(f"[gateway] Available maps: {available}")


@api_app.on_event("shutdown")
def on_shutdown():
    global _ros_ready
    _ros_ready = False
    if _node:
        _node.destroy_node()
    rclpy.shutdown()


# =============================================================================
# Internal helpers
# =============================================================================

def _poses_to_flat_waypoints(poses: list) -> list:
    """PoseStamped list → flat waypoint dicts for runner.cpp / IterateWaypoints."""
    result = []
    for i, p in enumerate(poses):
        header   = p.get("header", {})
        pose     = p.get("pose", {})
        position = pose.get("position", {})
        orient   = pose.get("orientation", {})
        wp = {
            "x":     float(position.get("x", 0.0)),
            "y":     float(position.get("y", 0.0)),
            "z":     float(position.get("z", 0.0)),
            "qx":    float(orient.get("x", 0.0)),
            "qy":    float(orient.get("y", 0.0)),
            "qz":    float(orient.get("z", 0.0)),
            "qw":    float(orient.get("w", 1.0)),
            "frame": header.get("frame_id", "map"),
        }
        print(f"  [poses->flat] WP[{i}]: x={wp['x']} y={wp['y']} "
              f"qz={wp['qz']:.4f} qw={wp['qw']:.4f}")
        result.append(wp)
    return result


def _build_json_payload(payload: dict, poses: list) -> str:
    raw_jp = payload.get("json_payload", "")
    if isinstance(raw_jp, str) and raw_jp.strip():
        try:    config = json.loads(raw_jp)
        except: config = {}
    elif isinstance(raw_jp, dict):
        config = dict(raw_jp)
    else:
        config = {}

    for key in ("speed", "priority", "pause_ms"):
        if key in payload:
            config[key] = payload[key]
    config.setdefault("priority", "normal")
    config.setdefault("pause_ms", 500)

    if poses:
        config["waypoints"] = _poses_to_flat_waypoints(poses)

    result = json.dumps(config)
    print(f"  [json_payload] {result}")
    return result


def _first_pose_stamped(poses: list) -> PoseStamped:
    msg = PoseStamped()
    if not poses:
        return msg
    p    = poses[0]
    pos  = p.get("pose", {}).get("position", {})
    ori  = p.get("pose", {}).get("orientation", {})
    msg.header.frame_id    = p.get("header", {}).get("frame_id", "map")
    msg.pose.position.x    = float(pos.get("x", 0.0))
    msg.pose.position.y    = float(pos.get("y", 0.0))
    msg.pose.position.z    = float(pos.get("z", 0.0))
    msg.pose.orientation.x = float(ori.get("x", 0.0))
    msg.pose.orientation.y = float(ori.get("y", 0.0))
    msg.pose.orientation.z = float(ori.get("z", 0.0))
    msg.pose.orientation.w = float(ori.get("w", 1.0))
    return msg


# =============================================================================
# Lifecycle helpers
# =============================================================================

_LIFECYCLE_NODE = "/auto_localizer_lifecycle_node"
_GLOBAL_NODE    = "/global_localization_lifecycle_node"


def _lifecycle_set_node(node: str, transition: str) -> tuple[bool, str]:
    """
    Run: ros2 lifecycle set <node> <transition>
    Returns (success: bool, output: str).
    Success is True only when returncode == 0 AND stdout contains
    'Transitioning' or 'Transition successful' — ros2 CLI can exit 0
    even on soft failures so we double-check the output.
    """
    cmd = ["ros2", "lifecycle", "set", node, transition]
    print(f"  [lifecycle] running: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = (result.stdout + result.stderr).strip()
        print(f"  [lifecycle] rc={result.returncode} output: {output}")

        success = result.returncode == 0 and (
            "Transitioning" in output or
            "Transition successful" in output or
            "transition successful" in output
        )
        return success, output

    except subprocess.TimeoutExpired:
        msg = f"lifecycle set {transition} on {node} timed out after 10s"
        print(f"  [lifecycle] ERROR: {msg}")
        return False, msg

    except FileNotFoundError:
        msg = "ros2 CLI not found — is ROS 2 sourced in this environment?"
        print(f"  [lifecycle] ERROR: {msg}")
        return False, msg


def _lifecycle_set(transition: str) -> tuple[bool, str]:
    """Convenience wrapper for _LIFECYCLE_NODE (/auto_localizer_lifecycle_node)."""
    return _lifecycle_set_node(_LIFECYCLE_NODE, transition)


def _get_global_lifecycle_state() -> str:
    """
    Run: ros2 lifecycle get /global_localization_lifecycle_node
    Returns the raw state string lowercased (e.g. 'active', 'unconfigured').
    """
    cmd = ["ros2", "lifecycle", "get", _GLOBAL_NODE]
    print(f"  [lifecycle_status] running: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = (result.stdout + result.stderr).strip().lower()
        print(f"  [lifecycle_status] rc={result.returncode} output: {output}")
        return output

    except subprocess.TimeoutExpired:
        print(f"  [lifecycle_status] ERROR: lifecycle get timed out")
        return "unknown"

    except FileNotFoundError:
        print(f"  [lifecycle_status] ERROR: ros2 CLI not found")
        return "unknown"


def _check_nav_server() -> bool:
    """
    Check if /navigate_to_pose action server is available.
    Uses a short 2s timeout — non-blocking from the caller's perspective
    when run via run_in_executor.
    """
    available = _node.nav_client.wait_for_server(timeout_sec=2.0)
    print(f"  [lifecycle_status] /navigate_to_pose available: {available}")
    return available


# =============================================================================
# Routes
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
    """
    if not _ros_ready:
        raise HTTPException(status_code=503, detail="ROS not ready")

    task_id = payload.get("task_id") or str(uuid.uuid4())
    bid     = int(payload.get("id", 0))

    print(f"\n[/tasks] id={bid} behavior='{payload.get('behavior_name','')}' task={task_id}")
    print(f"  payload keys: {list(payload.keys())}")

    pixel_wps = payload.get("pixel_waypoints", [])

    if pixel_wps:
        print(f"  [path] PIXEL_WAYPOINTS ({len(pixel_wps)} wps)")
        for i, wp in enumerate(pixel_wps):
            if "col" not in wp and "x" not in wp:
                raise HTTPException(422, f"pixel_waypoints[{i}] missing 'col'")
            if "row" not in wp and "y" not in wp:
                raise HTTPException(422, f"pixel_waypoints[{i}] missing 'row'")
        print("  [conversion] pixel -> map:")
        poses = pixels_to_poses(pixel_wps)
        source = "pixel_waypoints"

    else:
        raw_poses = payload.get("poses", [])

        if raw_poses:
            poses, was_converted = _auto_convert_poses(raw_poses)
            source = "poses_auto_converted" if was_converted else "poses_map_coords"
            print(f"  [path] POSES ({len(raw_poses)} poses, source={source})")
        else:
            poses  = []
            source = "none"
            print(f"  [path] NO WAYPOINTS (id={bid} -- simple behavior or stop)")

    print(f"  [resolved] {len(poses)} pose(s) -> ROS  source={source}")

    # ── Try Hive action server first ─────────────────────────────────────────
    hive_available = _node.client.wait_for_server(timeout_sec=3.0)

    if hive_available:
        print("  [dispatch] Hive execute_behavior")
        goal               = ExecuteBehavior.Goal()
        goal.id            = bid
        goal.task_id       = task_id
        goal.behavior_name = payload.get("behavior_name", "")
        goal.json_payload  = _build_json_payload(payload, poses)

        if bid == 21 and poses:
            goal.pose = _first_pose_stamped(poses)
            print(f"  [goal.pose] x={goal.pose.pose.position.x} y={goal.pose.pose.position.y}")

        send_goal_future = _node.client.send_goal_async(goal)
        while not send_goal_future.done():
            await asyncio.sleep(0.01)

        gh = send_goal_future.result()
        if gh is None or not gh.accepted:
            raise HTTPException(status_code=500, detail="Hive goal rejected")

        print(f"  [ROS] Hive goal accepted\n")
        return {
            "accepted":       True,
            "task_id":        task_id,
            "behavior":       goal.behavior_name or f"id_{goal.id}",
            "waypoint_count": len(poses) if bid in (21, 22) else None,
            "source":         source,
            "nav_mode":       "hive",
        }

    # ── Fallback: Nav2 NavigateThroughPoses ──────────────────────────────────
    print("  [dispatch] Hive unavailable — falling back to Nav2 NavigateThroughPoses")

    if not poses:
        raise HTTPException(status_code=503,
                            detail="Hive server unavailable and no waypoints to navigate")

    if not _node.nav_through_client.wait_for_server(timeout_sec=3.0):
        raise HTTPException(status_code=503,
                            detail="Neither Hive nor Nav2 NavigateThroughPoses is available")

    nav_goal        = NavigateThroughPoses.Goal()
    nav_goal.poses  = [_dict_to_pose_stamped(p) for p in poses]
    nav_goal.behavior_tree = ""

    print(f"  [Nav2] sending {len(nav_goal.poses)} pose(s) to /navigate_through_poses")
    for i, ps in enumerate(nav_goal.poses):
        print(f"    WP[{i}]: x={ps.pose.position.x:.3f} y={ps.pose.position.y:.3f}")

    send_goal_future = _node.nav_through_client.send_goal_async(nav_goal)
    while not send_goal_future.done():
        await asyncio.sleep(0.01)

    gh = send_goal_future.result()
    if gh is None or not gh.accepted:
        raise HTTPException(status_code=500, detail="Nav2 goal rejected")

    print(f"  [ROS] Nav2 goal accepted\n")
    return {
        "accepted":       True,
        "task_id":        task_id,
        "behavior":       "NavigateThroughPoses",
        "waypoint_count": len(poses),
        "source":         source,
        "nav_mode":       "nav2_direct",
    }


@api_app.get("/localization")
async def get_localization():
    """
    Returns the robot's current pose from /amcl_pose topic,
    converted to source-image pixel coordinates (col, row) + yaw_deg.

    Response:
        {
          "col":       254.2,   # source-image pixel column
          "row":       389.1,   # source-image pixel row
          "yaw_deg":   45.0,    # heading in degrees (ROS CCW-positive)
          "map_x":     2.81,    # map-frame metres (for debug)
          "map_y":     0.95,
          "timestamp": 1719...  # unix epoch ms
        }

    curl http://10.10.0.200:1717/localization
    """
    if not _ros_ready or _node is None:
        return {"available": False, "reason": "ROS not ready"}

    loc = _node.get_localization()
    if loc is None:
        return {"available": False, "reason": "No localization data (topic silent or stale)"}

    pos = loc["position"]
    ori = loc["orientation"]
    map_x = float(pos["x"])
    map_y = float(pos["y"])

    col, row = map_to_pixel(map_x, map_y)
    yaw_deg  = quat_to_yaw_deg(float(ori["z"]), float(ori["w"]))

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
        **MAP_META,
        "bounds": {
            "x": [_MAP_X_MIN, _MAP_X_MAX],
            "y": [_MAP_Y_MIN, _MAP_Y_MAX],
        }
    }


@api_app.post("/map/preview")
async def preview_pixel_conversion(payload: dict):
    """
    Dry-run conversion without dispatching to ROS.
    Accepts pixel_waypoints[] OR poses[] (auto-detects format).

    curl -X POST http://10.10.0.200:1717/map/preview \\
      -H 'Content-Type: application/json' \\
      -d '{"pixel_waypoints":[{"col":254,"row":389,"yaw_deg":-3}]}'
    """
    pixel_wps = payload.get("pixel_waypoints", [])
    raw_poses = payload.get("poses", [])

    if pixel_wps:
        poses, source = pixels_to_poses(pixel_wps), "pixel_waypoints"
    elif raw_poses:
        poses, was_converted = _auto_convert_poses(raw_poses)
        source = "poses_auto_converted" if was_converted else "poses_map_coords"
    else:
        raise HTTPException(422, "Provide pixel_waypoints[] or poses[]")

    return {"poses": poses, "source": source, "map_meta": MAP_META}


@api_app.get("/ping")
async def ping():
    return {"status": "ok"}


@api_app.websocket("/api/telemetry")
async def telemetry_ws(ws: WebSocket):
    """
    Push /odom position + yaw to the frontend at ~10 Hz.

    Frame sent every 100 ms:
        {"type": "telemetry", "x": 1.23, "y": -0.45, "theta": 0.78}

    theta is yaw in radians (ROS convention, CCW-positive).
    """
    await ws.accept()
    try:
        while True:
            if _ros_ready and _node:
                odom = _node.get_odom()
                if odom:
                    await ws.send_json({
                        "type":  "telemetry",
                        "x":     odom["x"],
                        "y":     odom["y"],
                        "theta": odom["yaw"],
                    })
            await asyncio.sleep(0.1)   # 10 Hz push rate
    except (WebSocketDisconnect, Exception):
        pass


@api_app.websocket("/api/localisation")
async def localisation_ws(ws: WebSocket):
    """
    Push the robot's AMCL pose (/amcl_pose) to the frontend at ~5 Hz.

    Frame sent every 200 ms (only when a fresh pose is available):
        {"type": "localisation", "x": 1.23, "y": -0.45, "yaw": 0.78,
         "frame_id": "map", "age_s": 0.12}

    yaw is radians (ROS convention, CCW-positive), derived from the
    pose quaternion. The frontend draws this as a blinking GPS-style
    position marker on the map canvas.
    """
    await ws.accept()
    try:
        while True:
            if _ros_ready and _node:
                loc = _node.get_localization()
                if loc:
                    q = loc["orientation"]
                    yaw = math.atan2(
                        2.0 * (q["w"] * q["z"] + q["x"] * q["y"]),
                        1.0 - 2.0 * (q["y"] ** 2 + q["z"] ** 2),
                    )
                    await ws.send_json({
                        "type":     "localisation",
                        "x":        loc["position"]["x"],
                        "y":        loc["position"]["y"],
                        "yaw":      yaw,
                        "frame_id": loc["frame_id"],
                        "age_s":    loc["age_s"],
                    })
            await asyncio.sleep(0.2)   # 5 Hz — AMCL publishes on motion
    except (WebSocketDisconnect, Exception):
        pass


@api_app.websocket("/api/scan")
async def scan_ws(ws: WebSocket):
    """
    Push /scan (LaserScan) data to the frontend at 1 Hz.

    Frame sent every 1 s:
        {
          "type": "scan",
          "frame_id": "base_scan",
          "angle_min": -3.1416,
          "angle_max":  3.1416,
          "angle_increment": 0.017453,
          "range_min": 0.15,
          "range_max": 12.0,
          "ranges": [1.23, null, 0.98, ...]   # null = invalid beam
        }
    """
    await ws.accept()
    try:
        while True:
            if _ros_ready and _node:
                scan = _node.get_scan()
                if scan:
                    await ws.send_json({"type": "scan", **scan})
            await asyncio.sleep(1.0)   # 1 Hz — scan data is large, no need faster
    except (WebSocketDisconnect, Exception):
        pass


@api_app.get("/health")
async def health():
    """
    Returns gateway + robot liveness.

    robot_alive is True only when BOTH /global_costmap/costmap and /scan
    have published within the last 5 seconds — confirming the Nav2 stack
    and the LiDAR sensor are actively running.

    curl http://10.10.0.200:1717/health
    """
    status = _node.is_robot_alive() if (_ros_ready and _node) else {
        "alive": False, "costmap_age_s": None, "scan_age_s": None
    }

    return {
        "ros_ready":    _ros_ready,
        "robot_alive":  status["alive"],
        "topics": {
            "/global_costmap/costmap": status["costmap_age_s"],
            "/scan":                   status["scan_age_s"],
        },
    }


# =============================================================================
# Map image endpoints
# =============================================================================

@api_app.get("/api/map")
async def get_robot_map():
    """
    Serve the robot's operational map.pgm as a PNG image.

    Map folder is set by ROBOT_MAP_DIR env var
    (default: /home/darshan/appstore/map).

    curl http://localhost:1717/api/map --output map.png
    """
    pgm_path = _ROBOT_MAP_DIR / "map.pgm"
    if not pgm_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"map.pgm not found in {_ROBOT_MAP_DIR}. "
                   f"Set ROBOT_MAP_DIR env var to the correct folder."
        )
    img = Image.open(str(pgm_path))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Cache-Control": "no-cache"},
    )


@api_app.get("/api/map/meta")
async def get_robot_map_meta():
    """
    Return map.yaml metadata (resolution, origin) for the operational map.

    curl http://localhost:1717/api/map/meta
    """
    yaml_path = _ROBOT_MAP_DIR / "map.yaml"
    meta: dict = {
        "resolution": 0.05,
        "origin_x":   -10.0,
        "origin_y":   -10.0,
        "map_dir":    str(_ROBOT_MAP_DIR),
        "pgm_exists": (_ROBOT_MAP_DIR / "map.pgm").exists(),
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
    """
    Serve any .pgm map image from the package resource folder as PNG.

    Default:        http://10.10.0.200:1717/map_image
    Specific file:  http://10.10.0.200:1717/map_image?file=other_map.pgm
    List available: http://10.10.0.200:1717/map_image/list
    """
    if "/" in file or "\\" in file or not file.endswith(".pgm"):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename — must be a .pgm file with no path separators"
        )

    image_path = _MAP_RESOURCE_DIR / file

    if not image_path.exists():
        available = [f.name for f in _MAP_RESOURCE_DIR.glob("*.pgm")] \
            if _MAP_RESOURCE_DIR.exists() else []
        raise HTTPException(
            status_code=404,
            detail={
                "error":     f"'{file}' not found in resource folder",
                "available": available,
            }
        )

    print(f"[/map_image] converting and serving {image_path}")

    img = Image.open(str(image_path))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@api_app.get("/map_image/list")
async def list_map_images():
    """
    List all available .pgm map images in the resource folder.

    curl http://10.10.0.200:1717/map_image/list
    """
    if not _MAP_RESOURCE_DIR.exists():
        return {"maps": [], "count": 0}

    files = [f.name for f in _MAP_RESOURCE_DIR.glob("*.pgm")]

    return {
        "maps":  files,
        "count": len(files),
    }


# =============================================================================
# Lifecycle endpoints
# =============================================================================

@api_app.get("/lifecycle_status")
async def lifecycle_status():
    """
    Returns live status of SLAM and NAV systems.

    SLAM_status: ON  → /global_localization_lifecycle_node is 'active'
    SLAM_status: OFF → /global_localization_lifecycle_node is 'unconfigured' or anything else
    NAV_status:  ON  → /navigate_to_pose action server is reachable
    NAV_status:  OFF → /navigate_to_pose action server is not reachable

    curl http://10.10.0.200:1717/lifecycle_status
    """
    loop = asyncio.get_event_loop()

    # Run both checks concurrently to keep response fast
    slam_state_task = loop.run_in_executor(None, _get_global_lifecycle_state)
    nav_check_task  = loop.run_in_executor(None, _check_nav_server)

    slam_state, nav_available = await asyncio.gather(slam_state_task, nav_check_task)

    # SLAM ON only if state is 'active'
    slam_status = "ON" if "active" in slam_state else "OFF"
    nav_status  = "ON" if nav_available else "OFF"

    print(f"  [lifecycle_status] SLAM={slam_status} (raw='{slam_state}')  NAV={nav_status}")

    return {
        "SLAM_status": slam_status,
        "NAV_status":  nav_status,
    }


@api_app.post("/lifecycle_start")
async def lifecycle_start(payload: dict = {}):
    """
    Full lifecycle start sequence:
      1. Activate /auto_localizer_lifecycle_node
         (on failure: deactivate → retry activate)
      2. Configure /global_localization_lifecycle_node
      3. Activate /global_localization_lifecycle_node

    curl -X POST http://10.10.0.200:1717/lifecycle_start
    """
    loop = asyncio.get_event_loop()

    # ── Step 1: activate auto_localizer ──────────────────────────────
    print(f"\n[/lifecycle_start] step 1 — activate {_LIFECYCLE_NODE}")

    ok, out = await loop.run_in_executor(None, _lifecycle_set, "activate")

    if not ok:
        print(f"  [lifecycle_start] activate failed — trying deactivate → activate ...")

        await loop.run_in_executor(None, _lifecycle_set, "deactivate")

        ok, out = await loop.run_in_executor(None, _lifecycle_set, "activate")

        if not ok:
            print(f"  [lifecycle_start] both activate attempts failed")
            raise HTTPException(
                status_code=500,
                detail={
                    "error":  "Failed to activate /auto_localizer_lifecycle_node after retry",
                    "node":   _LIFECYCLE_NODE,
                    "detail": out,
                }
            )

    print(f"  [lifecycle_start] step 1 done")

    # ── Step 2: configure global_localization ─────────────────────────
    print(f"  [lifecycle_start] step 2 — configure {_GLOBAL_NODE}")

    ok_cfg, out_cfg = await loop.run_in_executor(
        None, lambda: _lifecycle_set_node(_GLOBAL_NODE, "configure")
    )

    if not ok_cfg:
        print(f"  [lifecycle_start] configure {_GLOBAL_NODE} failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error":  "Failed to configure /global_localization_lifecycle_node",
                "node":   _GLOBAL_NODE,
                "detail": out_cfg,
            }
        )

    print(f"  [lifecycle_start] step 2 done")

    # ── Step 3: activate global_localization ──────────────────────────
    print(f"  [lifecycle_start] step 3 — activate {_GLOBAL_NODE}")

    ok_act, out_act = await loop.run_in_executor(
        None, lambda: _lifecycle_set_node(_GLOBAL_NODE, "activate")
    )

    if not ok_act:
        print(f"  [lifecycle_start] activate {_GLOBAL_NODE} failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error":  "Failed to activate /global_localization_lifecycle_node",
                "node":   _GLOBAL_NODE,
                "detail": out_act,
            }
        )

    print(f"  [lifecycle_start] step 3 done — all steps complete\n")

    return {
        "accepted": True,
        "action":   "lifecycle_start",
        "steps": [
            {"node": _LIFECYCLE_NODE, "transition": "activate",  "ok": True, "detail": out},
            {"node": _GLOBAL_NODE,    "transition": "configure", "ok": True, "detail": out_cfg},
            {"node": _GLOBAL_NODE,    "transition": "activate",  "ok": True, "detail": out_act},
        ],
    }


@api_app.post("/lifecycle_stop")
async def lifecycle_stop(payload: dict = {}):
    """
    Full lifecycle stop sequence:
      1. Deactivate /global_localization_lifecycle_node
      2. Cleanup /global_localization_lifecycle_node

    curl -X POST http://10.10.0.200:1717/lifecycle_stop
    """
    loop = asyncio.get_event_loop()

    # ── Step 1: deactivate global_localization ────────────────────────
    print(f"\n[/lifecycle_stop] step 1 — deactivate {_GLOBAL_NODE}")

    ok_deact, out_deact = await loop.run_in_executor(
        None, lambda: _lifecycle_set_node(_GLOBAL_NODE, "deactivate")
    )

    if not ok_deact:
        print(f"  [lifecycle_stop] deactivate {_GLOBAL_NODE} failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error":  "Failed to deactivate /global_localization_lifecycle_node",
                "node":   _GLOBAL_NODE,
                "detail": out_deact,
            }
        )

    print(f"  [lifecycle_stop] step 1 done")

    # ── Step 2: cleanup global_localization ───────────────────────────
    print(f"  [lifecycle_stop] step 2 — cleanup {_GLOBAL_NODE}")

    ok_clean, out_clean = await loop.run_in_executor(
        None, lambda: _lifecycle_set_node(_GLOBAL_NODE, "cleanup")
    )

    if not ok_clean:
        print(f"  [lifecycle_stop] cleanup {_GLOBAL_NODE} failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error":  "Failed to cleanup /global_localization_lifecycle_node",
                "node":   _GLOBAL_NODE,
                "detail": out_clean,
            }
        )

    print(f"  [lifecycle_stop] step 2 done — all steps complete\n")

    return {
        "accepted": True,
        "action":   "lifecycle_stop",
        "steps": [
            {"node": _GLOBAL_NODE, "transition": "deactivate", "ok": True, "detail": out_deact},
            {"node": _GLOBAL_NODE, "transition": "cleanup",    "ok": True, "detail": out_clean},
        ],
    }


# =============================================================================
# Entry point
# =============================================================================

def main():
    uvicorn.run(api_app, host="0.0.0.0", port=APP_PORT, log_level="info", access_log=False)

if __name__ == "__main__":
    main()