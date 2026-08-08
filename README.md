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
| `goal/ack` | bridge → gateway | 1 | no | reply to `cmd/goal`: `{goal_id, accepted, waypoint_count, detail?}` |
| `goal/result` | bridge → gateway | 1 | no | `{goal_id, status}` — `action_msgs/GoalStatus` code, logged not surfaced synchronously |
| `cancel_nav/ack` | bridge → gateway | 1 | no | reply to `cmd/cancel_nav`: `{request_id, cancelled}` |
| `webrtc/answer` | bridge → gateway | 1 | no | reply to `cmd/webrtc_offer`: `{offer_id, sdp, type}` or `{offer_id, error}` |
| `cmd/task` | gateway → bridge | 1 | no | mission dispatch (was `POST /tasks`) |
| `cmd/velocity` | gateway → bridge | 0 | no | teleop `{linear, angular}` (was `/api/velocity_ctrl`) |
| `cmd/goal` | gateway → bridge | 1 | no | direct Nav2 route, `{goal_id, poses[]}` (was `POST /nav_goal`) |
| `cmd/cancel_nav` | gateway → bridge | 1 | no | `{request_id}` — cancel the active NavigateThroughPoses goal (was `POST /cancel_nav`) |
| `cmd/set_pose` | gateway → bridge | 1 | no | `{pose, covariance?}`, fire-and-forget — set AMCL's initial pose (was `POST /set_pose`) |
| `cmd/webrtc_offer` | gateway → bridge | 1 | no | `{offer_id, sdp, type}` — relayed to `hive_camera_bridge` over local HTTP, answer published back on `webrtc/answer` (was a direct HTTP call from `hive_api`, see §5 of the AWS section) |

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
| `POST /nav_goal` | REST | Direct Nav2 dispatch — publishes `cmd/goal` with the WHOLE waypoint list; bridge sends one `NavigateThroughPoses` action goal. Waits up to 6s for `goal/ack` (accept/reject), not for the route to finish. Bypasses Hive/BT entirely |
| `POST /cancel_nav` | REST | Cancels whichever `NavigateThroughPoses` goal is active (from `/nav_goal` or `/tasks`' Nav2-fallback path). `{"cancelled": false}` is a legitimate "nothing was running" answer, not an error |
| `POST /set_pose` | REST | Sets AMCL's initial pose — publishes `cmd/set_pose`, bridge publishes once to `/initialpose`. Fire-and-forget, same semantics as `ros2 topic pub -1` — no ack, `/initialpose` has nothing to accept/reject |
| `POST /webrtc/offer` | REST | Proxies a browser's SDP offer to `hive_camera_bridge`, relays back the answer. The only endpoint that isn't MQTT-backed — see [Camera / WebRTC](#-camera--webrtc) |
| `/api/telemetry` | WS | `/odom` pose at ~1 Hz — `{x, y, theta}` |
| `/api/scan` | WS | `/scan` LaserScan at ~1 Hz, opt-in via `{"type":"scan_toggle","enabled":true}` (drives the Scan Observation panel) |
| `/api/localisation` | WS | `/amcl_pose` at ~1 Hz — `{x, y, yaw, frame_id, age_s}` (drives the GPS marker) |
| `/api/plan` | WS | Nav2 global planner `/plan` at 2 Hz — `{points: [{x, y}, ...]}` (drives the live path overlay; empty = idle) |
| `/api/velocity_ctrl` | WS | Teleop: client streams `{type: "cmd_vel", linear, angular}` at 10 Hz while driving → `hive/<id>/cmd/velocity` → bridge → `geometry_msgs/Twist` on `/cmd_vel`. One zero frame on release; 400 ms deadman here + an independent 500 ms deadman on the bridge zero the robot if either half of the link dies |

### Three ways to move the robot — pick deliberately

| Path | Goes through | Use when |
|---|---|---|
| `POST /tasks` | Hive BT server → `bt_runner` → Nav2 | You want retries, pause/cancel, and feedback on a multi-waypoint mission |
| `POST /nav_goal` | Direct to Nav2's `NavigateThroughPoses` action | You want the whole route driven straight by Nav2, no BT involved — same idea as RViz's 2D Nav Goal, but multi-waypoint |
| `/api/velocity_ctrl` | Direct to `/cmd_vel` | Manual teleop, closed-loop human control |

`/nav_goal` and `/api/velocity_ctrl` both skip the Hive/BT layer on purpose — same reasoning in both cases: BT-managed navigation exists for missions that need monitoring, not for a single ad-hoc command. `POST /cancel_nav` is the stop button for whichever one is currently driving through `NavigateThroughPoses` — it doesn't reach into Hive/BT missions dispatched via `/tasks` when Hive itself is available (that's a separate pause/cancel surface the BT layer owns, not this one).

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
    Signaling rides MQTT now (`cmd/webrtc_offer` → `webrtc/answer`, relayed by
    `hive_mqtt_bridge` to `hive_camera_bridge` over local HTTP — see
    `mqtt_client.publish_webrtc_offer`'s docstring), so a 503 here means
    either the MQTT link itself is down (check `mqtt_connected` on
    `/health` first) or `hive_camera_bridge` isn't actually up on the robot
    (check `robotstore`'s logs for `hive_camera_bridge subscribed to
    ...`). No `host.docker.internal`/`extra_hosts` plumbing to worry about
    anymore — that direct-HTTP path is gone precisely because it broke once
    the gateway and the robot could be on different networks.
12. **No camera feed even though everything's "connected."** `TURTLEBOT3_MODEL`
    in `turtlebot_mcp_ros2/docker-compose.yml` has to be `burger_cam` (or
    `waffle`/`waffle_pi`), not plain `burger` — plain burger has no camera at
    all, so `/camera/image_raw` never publishes and `hive_camera_bridge`
    streams black frames forever without erroring (by design — see its
    module docstring on why it doesn't block on a missing topic). Also
    remember the sim image needs `make build_sim` rerun after this changed —
    it's a separate Makefile/compose project from the main stack, easy to
    leave on a stale image that predates `burger_cam`.
13. **`make build`/`make build_robotstore` should never prompt for a
    password.** Colcon runs inside the robotstore container as UID 1001
    (`charlie`), so `backend/build`, `install`, and `log` end up owned by a
    UID your host user doesn't have — the old Makefile used `sudo rm -rf` to
    clear them before each rebuild, which hangs waiting for a password in
    non-interactive contexts (`make` piped, run from some IDE terminals,
    etc.) and looks like the build silently stalling. Fixed by cleaning from
    *inside* a throwaway container running as root instead — never touches
    host sudo. If you still see a password prompt anywhere in the build
    chain, `grep -n sudo Makefile` and report it; there shouldn't be any
    left.

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

## ☁️ Deploying to AWS

**Split:** `appstore` (frontend) + `hive_api` (gateway) + `mqtt-broker` run on
one EC2 instance. `robotstore` — `hive_mqtt_bridge`, `hive_bt_server`,
`bt_runner`, `hive_camera_bridge` — stays exactly where it is today: on the
robot's own machine, on the robot's own network, talking Nav2/AMCL/DDS
locally exactly as before.

This split is *why* the MQTT refactor happened in the first place: the
gateway and the robot never talk to each other directly, only through the
broker. Moving the gateway to a different machine — even a different
continent — doesn't change that relationship. It only changes what address
`MQTT_HOST` points to. Nothing about `ROS_DOMAIN_ID`, `RMW_IMPLEMENTATION`,
CycloneDDS, or `network_mode: host` changes on the robot side — those were
never things the gateway participated in even on a single LAN.

**Automation for this section lives in `Makefile.aws`** (a separate file
from the main `Makefile` on purpose — the two sides of this split run on
two different machines and shouldn't share a "just run everything" target).
It reuses the same `docker-compose.yml` and the same `build_robotstore`
recipe the main `Makefile` already has (`include Makefile` — no logic is
duplicated), just aimed at a subset of services with a different env file
per side:

```bash
# AWS side — on the EC2 instance
cp .env.aws.example .env.aws        # fill in real values first
make -f Makefile.aws aws_build
make -f Makefile.aws aws_run

# Robot side — on your laptop (with turtlebot_sim) today, real hardware later
cp .env.robot.example .env.robot    # fill in the AWS broker's address
make -f Makefile.aws build_robot
make -f Makefile.aws run_robot
```

Both `.env.aws` and `.env.robot` are gitignored — only the `.example`
templates are tracked. Neither target runs without its env file present
(`aws_build`/`run_robot` fail with a clear message instead of silently
running against defaults meant for local single-host dev).

```
                              Browser
                                 │  HTTPS / WSS
                                 ▼
              ┌──────────────────────────────────────┐
              │  AWS EC2 instance                      │
              │  ┌────────────┐   ┌──────────────┐     │
              │  │  appstore   │   │  hive_api     │     │
              │  │  :5174      │   │  :1717        │     │
              │  └────────────┘   └──────┬────────┘     │
              │                          │ MQTT           │
              │                   ┌──────▼────────┐      │
              │                   │  mqtt-broker   │      │
              │                   │  :8883 (TLS)   │      │
              │                   └──────┬────────┘      │
              └──────────────────────────┼───────────────┘
                                          │ outbound MQTT/TLS —
                                          │ ROBOT dials OUT, so no
                                          │ inbound port ever needs
                                          │ to open on its network
                                          ▼
                        ┌───────────────────────────────────┐
                        │  Robot — its own network             │
                        │  (host networking, DDS — unchanged)  │
                        │  robotstore: hive_mqtt_bridge,        │
                        │  hive_bt_server, bt_runner,           │
                        │  hive_camera_bridge                   │
                        │       ↓                                │
                        │  Nav2 → real hardware / TurtleBot3     │
                        └───────────────────────────────────┘
```

### What moves, what doesn't

| Stays on the robot, unchanged | Moves to EC2 |
|---|---|
| `robotstore` (all of it) | `appstore` |
| Nav2, AMCL, costmaps, the physical robot / TurtleBot3 | `hive_api` |
| `ROS_DOMAIN_ID`, `RMW_IMPLEMENTATION`, CycloneDDS, `network_mode: host` | `mqtt-broker` |

The only edit on the robot side is `robotstore`'s `MQTT_HOST`/`MQTT_PORT`
(and now `MQTT_USERNAME`/`MQTT_PASSWORD`, see below) in `docker-compose.yml`,
pointed at the EC2 instance instead of `localhost`. `hive_bt_server`,
`bt_runner`, and Nav2 don't know or care that the gateway moved — they never
talked to it either.

### 1. EC2 instance

A `t3.medium`-class instance (2 vCPU/4GB) is plenty for `appstore` + `hive_api`
+ `mqtt-broker` — none of the ROS 2/colcon weight lives here anymore, that's
the whole point of this repo's 2026 refactor. Install Docker + Compose v2,
clone this repo, and:

```bash
# On the EC2 instance
git clone <this repo> && cd appstore
cp .env.aws.example .env.aws   # fill in MQTT creds, CORS origin, ROBOT_ID
make -f Makefile.aws aws_build
make -f Makefile.aws aws_run
make -f Makefile.aws aws_check   # curls /health once the broker's had a
                                  # few seconds to finish booting (~8s, JVM)
```

`aws_run` starts exactly `appstore` + `mqtt-broker` + `hive_api` — `robotstore`
is never part of it; `aws_build` likewise only builds the two images that
need building (`mqtt-broker` is a stock image, nothing to build).

**Security group**: open 443 (or whatever port your ALB/reverse proxy
terminates TLS on) to the internet for the frontend/gateway, and 8883 to the
internet for the broker — the robot needs a direct route to the broker's
MQTT port; that traffic doesn't go through an HTTP load balancer. Nothing
else needs to be open.

### 2. TLS + DNS

Two different kinds of traffic need TLS, terminated in two different places:

- **HTTPS/WSS for the browser** — put an ALB (or nginx/Caddy) in front of
  `appstore`:5174 and `hive_api`:1717 with an ACM cert. This part is standard
  web-app TLS, nothing MQTT-specific about it. **This is not optional** —
  `GATEWAY_URL` becomes `https://…`, and a browser serving `appstore` over
  HTTPS will refuse to open a plain `ws://` connection to the gateway at all
  (mixed content); it has to be `wss://`.
- **TLS for the robot's MQTT connection** — HiveMQ's default listener on
  1883 is plaintext. Add a TLS listener on 8883 (HiveMQ CE supports this via
  its config; mount a cert the same way the broker's other config gets
  mounted) and point `robotstore`'s `MQTT_PORT=8883` at it. An ALB can't
  proxy this (it's not HTTP) — either expose 8883 directly on the EC2
  instance's security group, or put an NLB in front of it if you want a
  stable DNS name independent of the instance's own IP.

Route53 (or any DNS provider) gives both endpoints stable hostnames instead
of raw IPs — worth doing before the robot's config points at anything, since
EC2 public IPs change on instance restart unless you've attached an Elastic IP.

### 3. Broker authentication — no longer optional

`HIVEMQ_ALLOW_ALL_CLIENTS=true` (this repo's dev-mode default, see Gotcha #3)
is fine on a private LAN and **actively wrong** the moment 8883 is reachable
from the public internet — `cmd/velocity`, `cmd/goal`, and `cmd/cancel_nav`
all originate from whoever can publish to the broker. Both the gateway and
the bridge already support authenticated MQTT out of the box —
`MQTT_USERNAME`/`MQTT_PASSWORD` env vars exist on both sides today, this was
built in from the start, not something new to add. What's missing is the
broker's own auth backend:

- **Simplest**: swap `mqtt-broker`'s image for `eclipse-mosquitto` with a
  `password_file` — a few lines of Mosquitto config, no extension to install.
- **Staying on HiveMQ CE**: add the [HiveMQ file-RBAC
  extension](https://github.com/hivemq/hivemq-file-rbac-extension) and drop
  `HIVEMQ_ALLOW_ALL_CLIENTS` entirely.

Either way, set the same `MQTT_USERNAME`/`MQTT_PASSWORD` on `hive_api` (EC2
side) and `robotstore` (robot side) once the broker actually enforces them.

### 4. Robot-side changes — this is the whole diff

```bash
# On whatever machine is playing "the robot" — see the note below on
# turtlebot_sim
cp .env.robot.example .env.robot
# .env.robot:
#   ROBOT_MQTT_HOST=mqtt.yourdomain.com   # was localhost
#   ROBOT_MQTT_PORT=8883                  # was 1883 — TLS, once §2/§3 are done
#   MQTT_USERNAME=...                     # matches .env.aws on the AWS side
#   MQTT_PASSWORD=...                     # matches .env.aws on the AWS side
#   ROBOT_ID=robot-1                      # matches .env.aws on the AWS side

make -f Makefile.aws build_robot   # same colcon build as `make build_robotstore`
make -f Makefile.aws run_robot     # starts ONLY robotstore — --no-deps, so
                                    # this does NOT also spin up a local
                                    # mqtt-broker, which docker-compose.yml's
                                    # `depends_on` would otherwise do
```

`run_robot` only changes `robotstore`'s `MQTT_HOST`/`MQTT_PORT`/
`MQTT_USERNAME`/`MQTT_PASSWORD` (via `${ROBOT_MQTT_HOST:-localhost}`-style
substitution already built into `docker-compose.yml`) — `ROS_DOMAIN_ID`,
`RMW_IMPLEMENTATION`, `CYCLONEDDS_URI`, `network_mode: host` all stay exactly
as they are for local single-host dev. The robot's own ROS 2 graph never
left the robot.

That's it for `hive_mqtt_bridge`. Telemetry, localisation, scan, health,
`/tasks`, `/nav_goal`, `/cancel_nav`, `/set_pose`, and teleop all keep working
exactly as documented above — they were already designed around "robot
publishes/subscribes outbound to a broker," which is precisely what makes a
broker on a different continent a non-event for all of them.

**Testing with `turtlebot_sim` before switching to real hardware**:
`run_robot` and `turtlebot_sim` are two independent things that happen to
run on the same machine (your laptop, today) — keep starting the sim exactly
as documented in `turtlebot_mcp_ros2` (`make run_sim` / `run_sim_headless`
from that directory), unrelated to `Makefile.aws`. `robotstore` and the sim
still find each other over local ROS 2 DDS on that machine, same as the
single-host setup this whole README otherwise describes — the only thing
that changed is which broker `hive_mqtt_bridge` reaches out to. When you
eventually swap the sim for the real robot, `run_robot` doesn't change at
all; only where you run it does.

### 5. The camera feed: signaling is fixed, the video path is the one caveat left

`POST /webrtc/offer` used to have `hive_api` make an **outbound HTTP call to
the robot** (`CAMERA_BRIDGE_URL`) to reach `hive_camera_bridge`'s signaling
endpoint — backwards for a robot behind NAT with no port forwarding, exactly
the situation this whole migration is otherwise designed to avoid needing.
That's fixed: signaling now rides the same MQTT link as everything else
(`cmd/webrtc_offer` → `webrtc/answer`, relayed by `hive_mqtt_bridge` to
`hive_camera_bridge` over local HTTP — see `mqtt_client.publish_webrtc_offer`
and `bridge_node._handle_cmd_webrtc_offer`). No port forwarding, no VPN, no
`CAMERA_BRIDGE_URL`/`host.docker.internal` config — the robot dials out to
the broker for this exchange exactly like it does for `/nav_goal`.

What this does **not** fix, because WebRTC itself is built this way: once
signaling completes, the actual video (RTP, continuous) still flows
**directly** between the browser and `hive_camera_bridge` — it never touches
the gateway or MQTT, those aren't built for bulk real-time media. That
direct path is negotiated via ICE using public STUN servers, which is often
enough on its own when only one side (the robot) is behind NAT — many home
routers support the UDP hole-punching this needs. It is not guaranteed
(symmetric NATs, restrictive corporate networks, etc.), so if the picture
still doesn't come through after signaling clearly succeeds (check
`hive_api` logs for `[/webrtc/offer]` — no more "camera bridge unreachable"
errors expected), the fix is a TURN relay (e.g. `coturn`) for the media
path specifically. That's a separate, still-open piece of work — ask if the
feed needs it.

Everything else in this README (MQTT topic tree, the three navigation
dispatch paths, `/nav_goal`/`/cancel_nav`/`/set_pose`) was already
unaffected by any of this — it's specific to WebRTC's two-phase
signaling/media design, not the MQTT-backed paths.

### 6. Latency — re-examine, don't just assume it's fine

The teleop dual deadman (400ms browser↔gateway, 500ms gateway↔bridge — see
[Safety notes](#-safety-notes)) was tuned for same-LAN latency. Once
`cmd/velocity` crosses the public internet, round-trip time depends on the
robot's own uplink (WiFi backhaul vs. LTE vs. Starlink), and could land
anywhere from 30ms to 300ms+ with jitter. Before trusting manual teleop over
this path: surface round-trip latency to the operator (a number on Remote
Controller, not just a connected/disconnected pill), and seriously consider
whether teleop should be a LAN-only capability even after this split, with
AWS handling mission dispatch and telemetry only — those tolerate latency
fine; closed-loop human control doesn't.

### Migration checklist

1. Launch the EC2 instance, install Docker + Compose v2.
2. Decide broker auth now (Mosquitto+password_file or HiveMQ file-RBAC) —
   don't deploy with `HIVEMQ_ALLOW_ALL_CLIENTS=true` reachable publicly, even
   temporarily.
3. On the EC2 instance: `cp .env.aws.example .env.aws`, fill in real
   `MQTT_USERNAME`/`MQTT_PASSWORD`/`CORS_ALLOWED_ORIGINS`/`ROBOT_ID`, then
   `make -f Makefile.aws aws_build && make -f Makefile.aws aws_run`.
4. ALB/nginx + ACM cert in front of `appstore`/`hive_api`; TLS listener on
   the broker's 8883; Route53 records for both.
5. On the robot side (your laptop with `turtlebot_sim` today, real hardware
   later): `cp .env.robot.example .env.robot`, fill in the AWS broker's
   address + the SAME credentials/`ROBOT_ID` as `.env.aws`, then
   `make -f Makefile.aws build_robot && make -f Makefile.aws run_robot`.
6. `make -f Makefile.aws aws_check` — confirm `mqtt_connected: true`, then
   `robot_alive: true` once the robot-side bridge reconnects and (if
   testing with the sim) `turtlebot_sim` is actually up.
7. Decide on the camera feed (§5 above) before assuming Remote Controller's
   camera toggle will work — everything else will.

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
