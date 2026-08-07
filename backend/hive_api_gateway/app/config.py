"""
Environment-driven config. This is the entire "deployment surface" of the
gateway now — no ROS_DOMAIN_ID, no RMW_IMPLEMENTATION, no colcon build-base
vars. Point MQTT_HOST at a different broker and the gateway runs anywhere.
"""
import os
from pathlib import Path

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

# Operational map folder (map.pgm + map.yaml) — override with ROBOT_MAP_DIR
ROBOT_MAP_DIR = os.environ.get('ROBOT_MAP_DIR', '/home/darshan/appstore/map')

# Bundled .pgm map images shipped alongside this package (used by
# /map_image). Used to be resolved via ament_index_python's
# get_package_share_directory() — this is no longer a ROS/colcon package,
# so it's just a path relative to this file.
MAP_RESOURCE_DIR = Path(__file__).resolve().parent.parent / "resource"

# How long /tasks waits for the bridge's task/ack before giving up and
# returning 504 to the client (the bridge itself already applies a 3s
# wait_for_server timeout per nav stack, so 8s covers Hive AND the Nav2
# fallback path with margin).
TASK_ACK_TIMEOUT_S = 8.0

# /nav_goal — same 3s wait_for_server margin reasoning as TASK_ACK_TIMEOUT_S,
# just for the (usually already-up) NavigateThroughPoses server alone.
GOAL_ACK_TIMEOUT_S = 6.0

# /cancel_nav — no wait_for_server involved, cancellation should be near
# instant; short timeout mostly guards against a wedged MQTT link.
CANCEL_ACK_TIMEOUT_S = 5.0

# hive_camera_bridge's WebRTC signaling endpoint (backend/hive_camera_bridge).
# /webrtc/offer proxies the browser's SDP offer here — see that module's
# docstring for why signaling is proxied but the video itself isn't.
CAMERA_BRIDGE_URL     = os.environ.get('CAMERA_BRIDGE_URL', 'http://localhost:8766')
CAMERA_OFFER_TIMEOUT_S = 6.0


def topic(suffix: str) -> str:
    return f'{TOPIC_PREFIX}/{suffix}'
