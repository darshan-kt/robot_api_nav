"""
Environment-driven config. This is the entire "deployment surface" of the
gateway now — no ROS_DOMAIN_ID, no RMW_IMPLEMENTATION, no colcon build-base
vars. Point MQTT_HOST at a different broker and the gateway runs anywhere.
"""
import os
from pathlib import Path
from typing import Optional

APP_PORT   = int(os.environ.get('APP_PORT', '1717'))

# Comma-separated allowed origins for the browser-facing API, e.g.
# "https://appstore.example.com,https://ops.example.com". Defaults to "*"
# (any origin) — fine on a private LAN where the only thing that can reach
# this port is already trusted, wrong the moment this is reachable from the
# public internet (see README's AWS deployment section).
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', '*').split(',') if o.strip()
] or ['*']

MQTT_HOST     = os.environ.get('MQTT_HOST', 'localhost')
MQTT_PORT     = int(os.environ.get('MQTT_PORT', '1883'))
MQTT_USERNAME = os.environ.get('MQTT_USERNAME') or None
MQTT_PASSWORD = os.environ.get('MQTT_PASSWORD') or None

ROBOT_ID     = os.environ.get('ROBOT_ID', 'robot-1')
TOPIC_PREFIX = f'hive/{ROBOT_ID}'

# Operational map folder — override with ROBOT_MAP_DIR. No fixed filename is
# required inside it; see resolve_map_files() below for how the active
# .pgm/.yaml pair is picked.
ROBOT_MAP_DIR = os.environ.get('ROBOT_MAP_DIR', '/home/darshan/appstore/map')


def resolve_map_files(map_dir: Path) -> tuple[Optional[Path], Optional[Path]]:
    """
    Auto-discover the active map .pgm + its .yaml sidecar inside map_dir —
    no more assuming the files are literally named "map.pgm"/"map.yaml".
    Drop any renamed map (e.g. home.pgm + home.yaml) straight into
    ROBOT_MAP_DIR and this picks it up, no config change needed.

    A .yaml's `image:` field is authoritative for which .pgm it describes
    (standard ROS map_server convention) — so if a .yaml resolves to a real
    .pgm next to it, that pair wins. Multiple .yaml files are broken ties by
    most-recently-modified (the last map you dropped in). Only non-recursive:
    subfolders like map/backup_maps/ are ignored, so old maps can be parked
    there without becoming ambiguous candidates.
    """
    if not map_dir.exists():
        return None, None

    yaml_files = sorted(map_dir.glob('*.yaml'), key=lambda p: p.stat().st_mtime, reverse=True)
    pgm_files  = sorted(map_dir.glob('*.pgm'),  key=lambda p: p.stat().st_mtime, reverse=True)

    for yaml_path in yaml_files:
        try:
            import yaml as _yaml
            with open(yaml_path) as f:
                image_name = (_yaml.safe_load(f) or {}).get('image')
        except Exception:
            image_name = None
        if not image_name:
            continue
        pgm_path = (map_dir / image_name).resolve()
        if pgm_path.exists():
            return pgm_path, yaml_path

    # No .yaml pointed at a real .pgm (or none exist) — fall back to
    # whichever files are simply newest, so a bare .pgm still gets served.
    return (pgm_files[0] if pgm_files else None), (yaml_files[0] if yaml_files else None)


# Bundled .pgm map images shipped alongside this package (used by
# /map_image). Used to be resolved via ament_index_python's
# get_package_share_directory() — this is no longer a ROS/colcon package,
# so it's just a path relative to this file.
MAP_RESOURCE_DIR = Path(__file__).resolve().parent.parent / "resource"

# How long /tasks waits for the bridge's task/ack before giving up and
# returning 504 to the client (the bridge itself already applies a 3s
# wait_for_server timeout per nav stack, so this covers Hive AND the Nav2
# fallback path with margin). Widened past the old 8s so an AWS round trip
# (gateway -> broker -> bridge -> broker -> gateway) has real headroom
# instead of racing a tight local-network budget.
TASK_ACK_TIMEOUT_S = 15.0

# /nav_goal — the bridge itself now just checks for a /goal_pose subscriber
# and publishes (near-instant, no action handshake to wait on), so this
# budget is really just the MQTT round trip. Widened from 6s so a slow/lossy
# AWS hop doesn't 504 a goal the bridge already accepted.
GOAL_ACK_TIMEOUT_S = 12.0

# /cancel_nav — no wait_for_server involved, cancellation should be near
# instant; widened from 5s for the same AWS round-trip margin as the above,
# not because cancellation itself got slower.
CANCEL_ACK_TIMEOUT_S = 10.0

# /webrtc/offer relays the browser's SDP offer to hive_camera_bridge over
# MQTT (cmd/webrtc_offer -> webrtc/answer), same as every other robot-bound
# command — see mqtt_client.publish_webrtc_offer's docstring. This is how
# long to wait for the bridge's answer before giving up.
CAMERA_OFFER_TIMEOUT_S = 6.0


def topic(suffix: str) -> str:
    return f'{TOPIC_PREFIX}/{suffix}'
