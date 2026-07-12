# Hive API Gateway — Developer Reference

**Host:** `10.10.0.200` · **Port:** `1717` · **Stack:** FastAPI + ROS 2 Humble

---

## Overview

The Hive API Gateway is an HTTP server that bridges external clients (webapp, curl, scripts) to the ROS 2 robot system. It handles task dispatching, coordinate conversion, map serving, and lifecycle management of SLAM and navigation nodes.

```
Client  ──HTTP──▶  FastAPI Gateway (:1717)  ──ROS 2──▶  Hive Robot
```

---

## Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | ROS readiness check |
| `POST` | `/tasks` | Dispatch a robot behavior / navigation task |
| `GET` | `/map/meta` | Map metadata and coordinate bounds |
| `POST` | `/map/preview` | Dry-run pixel → map coordinate conversion |
| `GET` | `/map_image` | Serve a `.pgm` map file rendered as PNG |
| `GET` | `/map_image/list` | List all available `.pgm` map files |
| `GET` | `/lifecycle_status` | Live SLAM and NAV status |
| `POST` | `/lifecycle_start` | Start SLAM and localization nodes |
| `POST` | `/lifecycle_stop` | Stop and clean up localization nodes |

---

## Endpoints

### `GET /health`

Returns whether the ROS 2 node is ready.

```bash
curl http://10.10.0.200:1717/health
```

```json
{ "ros_ready": true }
```

---

### `POST /tasks`

Dispatches a behavior or navigation task to the robot. Accepts waypoints in three formats — pixel coordinates are auto-detected and converted to ROS map-frame metres.

**Input formats:**

| Format | Key Field | Notes |
|--------|-----------|-------|
| Pixel waypoints | `pixel_waypoints[]` | Preferred. Fields: `col`, `row`, `yaw_deg` |
| Poses with pixels | `poses[]` | Auto-detected when coords fall outside map bounds |
| Poses with map metres | `poses[]` | Real ROS coords, passed through unchanged |

**Example:**

```bash
curl -X POST http://10.10.0.200:1717/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": 22,
    "behavior_name": "FollowRoute",
    "pixel_waypoints": [
      { "col": 254, "row": 389, "yaw_deg": -3 },
      { "col": 310, "row": 420, "yaw_deg": 0  }
    ]
  }'
```

**Response:**

```json
{
  "accepted":       true,
  "task_id":        "a3f1c2d4-...",
  "behavior":       "FollowRoute",
  "waypoint_count": 2,
  "source":         "pixel_waypoints"
}
```

---

### `GET /map/meta`

Returns the active map metadata and valid coordinate bounds.

```bash
curl http://10.10.0.200:1717/map/meta
```

```json
{
  "resolution": 0.05,
  "origin_x":   -9.9,
  "origin_y":   -14.85,
  "img_w_px":   513,
  "img_h_px":   706,
  "frame_id":   "map",
  "bounds": {
    "x": [-9.9,  15.75],
    "y": [-14.85, 20.45]
  }
}
```

**Conversion formula:**
```
map_x = origin_x + col * resolution
map_y = origin_y + (img_h - 1 - row) * resolution
```
> Y is flipped — row 0 (top of image) = maximum map Y.

---

### `POST /map/preview`

Dry-run coordinate conversion without sending any command to the robot. Use this to verify pixel → map conversion before sending real tasks.

```bash
curl -X POST http://10.10.0.200:1717/map/preview \
  -H "Content-Type: application/json" \
  -d '{"pixel_waypoints": [{"col": 254, "row": 389, "yaw_deg": -3}]}'
```

```json
{
  "poses": [{
    "header": { "frame_id": "map" },
    "pose": {
      "position":    { "x": 2.8,   "y": 0.95, "z": 0.0 },
      "orientation": { "x": 0.0, "y": 0.0, "z": -0.026, "w": 0.999 }
    }
  }],
  "source":   "pixel_waypoints",
  "map_meta": { "..." : "..." }
}
```

---

### `GET /map_image`

Serves a `.pgm` map file as PNG — viewable directly in any browser.

| Query param | Default | Notes |
|-------------|---------|-------|
| `file` | `new_office_map.pgm` | Any `.pgm` filename in the resource folder |

```bash
# Open in browser
http://10.10.0.200:1717/map_image

# Specific file
http://10.10.0.200:1717/map_image?file=other_map.pgm

# Download via curl
curl http://10.10.0.200:1717/map_image --output map.png
```

> To add a new map: drop the `.pgm` into `resource/`, declare it in `setup.py` under `data_files`, then rebuild with `colcon build`.

---

### `GET /map_image/list`

Lists all `.pgm` files available in the package resource folder.

```bash
curl http://10.10.0.200:1717/map_image/list
```

```json
{
  "maps":  ["new_office_map.pgm", "warehouse.pgm"],
  "count": 2
}
```

---

### `GET /lifecycle_status`

Returns the live status of SLAM and navigation. Both checks run concurrently — response time is ~2 seconds worst case.

| Field | ON condition | OFF condition |
|-------|-------------|---------------|
| `SLAM_status` | `global_localization_lifecycle_node` is `active` | Node is `unconfigured` or unreachable |
| `NAV_status` | `/navigate_to_pose` action server responds within 2s | Timeout or unavailable |

```bash
curl http://10.10.0.200:1717/lifecycle_status
```

```json
{
  "SLAM_status": "ON",
  "NAV_status":  "ON"
}
```

---

### `POST /lifecycle_start`

Runs the full SLAM and localization startup sequence. Fails fast with `500` if any step fails.

**Sequence:**

| Step | ROS 2 Command | Notes |
|------|---------------|-------|
| 1 | `lifecycle set /auto_localizer_lifecycle_node activate` | Direct activate |
| ↳ | `lifecycle set /auto_localizer_lifecycle_node deactivate` | Only if step 1 fails |
| ↳ | `lifecycle set /auto_localizer_lifecycle_node activate` | Retry after deactivate |
| 2 | `lifecycle set /global_localization_lifecycle_node configure` | Configure global localizer |
| 3 | `lifecycle set /global_localization_lifecycle_node activate` | Activate global localizer |

```bash
curl -X POST http://10.10.0.200:1717/lifecycle_start
```

```json
{
  "accepted": true,
  "action":   "lifecycle_start",
  "steps": [
    { "node": "/auto_localizer_lifecycle_node",      "transition": "activate",  "ok": true },
    { "node": "/global_localization_lifecycle_node", "transition": "configure", "ok": true },
    { "node": "/global_localization_lifecycle_node", "transition": "activate",  "ok": true }
  ]
}
```

---

### `POST /lifecycle_stop`

Gracefully stops the global localization node. Cleanup only runs if deactivate succeeds.

**Sequence:**

| Step | ROS 2 Command | Notes |
|------|---------------|-------|
| 1 | `lifecycle set /global_localization_lifecycle_node deactivate` | Deactivate global localizer |
| 2 | `lifecycle set /global_localization_lifecycle_node cleanup` | Release resources |

```bash
curl -X POST http://10.10.0.200:1717/lifecycle_stop
```

```json
{
  "accepted": true,
  "action":   "lifecycle_stop",
  "steps": [
    { "node": "/global_localization_lifecycle_node", "transition": "deactivate", "ok": true },
    { "node": "/global_localization_lifecycle_node", "transition": "cleanup",    "ok": true }
  ]
}
```

---

## Error Reference

| Code | Meaning | Common Cause |
|------|---------|--------------|
| `400` | Bad request | Invalid filename on `/map_image` |
| `404` | Not found | `.pgm` file missing from resource folder |
| `422` | Validation error | Missing `col` / `row` in `pixel_waypoints` |
| `500` | Server error | ROS goal rejected or lifecycle transition failed |
| `503` | Service unavailable | ROS not initialised or Hive action server unreachable |

---

## Notes for Future Development

- **`/lifecycle_stop`** — `auto_localizer_lifecycle_node` deactivate is not yet wired. Add when shutdown sequence is confirmed.
- **`/lifecycle_status`** — SLAM check uses a CLI subprocess (`ros2 lifecycle get`). A cleaner approach would use a native `rclpy` service client.
- **NAV check timeout** — currently 2s. Increase or cache last known state if the nav stack takes longer to come up.
- **Map metadata** — `MAP_META` is hardcoded. Consider loading from the `.yaml` sidecar file at startup to avoid drift when maps are updated.
- **CORS** — currently allows all origins (`*`). Restrict to known webapp origins before production deployment.
- **Behavior ID 21** — has special handling that populates `goal.pose` from the first waypoint. Document or refactor once the behavior interface is stable.
- **Pillow dependency** — required for `.pgm → PNG` conversion. Pin version in `requirements.txt` or the Dockerfile.

---

## Quick Reference

```bash
# Health check
curl -X GET http://10.10.0.200:1717/health

# Send task
curl -X POST http://10.10.0.200:1717/tasks \
  -H "Content-Type: application/json" \
  -d '{"id":22,"behavior_name":"FollowRoute","pixel_waypoints":[{"col":254,"row":389,"yaw_deg":-3}]}'

# Map metadata
curl -X GET http://10.10.0.200:1717/map/meta

# Preview coordinate conversion
curl -X POST http://10.10.0.200:1717/map/preview \
  -H "Content-Type: application/json" \
  -d '{"pixel_waypoints":[{"col":254,"row":389,"yaw_deg":-3}]}'

# View map in browser
http://10.10.0.200:1717/map_image

# List available maps
curl -X GET http://10.10.0.200:1717/map_image/list

# Lifecycle status
curl -X GET http://10.10.0.200:1717/lifecycle_status

# Start SLAM + localization
curl -X POST http://10.10.0.200:1717/lifecycle_start

# Stop localization
curl -X POST http://10.10.0.200:1717/lifecycle_stop
```