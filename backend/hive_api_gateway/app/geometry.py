"""
Pixel <-> map-frame coordinate math + waypoint payload shaping.

Pure functions, zero ROS dependency — this is exactly why it stays in the
gateway rather than moving into hive_mqtt_bridge: it's the business logic
that gets iterated on, and it's now trivially unit-testable without a ROS
environment (no rclpy import anywhere in this module).
"""
import math

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
MAP_X_MIN = MAP_META["origin_x"]
MAP_X_MAX = MAP_META["origin_x"] + MAP_META["img_w_px"] * MAP_META["resolution"]
MAP_Y_MIN = MAP_META["origin_y"]
MAP_Y_MAX = MAP_META["origin_y"] + MAP_META["img_h_px"] * MAP_META["resolution"]


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
    """ROS map-frame metres → source-image pixel (col, row). Inverse of pixel_to_map."""
    res = MAP_META["resolution"]
    col = round((map_x - MAP_META["origin_x"]) / res, 1)
    row = round(MAP_META["img_h_px"] - 1 - (map_y - MAP_META["origin_y"]) / res, 1)
    return col, row


def yaw_deg_to_quat(yaw_deg: float) -> dict:
    """Yaw degrees → unit quaternion (zero roll/pitch, ROS CCW-positive)."""
    r = math.radians(yaw_deg)
    return {"x": 0.0, "y": 0.0, "z": round(math.sin(r / 2.0), 6), "w": round(math.cos(r / 2.0), 6)}


def quat_to_yaw_deg(qz: float, qw: float) -> float:
    """Quaternion z,w → yaw degrees."""
    return round(math.degrees(2.0 * math.atan2(qz, qw)), 2)


def looks_like_pixels(x: float, y: float) -> bool:
    """True if (x, y) fall outside the valid map bounds — i.e. look like pixel coords."""
    x_out = not (MAP_X_MIN <= x <= MAP_X_MAX)
    y_out = not (MAP_Y_MIN <= y <= MAP_Y_MAX)
    return x_out or y_out


def pixels_to_poses(pixel_waypoints: list) -> list:
    """
    Convert pixel-space waypoint list to ROS PoseStamped-shaped dicts.

    Input:  [{"col": 254, "row": 389, "yaw_deg": -3}, ...]
    Output: [{"header":{"frame_id":"map"}, "pose":{"position":{...}, "orientation":{...}}}, ...]
    """
    poses = []
    for wp in pixel_waypoints:
        col     = float(wp.get("col", wp.get("x", 0)))
        row     = float(wp.get("row", wp.get("y", 0)))
        yaw_deg = float(wp.get("yaw_deg", 0.0))
        frame   = wp.get("frame_id", MAP_META["frame_id"])

        map_x, map_y = pixel_to_map(col, row)
        quat         = yaw_deg_to_quat(yaw_deg)

        poses.append({
            "header": {"frame_id": frame},
            "pose": {
                "position":    {"x": map_x, "y": map_y, "z": 0.0},
                "orientation": quat,
            },
        })
    return poses


def auto_convert_poses(poses: list) -> tuple[list, bool]:
    """
    Inspect poses[] from the client. If ANY pose contains coordinates
    outside valid map bounds, treat ALL poses as pixel-space and convert.

    Returns: (converted_poses, was_converted: bool)
    """
    if not poses:
        return poses, False

    first_pos = poses[0].get("pose", {}).get("position", {})
    x = float(first_pos.get("x", 0.0))
    y = float(first_pos.get("y", 0.0))

    if not looks_like_pixels(x, y):
        return poses, False

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

    return pixels_to_poses(pixel_wps), True
