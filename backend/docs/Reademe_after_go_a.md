# Hive BT System — Multi-Behavior, 3-Layer ROS 2 Architecture

This repo demonstrates a clean, scalable way to run **multiple Behavior Trees (BTs)** behind a simple **HTTP API**. It’s built around three small, composable layers that make it easy to add new behaviors (like **SimpleTurtle** or **GoToA**) without touching the rest of the system.

* **API Layer**: HTTP → ROS 2 Action (receives external requests, validates & forwards)
* **Hive-BT-Server**: Router/Orchestrator (maps `id → behavior`, streams feedback & results)
* **BT-Runner**: Executes BehaviorTree.CPP trees (one process, many behaviors)

Groot2 logging is enabled for live visualization. All logs are saved per task for post-run analysis.

---

## TL;DR – Running the Demo

Open **three terminals** (source in each):

```bash
source /opt/ros/humble/setup.bash
cd ~/BT/ros2_bt_ws
source install/setup.bash
```

**T1 – Runner**

```bash
ros2 run bt_runner bt_runner_node --ros-args -p tick_ms:=750 -p groot_port:=1667
```

**T2 – Hive Server**

```bash
ros2 run hive_bt_server hive_server_node
```

**T3 – API**

```bash
ros2 run hive_api_gateway api
```

**Trigger a behavior via HTTP:**

```bash
# id=1 -> SimpleTurtle (your earlier BT)
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"id":1}'

# id=2 -> GoToA (new behavior)
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"id":2}'
```

Open **Groot2** and connect to `localhost:1667` to see each BT run step-by-step.

---

## Repository Structure (conceptual)

```
hive_interfaces/                # ROS 2 actions/messages
  action/ExecuteBehavior.action

hive_api_gateway/               # FastAPI HTTP → ROS2 Action bridge
  hive_api_gateway/main.py

hive_bt_server/                 # Router/Orchestrator (Action server + client)
  src/server.cpp

bt_runner/                      # Executes BTs (Action server)
  include/bt_runner/nodes_goto.hpp       # GoToA leaf nodes
  src/runner.cpp                         # Loads & runs BTs by name
  trees/
    go_to_a.xml                         # GoToA Behavior
bt_turtle_demo/                 # Reused working turtle BT & nodes
  include/bt_turtle_demo/nodes.hpp
  trees/turtle_tree_simple.xml
```

---

## What’s Implemented

### Behaviors

* **SimpleTurtle** (`id=1`)
  Your proven demo: random motion sequence + intelligent fallback using `/scan` and `/cmd_vel`.

* **GoToA** (`id=2`)
  A minimal navigation behavior in two leaves:

  1. `PublishGoalPose` → publishes hard-coded goal to `/goal_pose` (PoseStamped)
  2. `WaitAtTarget` → waits until `/amcl_pose` is within tolerance of the target

### Data & Control Flow

```
HTTP POST /tasks {"id":N}
            │
            ▼
  hive_api_gateway (FastAPI)
    └── sends ExecuteBehavior.Goal{id, task_id, payload}
            │
            ▼
  hive_bt_server (Router/Orchestrator)
    ├── maps id→behavior ("SimpleTurtle" | "GoToA" | ...)
    ├── forwards goal to bt_runner
    ├── relays feedback & result
    └── publishes /hive/status status messages (JSON strings)
            │
            ▼
  bt_runner
    ├── registers shared BT nodes (turtle + goto)
    ├── loads behavior XML by name
    ├── runs ticks (Groot2 + file logs)
    └── returns result + log path
```

---

## How We Added a New Behavior (GoToA) Without Breaking Anything

1. **Add leaves** inside `bt_runner` (fully local to the runner):

   * `PublishGoalPose` (publish PoseStamped `/goal_pose`)
   * `WaitAtTarget` (subscribe `/amcl_pose`, success when within tolerance)
   * Register them in a helper: `bt_runner_goto::registerGoToANodes(factory)`

2. **Add XML**: `bt_runner/trees/go_to_a.xml`

   ```xml
   <BehaviorTree ID="GoToA">
     <Sequence>
       <PublishGoalPose x="-1.0" y="0.46" yaw_deg="0.0" frame_id="map"/>
       <WaitAtTarget x="-1.0" y="0.46" tol_m="0.2" timeout_ms="60000"/>
     </Sequence>
   </BehaviorTree>
   ```

3. **Map it** in `bt_runner/src/runner.cpp`:

   * If `behavior_name` is empty and `id==2` → use `"GoToA"`
   * Load its XML from `bt_runner/share/bt_runner/trees/go_to_a.xml`

4. **Optionally** add a param in `hive_bt_server` to show routing in logs:

   * `route_id_2: "GoToA"` (purely for clarity—runner handles mapping too)

**Result:** No change to API or interfaces. The new behavior slots right in.

---

## Commands You’ll Use Often

### Build (recommended order when iterating on interfaces/nodes)

```bash
colcon build --symlink-install --packages-select hive_interfaces
source install/setup.bash

colcon build --symlink-install --packages-select bt_turtle_demo bt_runner
source install/setup.bash

colcon build --symlink-install --packages-select hive_bt_server hive_api_gateway
source install/setup.bash
```

### Run

See the **TL;DR** section, or use a launch file later to bring up all layers.

### Trigger Tasks

```bash
# SimpleTurtle (id=1)
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"id":1}'

# GoToA (id=2)
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"id":2}'
```

### Watch Status

```bash
ros2 topic echo /hive/status          # router publishes JSON-ish status
# example:
# {"task_id":"...","phase":"ROUTED","detail":"behavior=GoToA"}
# {"task_id":"...","phase":"FEEDBACK","detail":"state=RUNNING, progress=50.000000"}
# {"task_id":"...","phase":"RESULT","detail":"SUCCESS log=task_<uuid>.btlog"}
```

---

## Debugging Guide

**Symptom → Fix**

* `Package 'X' not found`
  Ensure package installed markers exist:
  `install/share/ament_index/resource_index/packages/<pkg>`
  and executables: `install/lib/<pkg>/<node>`.
  If missing, add:

  ```cmake
  file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME} "")
  install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}
          DESTINATION share/ament_index/resource_index/packages)
  install(FILES package.xml DESTINATION share/${PROJECT_NAME})
  ```

  Then `rm -rf build install log` and rebuild.

* **hive_bt_server crashes** with
  “Node has already been added to an executor”
  Avoid `spin_until_future_complete()` on the same node. The server uses async futures + `wait_for()` polling now — keep this pattern.

* **Runner can't find headers**
  Make sure your package exports and installs the include dir and sets target include paths:

  ```cmake
  target_include_directories(<target> PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>)
  install(DIRECTORY include/ DESTINATION include)
  ament_export_include_directories(include)
  ```

* **BehaviorTree port type mismatch**
  Ensure all ports use consistent C++ types (e.g., `int64_t` vs `int`). If you change port type anywhere, update all references.

* **Groot not visualizing**
  Runner must run and `groot_port` must match the Groot2 GUI connection (default 1667). Use slower `tick_ms` for clear transitions.

* **GoToA never succeeds**
  Confirm `/amcl_pose` exists in your sim. If you aren’t running AMCL, switch `WaitAtTarget` to use `/tf` odom distance instead (ask and we’ll give the variant).

---

## Tracking, Logs & Observability

* **Live**:

  * Groot2: connect to `localhost:1667`
  * `/hive/status`: textual JSON-ish status from router
* **Offline**:

  * Runner writes per-task BT logs: `task_<task_id>.btlog` (FileLogger2)
* **Console**:

  * Runner prints leaf logs (e.g., motion/goal messages)
  * Hive prints routing, feedback (throttled), and result lines

---

## How to Add More Behaviors (repeatable pattern)

1. **Create leaves** (if needed) in `bt_runner/include/bt_runner/…` and register them.
2. **Add Behavior XML** to `bt_runner/trees/new_behavior.xml`; install via CMake.
3. **Wire mapping**:

   * In `bt_runner/src/runner.cpp`, map `id → behavior_name` (or accept `behavior_name` directly).
   * Optional: add a pretty route param in `hive_bt_server` for nicer logs (`route_id_3: "GoHome"`).
4. **Build & run**; POST `{"id":3}` and watch it work.

> Keep behaviors small: use **SubTrees** to compose reusable chunks (e.g., `RandomMotion`, `IntelligentMotion`), then assemble per-task top-level trees.

---

## Modularity & Scaling

* **Single Action interface** end-to-end: `ExecuteBehavior` (Goal/Feedback/Result)
* **One Runner, many behaviors**: BehaviorTree factory loads multiple trees; you instantiate by name per task.
* **Router stays stateless**: clean mapping logic, forwards feedback/results, and publishes status.
* **Multi-robot**: add a `robot_name` field to the goal and run one Runner per robot namespace (`/robot_X/bt_runner/execute_behavior`). Router picks the right namespace.

---

## Automation Ideas

* **Dev automation**:

  * A tiny **Makefile** / script for `colcon build` (packages in order)
  * A **Docker** image with ROS 2 + dependencies + Groot
* **CI**:

  * Run `colcon test` on PRs; lint actions/nodes; smoke-test a mock behavior
* **Deployment**:

  * One launch file to bring **API + Hive + Runner** (and your sim) up together

---

## Simulation Setup (TurtleBot + GoToA)

**Requirements**:

* A TurtleBot (or similar) sim that publishes `/amcl_pose`
* A node that consumes `/goal_pose` and triggers a navigation behavior (or plug Nav2 to forward `/goal_pose` to `NavigateToPose` action; many forks expose this bridge)

**Quick test**:

1. Start your simulator (Gazebo or Stage) with AMCL enabled (or run Nav2 stack).
2. Run the three layers as in TL;DR.
3. Call:

   ```bash
   curl -X POST http://localhost:8080/tasks \
     -H "Content-Type: application/json" \
     -d '{"id":2}'
   ```
4. Observe:

   * Runner prints:

     * `[PublishGoalPose] /goal_pose x=-1.00 y=0.46 …`
     * `[WaitAtTarget] target …`
     * eventually: `Goal reached`
   * Hive prints ROUTED / FEEDBACK / RESULT; `/hive/status` shows JSON status
   * Groot2 draws the two-node `GoToA` tree and status transitions

If your sim doesn’t produce `/amcl_pose`, swap `WaitAtTarget` to check `/tf` odom distance or Nav2 action feedback. (Ping when you want that node and I’ll drop it in.)

---

## Final Notes

* Keep **tick_ms** slow (500–1000 ms) in development for beautiful Groot visuals.
* Always publish a **zero Twist** at terminal states in motion behaviors (safety).
* Prefer **StatefulActionNode** for operations that need time or repeated checks (e.g., wait/monitor nodes).
* Log everything with the **task_id** so you can correlate API calls ↔ BT logs.

If you want, I’ll add:

* `GET /tasks/{task_id}` to return the last known status,
* `DELETE /tasks/{task_id}` to cancel (the router already forwards cancel),
* a **GoHome** behavior with a different coordinate and the same pattern.
