# 🤖 Robot App Store — Full-Stack Robot Navigation System

A fully dockerized robot operator platform: a React HMI dashboard driving a ROS 2
navigation stack through a layered behavior-tree architecture, with a TurtleBot3
Gazebo simulation for development.

- **Simple Route Planner** – place waypoints on the live robot map, dispatch
  multi-waypoint missions, watch the robot's GPS-style position marker track
  AMCL localisation in real time
- **Dashboard** – live telemetry and system status
- **Emergency Stop** – one-click software stop (cancels navigation, forces zero twist)
- **Remote Controller** – keyboard/joystick teleop with a live LIDAR HUD
  and a live WebRTC camera feed side by side
  (design & teleop strategy: [docs/RemoteController.md](docs/RemoteController.md))

> **2026 refactor: MQTT split.** The FastAPI gateway used to *be* a ROS 2 node
> (rclpy in-process, colcon build, host networking, shared DDS domain). It no
> longer is. `backend/hive_api_gateway` is now a plain Python service that only
> speaks MQTT; every ROS 2 dependency moved into a new `backend/hive_mqtt_bridge`
> node. See [Architecture](#-architecture) for why and [Safety notes](#-safety-notes)
> for what that means for the teleop/e-stop control path.
>
> **Same cycle: live camera over WebRTC.** A second boundary node,
> `backend/hive_camera_bridge`, streams the robot's camera to the browser —
> see [Camera / WebRTC](#-camera--webrtc) for why this is deliberately
> *not* another MQTT topic.

---

## 🔭 System Overview

The system is a **four-layer robot control platform**, each layer with a single
responsibility, connected end-to-end from a browser click to robot wheels:

| Layer | What it does | Technology |
|---|---|---|
| **HMI (frontend)** | Operator-facing dashboard: map display, waypoint placement, live robot position/scan/telemetry, mission dispatch | React + Vite + TypeScript, Canvas rendering, WebSockets |
| **API Gateway** | Translates web requests ↔ MQTT. Serves the map, streams telemetry/scan/localisation/plan over WebSockets, converts missions into MQTT commands, monitors robot health | FastAPI + aiomqtt — plain Python, **zero ROS 2 dependency** |
| **MQTT Broker** | The decoupling point. Gateway and robot never talk to each other directly | HiveMQ CE |
| **ROS 2 / Behavior layer** | `hive_mqtt_bridge` translates MQTT ↔ ROS 2 → `hive_bt_server` routes behavior requests (by id or name) → `bt_runner` loads and ticks the matching BT XML → BT nodes drive Nav2 one waypoint at a time | rclpy + C++, rclcpp_action, BehaviorTree.CPP, Groot2-compatible |
| **Robot / Simulation** | Nav2 stack (AMCL localisation, costmaps, planners, controllers) driving either the Gazebo TurtleBot3 sim or real hardware — the layers above cannot tell the difference | Nav2, Gazebo 11, TurtleBot3 |

Why layered? The UI never talks ROS directly (any HTTP client works — `curl` can
dispatch a mission). The gateway never imports rclpy — it can run on a laptop, in
CI, or on a different host from the robot entirely, because MQTT (not a shared DDS
domain) is what connects it to the robot now. The behavior layer never sees pixels
or JSON quirks — it receives clean, typed `ExecuteBehavior` action goals. And the
robot layer is swappable: point the same stack at real hardware by running the
robot's own Nav2 instead of the sim container.

`robotstore` and `turtlebot3-sim` still run on **host networking** and share a
CycloneDDS domain with each other — that's an unavoidable ROS 2 DDS discovery
requirement between ROS 2 participants. `appstore`, `mqtt-broker`, and `hive_api`
do **not** — they're plain network services on the default Docker bridge network,
reachable by hostname/port like anything else.

One more path doesn't fit the MQTT picture at all: the Remote Controller's
camera feed. `backend/hive_camera_bridge` streams the robot's RGB camera to
the browser over **WebRTC**, signaled through the gateway (`POST
/webrtc/offer`) but carried directly between browser and robot once
connected — see [Camera / WebRTC](#-camera--webrtc).

---

## 🏗 Architecture

```
┌────────────────────────────────── appstore repo (this) ───────────────────────────────────┐
│                                                                                              │
│  ┌────────────────┐   HTTP / WebSocket    ┌─────────────────────────────┐                  │
│  │   appstore     │ ────────────────────▶ │   hive_api  (port 1717)      │                  │
│  │  React + Vite  │   :1717               │   FastAPI + aiomqtt          │                  │
│  │  (port 5174)   │                       │   backend/hive_api_gateway   │                  │
│  └────────────────┘                       │   NO rclpy — plain Python    │                  │
│                                            └──────────────┬────────────────┘                  │
│                                                            │ MQTT (hive/<robot_id>/…)          │
│                                                            ▼                                  │
│                                            ┌─────────────────────────────┐                   │
│                                            │   mqtt-broker (HiveMQ CE)    │                   │
│                                            │   port 1883                  │                   │
│                                            └──────────────┬────────────────┘                  │
│                                                            │ MQTT                              │
│                                          ┌─────────────────▼──────────────────────────────┐   │
│                                          │  robotstore container (host networking)          │   │
│                                          │  ┌────────────────────────┐                      │   │
│                                          │  │ hive_mqtt_bridge        │  ◀── ONLY place      │   │
│                                          │  │ rclpy + paho-mqtt       │      rclpy + MQTT     │   │
│                                          │  └───────────┬────────────┘      both appear       │   │
│                                          │              ▼ ROS 2 action                        │   │
│                                          │  ┌────────────────────────┐                        │   │
│                                          │  │ hive_bt_server         │                        │   │
│                                          │  │ /hive/execute_behavior │                        │   │
│                                          │  └───────────┬────────────┘                        │   │
│                                          │              ▼                                     │   │
│                                          │  ┌────────────────────────┐                        │   │
│                                          │  │ bt_runner              │                        │   │
│                                          │  │ BehaviorTree.CPP exec  │                        │   │
│                                          │  │ (go_to_waypoints.xml)  │                        │   │
│                                          │  └───────────┬────────────┘                        │   │
│                                          └──────────────┼─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┼────────────────────────────────────────┘
                                                          │ /navigate_to_pose
                                                          ▼
                              ┌──────────────────────────────────────────────┐
                              │  turtlebot3-sim container (host networking)  │
                              │  (appstore/turtlebot_mcp_ros2)               │
                              │  Gazebo 11 + TurtleBot3 burger + Nav2 + AMCL │
                              │  (swap for the real robot in production)     │
                              └──────────────────────────────────────────────┘
```

**ROS 2 participants** (`robotstore`, `turtlebot3-sim`, and anything on the host
talking ROS 2 directly) still share `network_mode: host`, `ROS_DOMAIN_ID=0`,
`RMW_IMPLEMENTATION=rmw_cyclonedds_cpp` — see [Gotchas](#-gotchas). **`hive_api`
and `mqtt-broker` are exempt** — that constraint was purely a DDS discovery
requirement, and neither of them speaks DDS anymore.

### Mission flow (INITIATE NAVIGATION)

1. **UI** converts canvas waypoints → map-frame poses (metres, quaternions) and
   `POST /tasks` with `{id: 22, behavior_name: "FollowRoute", poses: [...]}`
2. **Gateway** resolves pixel↔map coordinates if needed (pure Python, see
   `backend/hive_api_gateway/app/geometry.py`), publishes
   `hive/<robot_id>/cmd/task` over MQTT, and **waits up to 8s** for
   `hive/<robot_id>/task/ack` before answering the HTTP request — so `POST
   /tasks` still resolves synchronously from the browser's point of view.
3. **hive_mqtt_bridge** receives `cmd/task`, builds an `ExecuteBehavior` action
   goal, sends it to `/hive/execute_behavior` (falling back to Nav2
   `NavigateThroughPoses` directly if Hive is unreachable), and publishes the
   accept/reject result back to `task/ack`.
4. **hive_bt_server** resolves the alias `FollowRoute → GoToWaypoints`, forwards
   the goal to `/bt_runner/execute_behavior`, relays feedback upstream and status
   to `/hive/status`
5. **bt_runner** loads `go_to_waypoints.xml`, injects the waypoints onto the BT
   blackboard, and ticks the tree: for each waypoint `SendNav2Goal` →
   `MonitorNav2Status` → pause
6. **Nav2** plans and drives the robot; success bubbles back up the chain to the UI

### MQTT topic tree (`hive/<robot_id>/…`, `ROBOT_ID` default `robot-1`)

| Topic | Direction | QoS | Retained | Payload |
|---|---|---|---|---|
| `telemetry` | bridge → gateway | 0 | no | `{type, x, y, theta}` — `/odom`, ~1 Hz |
| `localisation` | bridge → gateway | 0 | **yes** | `{type, x, y, yaw, frame_id, age_s}` — `/amcl_pose` |
| `plan` | bridge → gateway | 0 | no | `{type, frame_id, age_s, points[]}` — Nav2 global plan |
| `scan` | bridge → gateway | 0 | no | LaserScan, always published ~1 Hz |
| `health` | bridge → gateway | 1 | **yes** (+ LWT) | `{ros_ready, robot_alive, topics{...}}` |
| `task/ack` | bridge → gateway | 1 | no | reply to `cmd/task`: `{task_id, accepted, behavior, nav_mode, ...}` |
| `task/result` | bridge → gateway | 1 | no | `{task_id, success, outcome_text}` |
| `cmd/task` | gateway → bridge | 1 | no | mission dispatch (was `POST /tasks`) |
| `cmd/velocity` | gateway → bridge | 0 | no | teleop `{linear, angular}` (was `/api/velocity_ctrl`) |

`health` carries an MQTT **Last Will and Testament**: if `hive_mqtt_bridge` dies
or its connection drops uncleanly, the broker publishes `robot_alive:false` on
its behalf immediately — no staleness timeout needed to detect that case.

Debug the bus directly with any MQTT client, e.g.:
```bash
docker exec -it hive_mqtt_broker-arm sh -c \
  "apt-get install -y mosquitto-clients 2>/dev/null; mosquitto_sub -h localhost -t 'hive/+/#' -v"
# or from the host, once mqtt-broker's 1883 is published:
mosquitto_sub -h localhost -p 1883 -t 'hive/+/#' -v
```

### Repository layout

```
appstore/
├── src/                        # React frontend (pages, hooks, components)
│   └── hooks/                  #   useTelemetry / useScan / useLocalisation (WebSockets — unchanged)
├── backend/
│   ├── hive_api_gateway/       #   FastAPI + aiomqtt gateway — PLAIN PYTHON, no ROS 2, no colcon
│   │   ├── app/                #     main.py (routes), mqtt_client.py, geometry.py, config.py
│   │   ├── requirements.txt
│   │   └── Dockerfile          #     python:3.11-slim — no ROS base image
│   ├── hive_mqtt_bridge/       #   ROS2 <-> MQTT bridge (Python/rclpy) — imports both rclpy
│   │   │                       #     and paho-mqtt
│   │   └── hive_mqtt_bridge/bridge_node.py
│   ├── hive_camera_bridge/     #   ROS2 <-> WebRTC bridge (Python/rclpy) — imports both rclpy
│   │   │                       #     and aiortc; the ONLY other package that isn't pure ROS 2
│   │   └── hive_camera_bridge/camera_node.py
│   ├── hive_bt_server/         #   Behavior router action server (C++)
│   ├── bt_runner/               #   BehaviorTree.CPP executor + BT XML trees (C++)
│   ├── hive_interfaces/         #   ExecuteBehavior.action definition
│   ├── cyclonedds.xml           #   DDS config (robot hardware interface pinning)
│   └── docker/dev/              #   Dockerfile-arm + entrypoint for the ROS 2 robotstore image
├── map/                         # Operational map (map.pgm + map.yaml) — served by /api/map
├── docker/Dockerfile            # Frontend dev-server image
├── docker-compose.yml           # appstore + mqtt-broker + hive_api + robotstore services
├── Makefile                     # build/run targets (see below)
├── turtlebot_mcp_ros2/          # TurtleBot3 Gazebo simulation
│   ├── docker/Dockerfile-sim    #   Gazebo + TurtleBot3 + Nav2, all from apt
│   ├── docker/entrypoint_sim.sh #   readiness-gated boot: world → spawn → Nav2 → initialpose
│   ├── docker-compose.yml       #   turtlebot_sim service (X11 GUI passthrough)
│   └── Makefile                 #   build_sim / run_sim / run_sim_headless
└── ...
```

`backend/build_api/`, `install_api/`, `log_api/` are gone — hive_api never runs
colcon anymore, there's nothing for them to hold.

---

## 📷 Camera / WebRTC

Live video from the robot's camera does **not** ride the MQTT bus above.
MQTT is a message broker for small, discrete messages — it isn't built to
carry a continuous RTP stream, and trying to force one through it would mean
either choking the broker or reinventing a video transport badly. WebRTC
already solves "get real-time video from A to B, negotiate a codec, punch
through NAT" — so that's what `backend/hive_camera_bridge` uses instead.

```
  appstore (browser)                     hive_api                    hive_camera_bridge
                                                                      (robotstore, :8766)
       │ 1. POST /webrtc/offer {sdp}         │                              │
       ├─────────────────────────────────────▶                              │
       │                                      │ 2. POST /offer (proxied)    │
       │                                      ├─────────────────────────────▶
       │                                      │◀─────────────────────────────┤
       │◀─────────────────────────────────────┤ 3. {sdp: answer}            │
       │                                      │                              │
       │ 4. RTP video — direct, ICE-negotiated, bypasses hive_api entirely   │
       │◀═════════════════════════════════════════════════════════════════▶│
```

Only steps 1–3 (a one-time, kilobyte-sized SDP exchange) go through the
gateway — same single-entry-point rule the browser follows for everything
else. Step 4, the actual video, is direct: aiortc gathers ICE host
candidates from `robotstore`'s network interfaces (host-networked, so its
LAN IP is directly reachable), and on the same LAN today that's enough —
no STUN/TURN server needed. That stops being true the moment robot and
browser are on different networks — MQTT's broker-relay trick doesn't
extend to bulk media the way it did for commands/telemetry; a TURN relay
would be the equivalent piece if this ever splits across networks.

**Camera source:** `turtlebot_mcp_ros2` spawns `turtlebot3_burger_cam` (not
plain `burger`) specifically to get an RGB camera in the sim — burger's
footprint/physics are identical, it just adds a camera plugin publishing
`/camera/image_raw`. That's the topic actually confirmed via `ros2 topic
list` on a running sim — the model's SDF declares the camera plugin under a
`depth_cam` namespace, but that doesn't end up being the effective topic
name at runtime, so trust `ros2 topic list` over the SDF if this ever
changes again. `hive_camera_bridge` subscribes to `CAMERA_TOPIC` (env var,
default `/camera/image_raw`), converts frames with `cv_bridge`, and feeds
them into an aiortc `VideoStreamTrack` at `CAMERA_FPS` (default 15 — a
Pi5-minded default, not a hardware limit; tune it in `docker-compose.yml`
if you have headroom or need less).

**Enabling it:** off by default in the Remote Controller UI (same "Scan
Update" convention the LIDAR toggle already uses) — encoding video on the
robot side costs real CPU, so nothing runs until the operator flips
"Camera Feed: ON."

**Multiple viewers:** each browser tab gets its own `RTCPeerConnection` and
video track, but all of them read the same underlying frame buffer — N
viewers costs one ROS 2 subscription, not N.

---

## 🚀 Quick Start

### Prerequisites
- Docker v24+ with Compose v2, `docker buildx`
- An X11 desktop session (for the Gazebo/RViz GUI; headless mode needs none)
- Linux with host networking (ROS 2 DDS requirement — for `robotstore` and the
  sim only; `hive_api`/`mqtt-broker` run anywhere Docker runs)

### 1. Build everything (first time only)

```bash
# Main stack: gateway image (fast, no ROS), robotstore image + colcon build, frontend image
cd ~/appstore
make build

# Simulation image (Gazebo + TurtleBot3 + Nav2 from apt — no colcon build)
cd ~/appstore/turtlebot_mcp_ros2
make build_sim
```

`build_robotstore` is the slow step (ROS 2 + CycloneDDS source build + colcon,
now also pulling in `aiortc`'s native deps for `hive_camera_bridge`).
`build_hive_api` now takes seconds — it's a `python:3.11-slim` image with a
handful of pip packages, no ROS toolchain involved at all.

### 2. Run

```bash
# Terminal 1 — simulation (Gazebo + RViz windows open on your desktop)
cd ~/appstore/turtlebot_mcp_ros2
make run_sim                 # or: make run_sim_headless

# Terminal 2 — full app stack (frontend + mqtt-broker + gateway + hive/bt_runner/bridge)
cd ~/appstore
make run
```

`make run` starts four containers: `appstore`, `mqtt-broker`, `hive_api`,
`robotstore`. HiveMQ CE takes a few seconds to finish booting the JVM (~8s
measured) — `hive_api` and `hive_mqtt_bridge` will each log `[mqtt] connection
lost ([Errno 111] Connection refused) — retrying in Ns` once or twice while
they wait; that's the reconnect-with-backoff working as designed, not a
failure. Once you see `[mqtt] connected to mqtt-broker:1883` the gateway is
live. `GET /health` reports `mqtt_connected` (gateway↔broker) and
`robot_alive` (bridge↔robot, via the `health` topic + its Last Will)
separately, so you can tell the two failure modes apart.

`hive_camera_bridge` comes up alongside `hive_mqtt_bridge` in the same
`robotstore` launch — check `make logs-robotstore` for `hive_camera_bridge
subscribed to /camera/image_raw, signaling on :8766` to confirm it's
ready before turning on the Remote Controller's camera feed.

The sim boots in its own readiness-gated sequence: Gazebo world → robot spawn at
`SPAWN_X/SPAWN_Y/SPAWN_YAW` → Nav2 → AMCL initial pose **auto-set to the spawn
pose** (no manual "2D Pose Estimate" needed).

### 3. Use it

1. Open **http://localhost:5174**
2. Wait for the blinking **Connected** badge (requires `/global_costmap/costmap`
   and `/scan` both alive on the robot side, relayed through `hive/<id>/health`)
3. Open **Simple Route Planner** — the robot map loads automatically and the blue
   GPS-style marker blinks at the robot's AMCL pose
4. **PLACE WAYPOINT** → click positions on the map (click again to set heading)
5. **INITIATE NAVIGATION** — the robot drives the route in Gazebo
6. **CLEAR ROUTE** → place the next set of waypoints → send again

### Running just the gateway (no robot/ROS 2 needed)

Useful for frontend/API work — bring up only the broker + gateway:
```bash
make run-api   # docker compose up hive_api (pulls in its mqtt-broker dependency)
```
`/health` will report `robot_alive: false` (no bridge publishing) but every REST
endpoint and the frontend itself work normally against it.

### Stopping

```bash
cd ~/appstore && make stop-all
cd ~/appstore/turtlebot_mcp_ros2 && make stop
```

---

## 🔌 Gateway API (port 1717)

Every path and payload shape below (except `/webrtc/offer`, new) is unchanged
from before the MQTT refactor — a transport swap behind a stable contract, so
`src/hooks/*` needed zero changes for any of the pre-existing endpoints.

| Endpoint | Type | Description |
|---|---|---|
| `GET /health` | REST | `robot_alive` (bridge↔robot) + `mqtt_connected` (gateway↔broker), reported separately |
| `GET /localization` | REST | Latest AMCL pose (or `available: false` if none received yet) |
| `GET /api/map` | REST | Operational `map.pgm` rendered as PNG |
| `GET /api/map/meta` | REST | `map.yaml` (resolution, origin) for coordinate conversion |
| `POST /tasks` | REST | Dispatch a mission (`id: 22` = multi-waypoint FollowRoute). Publishes `cmd/task`, waits up to 8s for `task/ack` |
| `POST /webrtc/offer` | REST | Proxies a browser's SDP offer to `hive_camera_bridge`, relays back the answer. The only endpoint that isn't MQTT-backed — see [Camera / WebRTC](#-camera--webrtc) |
| `/api/telemetry` | WS | `/odom` pose at ~1 Hz — `{x, y, theta}` |
| `/api/scan` | WS | `/scan` LaserScan at ~1 Hz, opt-in via `{"type":"scan_toggle","enabled":true}` (drives the Scan Observation panel) |
| `/api/localisation` | WS | `/amcl_pose` at ~1 Hz — `{x, y, yaw, frame_id, age_s}` (drives the GPS marker) |
| `/api/plan` | WS | Nav2 global planner `/plan` at 2 Hz — `{points: [{x, y}, ...]}` (drives the live path overlay; empty = idle) |
| `/api/velocity_ctrl` | WS | Teleop: client streams `{type: "cmd_vel", linear, angular}` at 10 Hz while driving → `hive/<id>/cmd/velocity` → bridge → `geometry_msgs/Twist` on `/cmd_vel`. One zero frame on release; 400 ms deadman here + an independent 500 ms deadman on the bridge zero the robot if either half of the link dies |

---

## 🛠 Make Targets

### appstore (`~/appstore`)

| Target | Description |
|---|---|
| `make build` | Build ALL images (gateway, robotstore + colcon workspace, frontend) |
| `make run` | Start all four services via docker compose (`--build` on each run) |
| `make stop-all` | `docker compose down` |
| `make build_hive_api` | `docker compose build hive_api` — plain image build, no colcon |
| `make run-api` | Launch just `hive_api` (+ its `mqtt-broker` dependency) via compose |
| `make run-bash` | Shell inside a throwaway gateway container |
| `make build_robotstore` | Rebuild hive_bt_server + bt_runner + hive_mqtt_bridge + hive_camera_bridge (needed after C++ / Python / BT XML changes) |
| `make logs-api` / `make logs-robotstore` / `make logs-broker` | Tail container logs |
| `make clean` | Delete robotstore's colcon artifacts (hive_api has none anymore) |

Gateway Python changes hot-apply on `docker restart hive_api-api-arm` — `app/`
is volume-mounted, same dev convenience as before, just without colcon in the
loop. hive_mqtt_bridge and hive_camera_bridge are Python too but both need
`make build_robotstore` to re-symlink into the colcon workspace (they're
ROS 2 code, built the same way as hive_bt_server/bt_runner).

### simulation (`~/appstore/turtlebot_mcp_ros2`)

| Target | Description |
|---|---|
| `make build_sim` | Build the Gazebo+Nav2 image |
| `make run_sim` | GUI mode (Gazebo + RViz windows) |
| `make run_sim_headless` | gzserver only, no RViz — CI / low-resource use |
| `make run_bash` | Debug shell in the sim image |

Robot spawn pose is set in the sim `docker-compose.yml` (`SPAWN_X`, `SPAWN_Y`,
`SPAWN_YAW`) — Gazebo spawn and AMCL initial pose both follow it.

---

## ⚠️ Gotchas

1. **One DDS vendor everywhere — ROS 2 participants only.** Every ROS 2
   participant (`robotstore`, the sim container, anything on the host talking
   ROS 2 directly) must use `RMW_IMPLEMENTATION=rmw_cyclonedds_cpp` and
   `ROS_DOMAIN_ID=0`. This does **not** apply to `hive_api` or `mqtt-broker`
   anymore — they're plain network services now. Mixing FastRTPS and CycloneDDS
   on the same host *appears* to work (`ros2 topic list` shows everything) but
   data delivery silently fails because FastRTPS uses shared-memory transport
   for same-host peers. Symptom: action goals time out "waiting for acceptance".
2. **HiveMQ CE takes a few seconds to boot (~8s).** It's a JVM broker.
   `hive_api` and `hive_mqtt_bridge` both reconnect with backoff
   automatically, so a `[Errno 111] Connection refused` retry or two on
   `make run` is normal — just wait for `[mqtt] connected to ...` in
   `make logs-api`/`make logs-robotstore` before assuming something's broken.
3. **MQTT broker has no auth by default (dev mode).** `mqtt-broker` runs with
   `HIVEMQ_ALLOW_ALL_CLIENTS=true` — anonymous, unencrypted. Fine on a private
   robot/LAN network; do **not** expose port 1883/8883 beyond that without
   adding the HiveMQ file-RBAC extension (or switching to Mosquitto with a
   `password_file`) and TLS.
4. **Port 1883 already in use.** If something else on the host (another
   broker, another project's compose stack) already owns 1883, `mqtt-broker`
   fails to start with `Bind for 0.0.0.0:1883 failed: port is already
   allocated`. Either stop the other container/service or remap
   `mqtt-broker`'s host port in `docker-compose.yml` (and `robotstore`'s
   `MQTT_PORT` to match — it reaches the broker via the host-published port,
   not the compose network).
5. **Don't re-enable HiveMQ's remote JMX.** `HIVEMQ_JMX_ENABLED=false` is set
   deliberately in `docker-compose.yml` — the image's default (`true`) tries
   to bind an RMI connector using the container's own hostname, which can
   fail to resolve depending on the Docker network/DNS setup and crash-loop
   the broker with `MalformedURLException: Unable to resolve hostname`.
6. **One Gazebo at a time.** Never run the host `turtle_nav.sh` and the sim
   container together — two gzservers deadlock on port 11345.
7. **Gateway Python changes** hot-apply on container restart
   (`docker restart hive_api-api-arm`) because `app/` is volume-mounted.
   **hive_mqtt_bridge / hive_camera_bridge / hive_bt_server / bt_runner / BT
   XML changes** need `make build_robotstore`.
8. **`hive_mqtt_bridge` needs `setup.cfg`, not just `setup.py`.** Same as any
   `ament_python` package — without it, colcon still builds successfully but
   installs the `console_scripts` entry point to the default `bin/` instead of
   `install/hive_mqtt_bridge/lib/hive_mqtt_bridge/`, and `ros2 launch` fails
   with `libexec directory ... does not exist` even though the build reported
   no errors.
9. **AMCL publishes on motion.** `/amcl_pose` goes quiet while the robot is
   stationary — that's normal. The bridge keeps publishing the last known pose
   on `hive/<id>/localisation` (retained, with `age_s` for freshness), so the
   GPS marker is always visible once AMCL has localized, even before any
   mission is sent.
10. **Verify layers with probes, not lists.** `ros2 action list` proves ROS 2
    discovery, not delivery; `mosquitto_sub -t 'hive/+/#' -v` proves MQTT
    delivery, not that the bridge is actually receiving fresh ROS 2 data. Use
    `ros2 action send_goal` / `ros2 topic echo --once` on the ROS 2 side and
    watch `mosquitto_sub` update on the MQTT side to confirm the whole chain.
11. **`POST /webrtc/offer` returns 503 with no camera picture, not a hang.**
    That means `hive_api` couldn't reach `hive_camera_bridge` at
    `CAMERA_BRIDGE_URL` (default `http://host.docker.internal:8766`) — check
    `robotstore` is actually up and that `extra_hosts:
    host.docker.internal:host-gateway` is still in `hive_api`'s compose
    service (it's what lets a bridge-network container reach a
    host-networked sibling's port without putting `hive_api` back on host
    networking).
12. **No camera feed even though everything's "connected."** `TURTLEBOT3_MODEL`
    in `turtlebot_mcp_ros2/docker-compose.yml` has to be `burger_cam` (or
    `waffle`/`waffle_pi`), not plain `burger` — plain burger has no camera at
    all, so `/camera/image_raw` never publishes and `hive_camera_bridge`
    streams black frames forever without erroring (by design — see its
    module docstring on why it doesn't block on a missing topic). Also
    remember the sim image needs `make build_sim` rerun after this changed —
    it's a separate Makefile/compose project from the main stack, easy to
    leave on a stale image that predates `burger_cam`.

---

## 🛡 Safety notes

- **Teleop has two independent deadmen.** The gateway zeroes `/cmd_vel` if the
  browser's WebSocket goes quiet for 400ms; `hive_mqtt_bridge` *separately*
  zeroes `/cmd_vel` if no `cmd/velocity` MQTT message arrives for 500ms. The
  second one exists because the MQTT hop (gateway↔broker↔bridge) is a new
  failure mode the old same-process `rclpy.publish()` call never had — a
  browser that's still sending frames doesn't help if the broker connection
  underneath it has silently dropped.
- **The Emergency Stop page is a UI-only mock, unchanged by this refactor.**
  `EmergencyStopPage.tsx` writes to a local IndexedDB store (`localDb`), not to
  the robot — this was already true before the MQTT split (see
  `docs/frontend-migration-prompt.md` §0 on the app-data vs. live-robot-data
  split). There is currently no `cmd/estop` topic. If a real hardware/software
  e-stop command is wanted, `hive/<id>/cmd/estop` is the natural place to add
  it (QoS 1, handled by the bridge the same way `cmd/velocity` is) — it wasn't
  added here to avoid inventing new robot-control surface area beyond what
  already existed.
- **Broker auth posture** — see Gotcha #3 above. Don't ship the anonymous
  default past a private network boundary.
- **The camera feed is read-only sensor data with no control-plane
  implications** — unlike teleop, there's no deadman/watchdog concern here,
  a stalled or dropped video connection can't move the robot. Its actual
  cost is CPU: encoding is real work even at 320×240/15fps, which is exactly
  why it's opt-in per browser tab rather than always-on (see [Camera /
  WebRTC](#-camera--webrtc)) — on a resource-constrained Pi5, an operator
  leaving the feed on in an idle tab is the realistic failure mode to watch
  for, not a safety one.
- **WebRTC signaling has no auth either, same posture as the broker.**
  `POST /webrtc/offer` accepts any SDP offer the gateway is asked to proxy.
  Fine on the same private network as everything else in this repo; treat it
  as part of the same hardening pass as Gotcha #3 if this ever needs to be
  reachable beyond that.

---

## 🧑‍💻 Frontend Development

```bash
npm install
npm run dev        # Vite dev server on :5174 (or use the appstore container)
npm run build      # production bundle
npm run lint       # ESLint
npx tsc --noEmit   # type check
```

The frontend talks to the gateway at the URL in `src/lib/config.ts`
(`GATEWAY_URL`, default `http://localhost:1717`).
