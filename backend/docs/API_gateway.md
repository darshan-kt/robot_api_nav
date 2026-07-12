# Hive API Gateway — Reference Document

**Base URL:** `http://10.10.0.200:1717`  
**Protocol:** HTTP/REST  
**Format:** JSON  

---

## Overview

The Hive API Gateway bridges HTTP clients and a ROS 2 robot system. It accepts navigation tasks and behavior commands via POST, and exposes robot state via GET endpoints.

---

## POST Endpoints (Incoming)

### `POST /tasks`
Sends a behavior or navigation task to the robot via ROS 2 action server.

#### Minimum Valid Request — Hardcoded Waypoints
The robot uses its own internally defined waypoints for the given behavior ID.

```bash
curl -X POST http://10.10.0.200:1717/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": 2}'
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | int | ✅ Yes | Behavior ID |
| `task_id` | string | ❌ No | Auto-generated UUID if omitted |
| `behavior_name` | string | ❌ No | Falls back to `"id_<n>"` if omitted |

---

#### Emergency Stop
```bash
curl -X POST http://10.10.0.200:1717/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": 10, "behavior_name": "StopNow"}'
```

> ⚠️ Use `behavior_name` for intent — unknown keys like `"note"` are silently ignored by the script.

---

#### Multiple Waypoints (FollowRoute)
Sends a sequence of poses to the robot. Pixel-range coordinates are auto-detected and converted to map-frame metres.

```bash
curl -X POST http://10.10.0.200:1717/tasks \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 22,
    "behavior_name": "FollowRoute",
    "task_id": "route_abc123",
    "poses": [
      {
        "header": {"frame_id": "map"},
        "pose": {
          "position": {"x": 320, "y": 240, "z": 0.0},
          "orientation": {"x": 0, "y": 0, "z": 0.707, "w": 0.707}
        }
      }
    ],
    "json_payload": "{\"speed\": 0.8, \"priority\": \"normal\"}"
  }'
```

| Field | Type | Description |
|---|---|---|
| `id` | int | Behavior ID (22 = FollowRoute) |
| `behavior_name` | string | Name of behavior |
| `task_id` | string | Unique task identifier |
| `poses` | array | List of map-frame or pixel poses |
| `pixel_waypoints` | array | Pixel coordinate waypoints `{col, row, yaw_deg}` |
| `json_payload` | string | JSON string with `speed`, `priority`, `pause_ms` |

**Pose auto-detection:** If `x/y` values fall outside map bounds, they are automatically treated as pixel coordinates and converted to map-frame metres.

---

#### Successful Response
```json
{
  "accepted": true,
  "task_id": "route_abc123",
  "behavior": "FollowRoute",
  "waypoint_count": 1,
  "source": "poses_auto_converted"
}
```

---

### `POST /map/preview`
Dry-run coordinate converter. Tests pixel ↔ map conversion **without sending anything to the robot.**

```bash
curl -X POST http://10.10.0.200:1717/map/preview \
  -H 'Content-Type: application/json' \
  -d '{
    "pixel_waypoints": [{"col": 254, "row": 389, "yaw_deg": 45.0}]
  }'
```

**Response:**
```json
{
  "poses": [
    {
      "header": {"frame_id": "map"},
      "pose": {
        "position": {"x": 2.81, "y": 0.95, "z": 0.0},
        "orientation": {"x": 0.0, "y": 0.0, "z": 0.383, "w": 0.924}
      }
    }
  ],
  "source": "pixel_waypoints",
  "map_meta": {}
}
```

> Use this endpoint to verify coordinates are correct before sending a real `/tasks` request.

---

## GET Endpoints (Outgoing)

### `GET /health`
Returns whether the ROS 2 connection is active.

```bash
GET http://10.10.0.200:1717/health
```

```json
{"ros_ready": true}
```

---

### `GET /localization`
Returns the robot's current position, converted from ROS map-frame metres to image pixel coordinates.

```bash
GET http://10.10.0.200:1717/localization
```

```json
{
  "col": 254.2,
  "row": 389.1,
  "yaw_deg": 45.0,
  "map_x": 2.81,
  "map_y": 0.95,
  "timestamp": 1719000000000
}
```

| Field | Description |
|---|---|
| `col` | Image pixel column |
| `row` | Image pixel row |
| `yaw_deg` | Heading in degrees (ROS CCW-positive) |
| `map_x / map_y` | Raw map-frame metres (debug) |
| `timestamp` | Unix epoch milliseconds |

> Returns `{"available": false, "reason": "..."}` if ROS is not ready or pose data is older than 10 seconds.

---

### `GET /map/meta`
Returns the static map configuration used for all coordinate conversions.

```bash
GET http://10.10.0.200:1717/map/meta
```

```json
{
  "resolution": 0.05,
  "origin_x": -9.9,
  "origin_y": -14.85,
  "img_w_px": 513,
  "img_h_px": 706,
  "frame_id": "map",
  "bounds": {
    "x": [-9.9, 15.75],
    "y": [-14.85, 20.45]
  }
}
```

---

## Quick Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/tasks` | Send task or behavior to robot |
| POST | `/map/preview` | Test coordinate conversion (no robot movement) |
| GET | `/health` | ROS connection status |
| GET | `/localization` | Robot's current live position |
| GET | `/map/meta` | Map bounds and metadata |

---

## ⚠️ Caution — Hardcoded Map Metadata

The map parameters used for **all coordinate conversions** are hardcoded directly in the script:

```python
MAP_META = {
    "resolution": 0.05,
    "origin_x":  -9.9,
    "origin_y":  -14.85,
    "img_w_px":   513,
    "img_h_px":   706,
    "frame_id":  "map",
}
```

### Risks
- If the map is updated (rescaled, re-originated, or replaced), **all coordinate conversions will be silently wrong** — the API will still accept requests and return no errors, but the robot will navigate to incorrect positions.
- There is no validation that these values match the actual map file (`new_office_map.yaml`) at runtime.
- Any developer must remember to manually update this block whenever the map changes.

---

## 💡 Ideas to Replace the Hardcoded Map

### Option 1 — Read the YAML file at startup *(easiest)*
Parse `new_office_map.yaml` when the server starts and populate `MAP_META` dynamically:
```python
import yaml
with open("new_office_map.yaml") as f:
    map_yaml = yaml.safe_load(f)
MAP_META["resolution"] = map_yaml["resolution"]
MAP_META["origin_x"]   = map_yaml["origin"][0]
MAP_META["origin_y"]   = map_yaml["origin"][1]
```
The map file path could be passed as an environment variable or CLI argument.

---

### Option 2 — Subscribe to `/map` ROS topic *(most robust)*
Subscribe to the ROS `nav_msgs/OccupancyGrid` topic which carries live map metadata:
```python
from nav_msgs.msg import OccupancyGrid
self.create_subscription(OccupancyGrid, '/map', self._map_cb, 1)
```
This means `MAP_META` is always in sync with whatever map ROS is actually using — no manual updates ever needed.

---

### Option 3 — Environment variables *(good for deployment)*
Pass map parameters as environment variables so they can be changed without editing code:
```bash
MAP_RESOLUTION=0.05 MAP_ORIGIN_X=-9.9 MAP_ORIGIN_Y=-14.85 python gateway.py
```
```python
import os
MAP_META["resolution"] = float(os.getenv("MAP_RESOLUTION", 0.05))
MAP_META["origin_x"]   = float(os.getenv("MAP_ORIGIN_X", -9.9))
```

---

### Option 4 — POST endpoint to update map at runtime
Add an admin endpoint that lets an operator push new map metadata without restarting the server:
```
POST /map/meta
{"resolution": 0.05, "origin_x": -10.5, "origin_y": -15.0, "img_w_px": 520, "img_h_px": 710}
```

---

### Recommendation

| Scenario | Best Option |
|---|---|
| Simple single-map deployment | Option 1 — Read YAML at startup |
| Dynamic maps / multi-floor | Option 2 — ROS `/map` topic |
| Docker / containerised deployment | Option 3 — Environment variables |
| Ops team needs runtime control | Option 4 — Admin POST endpoint |
