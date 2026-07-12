# 🤖 Robot App Store — Full-Stack Robot Navigation System

A fully dockerized robot operator platform: a React HMI dashboard driving a ROS 2
navigation stack through a layered behavior-tree architecture, with a TurtleBot3
Gazebo simulation for development.

- **Simple Route Planner** – place waypoints on the live robot map, dispatch
  multi-waypoint missions, watch the robot's GPS-style position marker track
  AMCL localisation in real time
- **Dashboard** – live telemetry and system status
- **Emergency Stop** – one-click software stop (cancels navigation, forces zero twist)
- **Remote Controller** – keyboard/joystick teleop with LIDAR HUD

---

## 🔭 System Overview

The system is a **three-layer robot control platform**, each layer with a single
responsibility, connected end-to-end from a browser click to robot wheels:

| Layer | What it does | Technology |
|---|---|---|
| **HMI (frontend)** | Operator-facing dashboard: map display, waypoint placement, live robot position/scan/telemetry, mission dispatch | React + Vite + TypeScript, Canvas rendering, WebSockets |
| **API Gateway** | Translates web requests ↔ ROS 2. Serves the map, streams `/odom`, `/scan`, `/amcl_pose` over WebSockets, converts missions into ROS action goals, monitors robot health | FastAPI + rclpy in one process (uvicorn + spinning ROS node) |
| **Behavior layer** | Executes missions as behavior trees: `hive_bt_server` routes behavior requests (by id or name) → `bt_runner` loads and ticks the matching BT XML → BT nodes drive Nav2 one waypoint at a time with monitoring, pauses and cancel support | C++, rclcpp_action, BehaviorTree.CPP, Groot2-compatible |
| **Robot / Simulation** | Nav2 stack (AMCL localisation, costmaps, planners, controllers) driving either the Gazebo TurtleBot3 sim or real hardware — the layers above cannot tell the difference | Nav2, Gazebo 11, TurtleBot3 |

Why layered? The UI never talks ROS directly (any HTTP client works — `curl` can
dispatch a mission). The behavior layer never sees pixels or JSON quirks — it
receives clean, typed `ExecuteBehavior` action goals. And the robot layer is
swappable: point the same three upper layers at real hardware by running the
robot's own Nav2 instead of the sim container.

Everything runs in **four Docker containers on host networking**, discovering
each other over CycloneDDS on ROS domain 0 — no broker, no port mapping, no
configuration beyond a shared RMW vendor.

---

## 🏗 Architecture

```
┌──────────────────────────── appstore repo (this) ───────────────────────────┐
│                                                                              │
│  ┌────────────────┐   HTTP / WebSocket    ┌──────────────────────────────┐   │
│  │   appstore     │ ────────────────────▶ │   hive_api  (port 1717)      │   │
│  │  React + Vite  │   :1717               │   FastAPI + rclpy gateway    │   │
│  │  (port 5174)   │                       │   backend/hive_api_gateway   │   │
│  └────────────────┘                       └──────────────┬───────────────┘   │
│                                                          │ ROS 2 action      │
│                                                          ▼                   │
│                                          ┌──────────────────────────────┐    │
│                                          │  robotstore container        │    │
│                                          │  ┌────────────────────────┐  │    │
│                                          │  │ hive_bt_server         │  │    │
│                                          │  │ /hive/execute_behavior │  │    │
│                                          │  └───────────┬────────────┘  │    │
│                                          │              ▼               │    │
│                                          │  ┌────────────────────────┐  │    │
│                                          │  │ bt_runner              │  │    │
│                                          │  │ BehaviorTree.CPP exec  │  │    │
│                                          │  │ (go_to_waypoints.xml)  │  │    │
│                                          │  └───────────┬────────────┘  │    │
│                                          └──────────────┼───────────────┘    │
└─────────────────────────────────────────────────────────┼────────────────────┘
                                                          │ /navigate_to_pose
                                                          ▼
                              ┌──────────────────────────────────────────────┐
                              │  turtlebot3-sim container                    │
                              │  (appstore/turtlebot_mcp_ros2)               │
                              │  Gazebo 11 + TurtleBot3 burger + Nav2 + AMCL │
                              │  (swap for the real robot in production)     │
                              └──────────────────────────────────────────────┘
```

**All containers share:** `network_mode: host`, `ROS_DOMAIN_ID=0`,
`RMW_IMPLEMENTATION=rmw_cyclonedds_cpp`. This is non-negotiable — see
[Gotchas](#-gotchas).

### Mission flow (INITIATE NAVIGATION)

1. **UI** converts canvas waypoints → map-frame poses (metres, quaternions) and
   `POST /tasks` with `{id: 22, behavior_name: "FollowRoute", poses: [...]}`
2. **Gateway** builds an `ExecuteBehavior` action goal (waypoints serialized into
   `json_payload`) → sends to `/hive/execute_behavior`.
   If the Hive server is unreachable it falls back to Nav2 `NavigateThroughPoses` directly.
3. **hive_bt_server** resolves the alias `FollowRoute → GoToWaypoints`, forwards
   the goal to `/bt_runner/execute_behavior`, relays feedback upstream and status
   to `/hive/status`
4. **bt_runner** loads `go_to_waypoints.xml`, injects the waypoints onto the BT
   blackboard, and ticks the tree: for each waypoint `SendNav2Goal` →
   `MonitorNav2Status` → pause
5. **Nav2** plans and drives the robot; success bubbles back up the chain to the UI

### Repository layout

```
appstore/
├── src/                        # React frontend (pages, hooks, components)
│   └── hooks/                  #   useTelemetry / useScan / useLocalisation (WebSockets)
├── backend/                    # ALL ROS 2 packages (single source of truth)
│   ├── hive_api_gateway/       #   FastAPI + rclpy gateway node (Python)
│   ├── hive_bt_server/         #   Behavior router action server (C++)
│   ├── bt_runner/              #   BehaviorTree.CPP executor + BT XML trees (C++)
│   ├── hive_interfaces/        #   ExecuteBehavior.action definition
│   ├── cyclonedds.xml          #   DDS config (robot hardware interface pinning)
│   └── docker/dev/             #   Dockerfiles + entrypoints for both ROS images
├── map/                        # Operational map (map.pgm + map.yaml) — served by /api/map
├── docker/Dockerfile           # Frontend dev-server image
├── docker-compose.yml          # appstore + hive_api + robotstore services
├── Makefile                    # build/run targets (see below)
├── build_api/ install_api/     # colcon artifacts for the gateway (generated)
├── turtlebot_mcp_ros2/         # TurtleBot3 Gazebo simulation
│   ├── docker/Dockerfile-sim   #   Gazebo + TurtleBot3 + Nav2, all from apt
│   ├── docker/entrypoint_sim.sh#   readiness-gated boot: world → spawn → Nav2 → initialpose
│   ├── docker-compose.yml      #   turtlebot_sim service (X11 GUI passthrough)
│   └── Makefile                #   build_sim / run_sim / run_sim_headless
└── ...
```

---

## 🚀 Quick Start

### Prerequisites
- Docker v24+ with Compose v2, `docker buildx`
- An X11 desktop session (for the Gazebo/RViz GUI; headless mode needs none)
- Linux with host networking (ROS 2 DDS requirement)

### 1. Build everything (first time only)

```bash
# Main stack: gateway image + colcon build, robotstore image + colcon build, frontend image
cd ~/appstore
make build

# Simulation image (Gazebo + TurtleBot3 + Nav2 from apt — no colcon build)
cd ~/appstore/turtlebot_mcp_ros2
make build_sim
```

### 2. Run

```bash
# Terminal 1 — simulation (Gazebo + RViz windows open on your desktop)
cd ~/appstore/turtlebot_mcp_ros2
make run_sim                 # or: make run_sim_headless

# Terminal 2 — full app stack (frontend + gateway + hive/bt_runner)
cd ~/appstore
make run
```

The sim boots in a readiness-gated sequence: Gazebo world → robot spawn at
`SPAWN_X/SPAWN_Y/SPAWN_YAW` → Nav2 → AMCL initial pose **auto-set to the spawn
pose** (no manual "2D Pose Estimate" needed).

### 3. Use it

1. Open **http://localhost:5174**
2. Wait for the blinking **Connected** badge (requires `/global_costmap/costmap`
   and `/scan` both alive)
3. Open **Simple Route Planner** — the robot map loads automatically and the blue
   GPS-style marker blinks at the robot's AMCL pose
4. **PLACE WAYPOINT** → click positions on the map (click again to set heading)
5. **INITIATE NAVIGATION** — the robot drives the route in Gazebo
6. **CLEAR ROUTE** → place the next set of waypoints → send again

### Stopping

```bash
cd ~/appstore && make stop-all
cd ~/appstore/turtlebot_mcp_ros2 && make stop
```

---

## 🔌 Gateway API (port 1717)

| Endpoint | Type | Description |
|---|---|---|
| `GET /health` | REST | `robot_alive` = costmap + scan topics fresh (<5 s) |
| `GET /localization` | REST | Latest AMCL pose (or `available: false` if stale) |
| `GET /api/map` | REST | Operational `map.pgm` rendered as PNG |
| `GET /api/map/meta` | REST | `map.yaml` (resolution, origin) for coordinate conversion |
| `POST /tasks` | REST | Dispatch a mission (`id: 22` = multi-waypoint FollowRoute) |
| `/api/telemetry` | WS | `/odom` pose at 10 Hz — `{x, y, theta}` |
| `/api/scan` | WS | `/scan` LaserScan at 1 Hz (drives the Scan Observation panel) |
| `/api/localisation` | WS | `/amcl_pose` at 5 Hz — `{x, y, yaw, frame_id, age_s}` (drives the GPS marker) |

---

## 🛠 Make Targets

### appstore (`~/appstore`)

| Target | Description |
|---|---|
| `make build` | Build ALL images + colcon workspaces (gateway, robotstore, frontend) |
| `make run` | Start all three services via docker compose |
| `make stop-all` | `docker compose down` |
| `make build_hive_api` | Rebuild just the gateway workspace (after `main.py` changes: not needed — source is volume-mounted; restart the container instead) |
| `make build_robotstore` | Rebuild hive_bt_server + bt_runner (needed after C++ / BT XML changes) |
| `make logs-api` / `make logs-robotstore` | Tail container logs |
| `make clean` | Delete all colcon artifacts |

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

1. **One DDS vendor everywhere.** Every ROS 2 participant — containers AND
   anything on the host — must use `RMW_IMPLEMENTATION=rmw_cyclonedds_cpp` and
   `ROS_DOMAIN_ID=0`. Mixing FastRTPS and CycloneDDS on the same host *appears*
   to work (`ros2 topic list` shows everything) but data delivery silently fails
   because FastRTPS uses shared-memory transport for same-host peers.
   Symptom: action goals time out "waiting for acceptance".
2. **One Gazebo at a time.** Never run the host `turtle_nav.sh` and the sim
   container together — two gzservers deadlock on port 11345.
3. **Gateway Python changes** hot-apply on container restart
   (`docker restart hive_api-api`) because the source is volume-mounted.
   **C++ / BT XML changes** need `make build_robotstore`.
4. **AMCL publishes on motion.** The GPS marker fades if the robot sits still
   >10 s (staleness filter) and reappears on movement.
5. **Verify layers with probes, not lists.** `ros2 action list` proves
   discovery, not delivery. Use `ros2 action send_goal` / `ros2 topic echo --once`
   to prove a connection actually works.

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
