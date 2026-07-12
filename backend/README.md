# Hive BT System

Multi-Behavior, 3-Layer ROS 2 Architecture

A clean, scalable way to run **multiple Behavior Trees (BTs)** behind a simple **HTTP API**. The system is split into three small, composable layers so you can add new behaviors (e.g., `SimpleTurtle`, `GoToA`) without touching the rest.

## Architecture

**API Layer – HTTP → ROS 2 Action**
Receives external requests, validates input, and forwards them as ROS 2 actions.

**Hive-BT-Server – Router / Orchestrator**
Maps `id → behavior`, launches tasks, and streams feedback/results.

**BT-Runner – BehaviorTree.CPP Executor**
Runs trees using BehaviorTree.CPP (one process can host many behaviors).

**Observability**

* **Groot2** live visualization (WebSocket).
* Per-task logs saved for post-run analysis.

---

## Prerequisites

* ROS 2 **Humble** (or compatible)
* BehaviorTree.CPP (installed via your ROS distro or workspace)
* Groot2 (optional but recommended for visualization)
* Workspace assumed at `~/ros2_bt_ws`

---

## TL;DR – Run the demo

Open **three terminals** (source in each):
### Installation 

```bash
source /opt/ros/humble/setup.bash
mkdir -p ~/ros2_bt_ws/src
cd ~/ros2_bt_ws/src
git clone https://github.com/Hive-Robots/hive_live_robot_store
cd ~/ros2_bt_ws
colcon build
source install/setup.bash
```

### T1 – Runner

```bash
cd ~/ros2_bt_ws
source install/setup.bash
ros2 run bt_runner bt_runner_node --ros-args -p tick_ms:=750 -p groot_port:=1667
```

### T2 – Hive Server

```bash
cd ~/ros2_bt_ws
source install/setup.bash
ros2 run hive_bt_server hive_server_node
```

### T3 – API

```bash
cd ~/ros2_bt_ws
source install/setup.bash
ros2 run hive_api_gateway api
```

---

## Trigger a behavior (HTTP)

Enable **GoToA** behavior (example uses `id=2`):

```bash
curl -X POST http://localhost:8080/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": 2}'
```

**Live view:** Open **Groot2** and connect to `localhost:1667` to watch each BT tick step-by-step.

---

## Check status (ROS topic)

```bash
cd ~/ros2_bt_ws
source install/setup.bash
ros2 topic echo /hive/status
```

---

## Configuration

* `tick_ms` (int): BT tick period in milliseconds. Default demo value: `750`.
* `groot_port` (int): WebSocket port for Groot2. Default demo value: `1667`.

---

## Add a new behavior

1. Implement the new BehaviorTree.CPP tree and register it with **BT-Runner**.
2. Map a new numeric **id** to your behavior in **Hive-BT-Server**.
3. Call the API with that `id`:

   ```bash
   curl -X POST http://localhost:8080/tasks -H 'Content-Type: application/json' -d '{"id": <your_id>}'
   ```

---

## Logging & Visualization

* **Groot2** shows live tree structure and node statuses.
* The system stores **per-task logs** to simplify debugging and post-run analysis (location depends on your runner/server config).

---

## Troubleshooting

* **No trees visible in Groot2:** verify `groot_port` matches the runner argument and firewall allows local connections.
* **API returns error:** ensure the `id` is mapped to a behavior in Hive-BT-Server.
* **No status on `/hive/status`:** confirm Hive-BT-Server is running and the API successfully created a task.

---

## License

Specify your project’s license here (e.g., Apache-2.0, MIT).






### Test on charlie

### T1 – Runner-server

```bash
cd ~/demo_ws
source install/setup.bash
ros2 launch bt_runner hive_server_runner.launch.py
```

### T2 – API with docker

```bash
cd ~/demo_ws/src
make run-api
```

### T3 – Status

```bash
cd ~/demo_ws
source install/setup.bash
ros2 topic echo /hive/status

```


### T4 – API from curl (For co-ordinate B[Towards exists door]) 

```bash
cd ~/demo_ws
source install/setup.bash
curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 3, "note": "drive to B"}' 

```
### API from curl (For co-ordinate A)
```bash
cd ~/demo_ws
source install/setup.bash
curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 2, "note": "drive to A"}'

```


### Navigation
### T4 – Livox

```bash
cd ~/charli_nav_ws
./run_livox.sh

```


### T4 – navigation

```bash
cd ~/version1_ws
./run_localization.sh

```


## Run with docker approach
### T1 – API with docker

```bash
make run-api
```

### T2 – Robotstore with docker

```bash
make run-robotstore
```

### T0 – Running both api and robotstore

```bash
make run-all

(or)

docker compose up
```



###  API curl commands to individual apps
```bash

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 2, "note": "drive to A"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 3, "note": "drive to B"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 4, "note": "drive to AA"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 5, "note": "drive to BB"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 6, "note": "drive to route with no return"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 7, "note": "drive to route with return"}'

curl -X POST http://localhost:8080/tasks   -H 'Content-Type: application/json'   -d '{"id": 10, "note": "StopNow"}'


```