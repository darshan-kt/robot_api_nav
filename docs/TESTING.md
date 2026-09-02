# Testing

Four suites, each run in the place its code actually lives.

| Suite | What it covers | Where it runs | Command |
|---|---|---|---|
| **Gateway unit** | `geometry.py`, `config.py`, `mqtt_client.py`, BT-layer name contracts | Host, no stack needed | `make test-unit` |
| **Gateway integration** | The real FastAPI app + a fake broker: every REST route, every WebSocket stream | Host, no stack needed | `make test-integration` |
| **ROS bridge unit** | `hive_mqtt_bridge`, `hive_camera_bridge` — teleop clamping, deadman, liveness, payload validation | Inside `robotstore` container | `make test-ros` |
| **Frontend** | `src/lib`, `src/hooks` (vitest + jsdom) | Host | `npm test` |
| **System** | The live stack: HTTP, MQTT round trips, WebSocket streams, container wiring | Host, stack must be up | `make test-system` |
| **AWS latency** | Ack margins and the `/goal_pose` fallback under injected latency | Host, **broker only** | `make test-latency` |
| **Hardware & Sensors Lab (e2e)** | Both device cards fully expanded — parameters, running instructions, SIMULATED DATA banner, live mock viz, raw-frame inspector, learning toggles | Host, opt-in only | `npm run test:e2e` |

`make test` runs everything that needs no running stack. `make test-all` adds the
system suite.

---

## Setup (once)

```bash
python3 -m venv --system-site-packages .venv-test
.venv-test/bin/pip install -r tests/requirements-dev.txt
npm install
```

`--system-site-packages` is deliberate: it keeps the host's `rclpy` visible so
nothing has to be reinstalled, while `aiomqtt` and the test tooling stay out of
the user site-packages.

---

## Running

```bash
make test              # unit + integration + frontend  (no stack required)
make test-system       # requires: docker compose up -d
make test-all          # everything

# Narrower:
.venv-test/bin/python -m pytest tests/unit -q
.venv-test/bin/python -m pytest tests/integration -q
npm test -- src/lib
```

### The ROS suites

`rclpy`, `nav2_msgs` and `hive_interfaces` only exist, correctly built, inside
the `robotstore` container. `backend/install/` in this repo is a **stale build
tree from another machine** — its symlinks point at `/home/charlie/ros2_ws`
and are broken here, so host-side ROS imports fail. Run them in the container,
where `backend/hive_mqtt_bridge/` is bind-mounted live:

```bash
make test-ros
```

No node is spun up and no DDS traffic is generated — handlers are exercised on
a bare instance holding only the attributes they touch.

---

## System tests and robot motion

System tests skip themselves when the stack isn't reachable, so `make test`
stays green on a laptop.

Anything that would **move the robot** is gated:

```bash
HIVE_ALLOW_MOTION=1 .venv-test/bin/python -m pytest tests/system -q
```

Ungated system tests are safe by construction — they read state, or they
*stop* motion (`/cancel_nav`, zero-twist teleop frames). The gated ones
(`tests/system/test_mission_e2e.py`, two in `test_mqtt_roundtrip.py`) dispatch
real missions; each targets the robot's own current position and cancels
afterwards, but **run them against the simulator before real hardware.**

### Environment knobs

| Variable | Default | Purpose |
|---|---|---|
| `HIVE_ALLOW_MOTION` | unset | `1` enables tests that drive the robot |
| `HIVE_TEST_GATEWAY_HOST/PORT` | `localhost:1717` | Point at a remote gateway |
| `HIVE_TEST_MQTT_HOST/PORT` | `localhost:1883` | Point at a remote broker |
| `HIVE_TEST_EXPECT_STRICT_CORS` | unset | `1` makes a wildcard CORS policy a failure — set it for any internet-facing deployment |

---

## What the suites deliberately protect

Some tests exist because of a specific failure this system has had or could
have. Worth knowing before "simplifying" them:

- **Teleop clamping is tested twice** — gateway-side and bridge-side. That's
  not duplication: anything that can publish to the broker bypasses the
  gateway entirely, so the bridge limit is the one that protects hardware.
- **Both deadmen are tested** — the gateway's 400 ms WebSocket watchdog and
  the bridge's independent 500 ms MQTT watchdog. They cover different
  failures; the bridge's is the only one that survives a dead gateway.
- **Malformed-payload tests on every `cmd/*` topic.** Publishing `[]` to
  `cmd/velocity` once killed paho's network thread inside the bridge, which
  kept publishing telemetry (so `/health` still said `robot_alive: true`)
  while silently ignoring every command, `cancel_nav` included. See
  `test_bridge_helpers.py`'s "Command payload validation" block.
- **Map drift detectors.** `geometry.MAP_META` is hardcoded, while
  `/api/map/meta` reads the live `map.yaml`. Waypoint conversion uses the
  hardcoded copy, so a map with a different resolution or origin would
  silently misplace every waypoint. Two tests compare them —
  `test_served_map_and_conversion_metadata_agree` and its live counterpart.
  **These will fail when the map changes, and that failure is the point:
  update `geometry.MAP_META` to match.**
- **Behaviour-name contract tests.** A mission crosses four namespaces
  (frontend id/name → `route_id_*` params → `kAliases` → runner switch → tree
  XML). Nothing enforces that chain at build time. `test_behavior_tree_contract.py`
  parses the actual C++ sources and asserts it closes — in particular that the
  route planner's `behavior_name: 'FollowRoute'` still resolves to
  `GoToWaypoints`.

---

## AWS split: latency gates

The gateway moving to AWS turns every ack margin into a latency budget. Two
tools cover it.

**1. Measure the real round trip** — from wherever the gateway runs:

```bash
make measure-rtt MQTT_TARGET=13.51.74.241
```

It publishes `cmd/cancel_nav` and times the ack. Safe: cancelling with
nothing running is a documented no-op, and the robot never moves.

**2. Gate the configured timeouts against that number:**

```bash
make test-latency RTT_MS=350
```

`tests/unit/test_timeout_margins.py` parses the bridge's own constants out of
`bridge_node.py` (the host cannot import it) and checks each margin. It is
**conservative, not predictive** — see below.

**3. Find the real break point** (needs only the broker, not the full stack —
the gateway runs in-process):

```bash
docker compose up -d mqtt-broker
.venv-test/bin/python -m pytest tests/system/test_aws_latency.py -k breaking_point -s
```

`tests/system/test_aws_latency.py` puts a delay proxy on the gateway↔broker
hop only — the real AWS topology, since the bridge stays beside the broker's
far end — and a fake bridge that answers `cmd/goal` after the full
`_GOAL_ACK_BUDGET_S`, which is exactly what the `/goal_pose` fallback does.
It runs under a test-only `ROBOT_ID`, so the real bridge never sees the goals.

### What the sweep measured

| Round trip | Result | Operator wait |
|---:|---|---:|
| 0 ms | 200 | 4.5 s |
| 500 ms | 200 | 5.2 s |
| 1000 ms | 200 | 6.0 s |
| 2000 ms | 200 | 7.5 s |
| 3500 ms | 200 | 10.5 s |
| 5000 ms | **504** | 13.5 s |
| 6000 ms | **504** | 15.0 s |

The break point (between 3.5 s and 5 s) is much higher than the nominal
`GOAL_ACK_TIMEOUT_S − _GOAL_ACK_BUDGET_S` = 1.5 s margin implies. The reason:
the gateway publishes at QoS1 and **awaits the broker's PUBACK before starting
its `asyncio.wait_for` clock**, so roughly a round trip is spent outside the
timeout window rather than inside it. That is why the unit gate is labelled
conservative — treat a failure there as "measure now", not "already broken".

### What this means for the AWS cutover

- **A 504 from ordinary LTE latency is unlikely.** The fallback path tolerates
  several seconds of round trip.
- **The operator's wait is the real cost.** At a 2 s round trip a dispatch
  takes ~7.5 s to answer, with no progress indication and the robot already
  driving.
- **A 504 on `/nav_goal` is not "the robot refused".** The bridge has already
  published to `/goal_pose` and the robot is moving; `/goal_pose` yields no
  goal handle, so Cancel answers "no active goal to cancel". Covered by
  `test_the_late_ack_proves_the_robot_accepted_what_the_operator_saw_fail`.
- **Teleop is the tighter constraint.** The bridge deadman is keyed off
  message *arrival*, so one-way latency above 500 ms makes `/cmd_vel` zero
  between frames — the robot stutters while the operator is still commanding.
  `test_teleop_survives_the_one_way_latency` is the gate.

---

## Known gaps

Things this suite does **not** cover, listed so nobody mistakes green for
complete:

- **No authentication anywhere.** `useAuth` is a static stub and the gateway
  has no auth on any endpoint — including the teleop socket. There is nothing
  to test yet; this is a deployment prerequisite, not a test gap. See the
  readiness notes in the PR/commit that added this suite.
- **React pages are untested.** `SimpleRoutePlannerPage` (1.2k lines),
  `RemoteControllerPage` (900) and `DashboardPage` (750) have no component
  tests — only the hooks and libs they build on. Canvas-heavy rendering is the
  reason; `parsePgmToDataUrl`'s success path is untestable in jsdom for the
  same reason (no 2D context).
- **The C++ layer is covered only by static contract tests.** No BT node is
  ticked in a test. `bt_runner`/`hive_bt_server` have no unit tests of their
  own; the end-to-end system tests are what exercise them.
- **WebRTC media is not tested** — only the SDP relay path. Whether video
  actually flows is verified by opening the Remote Controller.
- **`idb.ts` leaks connections.** Every `get`/`put` opens a new IndexedDB
  connection and never closes it, which is why the frontend tests swap the
  whole `IDBFactory` between cases instead of calling `deleteDatabase()`
  (a delete blocks forever behind the open handles). Worth fixing; not fixed
  here because nothing in the UI currently notices.
