# 1) What happens inside `server.cpp` (Hive-BT-Server)

### `/hive/execute_behavior` (Action **server**)

* **Who calls it?** Your HTTP API gateway (FastAPI) sends an action **goal** here (via rclpy client), containing `id`, optional `behavior_name`, and a `task_id`.
* **What does it do?**

  1. **Accepts the goal** (after sanity checks).
  2. **Routes** it to a specific behavior:

     * If `behavior_name` is empty, map `id` → `"SimpleTurtle"` or `"GoToA"`, etc.
  3. **Forwards** the goal to the Runner (details below).
  4. **Relays feedback** from Runner back to the original API client.
  5. **Finishes** by returning the Runner’s result (SUCCESS/FAILURE + log file).
  6. **Publishes status** messages (JSON-ish) on `/hive/status` so humans/tools can watch:

     * `ROUTED` → which behavior got selected
     * `FEEDBACK` → current state/progress text
     * `RESULT` → success/failure + log file
     * Also `ERROR`, `CANCELLED` where relevant

### `/bt_runner/execute_behavior` (Action **client** inside Hive)

* **Who does it talk to?** The Runner’s action **server**.
* **What does it do?**

  * Sends the **forwarded goal** (now with a concrete `behavior_name`).
  * Registers a **feedback callback** → forwards feedback to the API-side client and publishes `/hive/status`.
  * **Polls for result** (no extra executor) and, when ready, returns that result up to the original caller.

### `/hive/status` (Publisher from Hive)

* **What data?** Small JSON-ish strings for humans & dashboards:

  * `{"task_id":"<uuid>","phase":"ROUTED","detail":"behavior=GoToA"}`
  * `{"task_id":"<uuid>","phase":"FEEDBACK","detail":"state=RUNNING, progress=50.0"}`
  * `{"task_id":"<uuid>","phase":"RESULT","detail":"SUCCESS log=task_<uuid>.btlog"}`
* **Why useful?** Lets you `ros2 topic echo /hive/status` or build a UI to see *which* behavior, *how it’s progressing*, and *final outcome* without opening terminals or parsing action internals.

---

# 2) What happens inside `runner.cpp` (BT-Runner)

### `/bt_runner/execute_behavior` (Action **server**)

* **Who calls it?** Hive-BT-Server (its action **client**).
* **What does it do?**

  1. Accept the goal: `id`, `behavior_name`, `task_id`.
  2. If `behavior_name` is empty, **map** `id` → behavior (`1→SimpleTurtle`, `2→GoToA`, …).
  3. Build a BehaviorTree **factory** and **register nodes** (turtle nodes + GoToA nodes).
  4. Create a **Blackboard** (put in the shared Context, params, etc.).
  5. **Load the tree XML** for the selected behavior.
  6. Tick the tree (at `tick_ms`) with **Groot2** + **FileLogger** instrumentation.
  7. Continuously send **feedback** (progress/state) to Hive.
  8. On terminal state, publish a safety **zero Twist** (turtle behaviors), and return **Result** (success/failure + log filename).

---

# 3) How the two action pairs relate

There are **two action pairs** in the system:

## Pair A — API ↔ Hive

* **API gateway** (action **client**) → `/hive/execute_behavior` (action **server** in Hive)
* API sends goals (id/behavior_name/task_id) → waits for final result
* Hive may send **feedback** back to API
* Hive additionally publishes `/hive/status` for human-readable tracking

## Pair B — Hive ↔ Runner

* **Hive** (action **client**) → `/bt_runner/execute_behavior` (action **server** in Runner)
* Hive **forwards** goal to Runner, **relays** feedback up, and **returns** Runner’s result to API
* Runner does the actual Behavior Tree execution

So Hive is both:

* an **Action server** (to the API), and
* an **Action client** (to the Runner).

This “middle” position is the **orchestrator/router** role.

---

# 4) ROS 2 Actions: the simple principle

An **Action** abstracts long-running tasks with:

* a **Goal** (request),
* optional **Feedback** (progress updates),
* a **Result** (final success/failure & outputs),
* optional **Cancel**.

### Client:

* sends a goal asynchronously to a named **action server**,
* gets back a **goal handle**,
* **subscribes to feedback** (callback),
* **waits for the result** (future).

### Server:

* receives the goal, accepts/rejects,
* **executes** the task,
* periodically **publishes feedback**,
* eventually **returns a result**,
* handles **cancel** requests.

### Apply that to our app:

* **API client → Hive server**: “please execute behavior X with id Y”; Hive accepts, then delegates.
* **Hive client → Runner server**: “please run tree Z”; Runner executes the BehaviorTree and streams feedback.
* **Runner → Hive → API**: feedback and final result go back up the chain.

---

# 5) End-to-end flow (compact sequence)

1. **Client**: `POST /tasks { "id": 2 }` → API creates **task_id** and sends **Action goal** to `/hive/execute_behavior`.
2. **Hive server**: accepts goal, resolves behavior (`GoToA`), publishes `/hive/status: ROUTED`.
3. **Hive client**: sends **Action goal** to Runner `/bt_runner/execute_behavior` with `behavior_name="GoToA"`.
4. **Runner server**: loads `go_to_a.xml`, registers nodes, ticks tree; **publishes feedback** (e.g., RUNNING).
5. **Hive client feedback callback**: relays that feedback → **Hive server** publishes `/hive/status: FEEDBACK`.
6. **Runner server**: finishes → returns **Result** (SUCCESS/FAILURE + log file).
7. **Hive client**: receives result → **Hive server** publishes `/hive/status: RESULT` and returns the result to the API caller.

**Cancel path:** API issues cancel → Hive receives cancel for `/hive/execute_behavior` → Hive forwards cancel to Runner goal handle → Runner stops and returns **canceled** (Hive marks task canceled).

---

# 6) Why this design works well

* **Separation of concerns**:

  * API talks HTTP and transforms to Actions (no BT details).
  * Hive routes & monitors (no tree execution).
  * Runner executes BTs (no HTTP or routing logic).
* **Scalable**:

  * Add more behaviors by registering nodes + XML and mapping an ID.
  * Add more runners (even per-robot namespaces) without touching API logic.
* **Observable**:

  * `/hive/status` gives human-friendly markers (ROUTED / FEEDBACK / RESULT).
  * Groot2 shows live BT execution.
  * File logs per task.

---

# 7) A tiny mental model (analogy)

* **API** = the receptionist: opens a ticket (`task_id`).
* **Hive** = the manager: chooses the right specialist, gives updates to the receptionist, files a final report.
* **Runner** = the specialist: does the work step-by-step, updates progress, and signs the job as done (or failed).

That’s all an ROS 2 Action is: a clean request/feedback/result pipeline. You’ve just chained two of those pipelines together with Hive in the middle acting as a router and status hub.


