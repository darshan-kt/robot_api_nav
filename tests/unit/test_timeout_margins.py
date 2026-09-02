"""
Timeout-margin invariants for the AWS split.

Today the gateway and the robot share a LAN, so every ack crosses the broker
in well under a millisecond and none of these margins matter. Once the
gateway moves to AWS and the robot is on cellular, each margin becomes a
budget that real latency spends.

Each test states the invariant as
    margin > round_trip x SAFETY_FACTOR
and reads the measured round trip from the environment:

    HIVE_RTT_P99_MS=350 .venv-test/bin/python -m pytest tests/unit/test_timeout_margins.py -q

RTT here means ONE FULL ROUND TRIP — gateway -> broker -> bridge, then
bridge -> broker -> gateway — which is what tests/system/test_aws_latency.py
measures and what `make measure-rtt` prints. Default is 0, so these pass
trivially on a LAN; the value only bites when you supply a real one.

The bridge-side constants are parsed out of bridge_node.py rather than
hardcoded here: the host cannot import that module (it needs rclpy +
hive_interfaces, which only exist in the robotstore container), and copying
the numbers would let the two drift apart silently.

THIS GATE IS DELIBERATELY CONSERVATIVE, NOT PREDICTIVE.

It compares nominal margins against measured latency, which ignores that the
gateway publishes at QoS1 and awaits the broker's PUBACK before starting its
timeout clock — that wait absorbs roughly a round trip, so the real failure
threshold is higher than the arithmetic here suggests. Measured for
/nav_goal: nominal margin 1.5 s, actual break point 3.5-5 s round trip
(tests/system/test_aws_latency.py).

So a failure here means "you are approaching the edge and should measure",
not "this is already broken". The system sweep is the ground truth; this is
the cheap gate you can run in CI without a broker.
"""
import os
import re

import pytest

from app import config

pytestmark = pytest.mark.unit


# Headroom multiplier. 1.0 would mean "breaks the instant latency exceeds the
# margin"; 2.0 leaves room for the jitter that makes a p99 a p99.
SAFETY_FACTOR = 2.0

RTT_S = float(os.environ.get("HIVE_RTT_P99_MS", "0")) / 1000.0


@pytest.fixture(scope="module")
def bridge_constants(repo_root) -> dict[str, float]:
    """Pull the bridge's timing constants straight out of its source."""
    src = (repo_root / "backend" / "hive_mqtt_bridge" /
           "hive_mqtt_bridge" / "bridge_node.py").read_text()

    wanted = ["_GOAL_ACK_BUDGET_S", "_NAV_SERVER_WAIT_S",
              "_CMD_VEL_WATCHDOG_S", "_CAMERA_OFFER_TIMEOUT_S"]
    found = {}
    for name in wanted:
        m = re.search(rf'^{name}\s*=\s*([\d.]+)', src, re.M)
        assert m, f"{name} not found in bridge_node.py — was it renamed?"
        found[name] = float(m.group(1))

    m = re.search(r'keepalive\s*=\s*(\d+)', src)
    assert m, "MQTT keepalive not found in bridge_node.py"
    found["keepalive"] = float(m.group(1))

    # The bridge's Hive wait_for_server budget, used by cmd/task.
    m = re.search(r'wait_for_server\(\s*timeout_sec=([\d.]+)', src)
    assert m, "wait_for_server timeout not found in bridge_node.py"
    found["hive_server_wait_s"] = float(m.group(1))

    return found


def _assert_margin(name: str, margin_s: float):
    """Shared assertion so every failure reads the same way."""
    required = RTT_S * SAFETY_FACTOR
    assert margin_s > required, (
        f"{name}: only {margin_s * 1000:.0f} ms of nominal headroom against a "
        f"{RTT_S * 1000:.0f} ms round trip (needs {required * 1000:.0f} ms at "
        f"x{SAFETY_FACTOR} safety).\n"
        f"This is the conservative gate — confirm against the real break "
        f"point before changing any constant:\n"
        f"  .venv-test/bin/python -m pytest tests/system/test_aws_latency.py "
        f"-k breaking_point -s"
    )


# =============================================================================
# /nav_goal — the tightest and most dangerous margin
# =============================================================================

def test_nav_goal_margin_absorbs_the_round_trip(bridge_constants):
    """
    THE one that matters for the /goal_pose fallback.

    The bridge only publishes the fallback ack after burning its ENTIRE
    _GOAL_ACK_BUDGET_S — that is what the fallback is. So on that path the
    gateway's whole remaining margin is available to latency, and nothing
    else.

    When it is exceeded the operator gets a 504 while the bridge has already
    published to /goal_pose — the robot IS driving, and because /goal_pose
    yields no goal handle, cmd/cancel_nav answers "nothing to cancel". Failed
    in the UI, moving in reality, Cancel inoperative.
    """
    margin = config.GOAL_ACK_TIMEOUT_S - bridge_constants["_GOAL_ACK_BUDGET_S"]
    _assert_margin("/nav_goal (fallback path)", margin)


def test_nav_goal_budget_is_below_the_gateway_timeout_at_all(bridge_constants):
    """Latency aside: if the bridge's budget ever exceeds the gateway's
    timeout, the fallback ack can NEVER arrive in time, on any network."""
    assert bridge_constants["_GOAL_ACK_BUDGET_S"] < config.GOAL_ACK_TIMEOUT_S


def test_nav_server_wait_fits_inside_the_goal_budget(bridge_constants):
    """Server discovery is spent from the same 4.5s budget as the handshake."""
    assert bridge_constants["_NAV_SERVER_WAIT_S"] < bridge_constants["_GOAL_ACK_BUDGET_S"]


# =============================================================================
# /tasks, /cancel_nav, /webrtc/offer
# =============================================================================

def test_task_margin_absorbs_the_round_trip(bridge_constants):
    """The healthiest of the four — 8s against a 3s bridge-side wait."""
    margin = config.TASK_ACK_TIMEOUT_S - bridge_constants["hive_server_wait_s"]
    _assert_margin("/tasks", margin)


def test_cancel_margin_absorbs_the_round_trip():
    """
    Cancellation involves no bridge-side waiting, so the whole timeout is
    margin. It is also the command that must NEVER be reported as failed
    when it actually worked — the operator's abort path.
    """
    _assert_margin("/cancel_nav", config.CANCEL_ACK_TIMEOUT_S)


def test_webrtc_margin_absorbs_the_round_trip(bridge_constants):
    """
    Second-tightest after /nav_goal: the bridge waits up to
    _CAMERA_OFFER_TIMEOUT_S on the local camera bridge before answering,
    leaving only the difference for the MQTT hop.
    """
    margin = config.CAMERA_OFFER_TIMEOUT_S - bridge_constants["_CAMERA_OFFER_TIMEOUT_S"]
    _assert_margin("/webrtc/offer", margin)


# =============================================================================
# Teleop — a latency constraint, not a timeout margin
# =============================================================================

def test_teleop_survives_the_one_way_latency(bridge_constants):
    """
    Different failure shape: the bridge's deadman is keyed off MQTT message
    ARRIVAL, so it is one-way latency (plus jitter) that matters, not the
    round trip. If frames published at 10Hz arrive more than
    _CMD_VEL_WATCHDOG_S apart, the bridge zeroes /cmd_vel between them and
    the robot stutters — or stops dead — while the operator is still holding
    the stick.

    This is the constraint most likely to make teleop-over-AWS unusable, and
    it is invisible on a LAN.
    """
    one_way = RTT_S / 2.0
    watchdog = bridge_constants["_CMD_VEL_WATCHDOG_S"]
    assert one_way < watchdog, (
        f"one-way latency {one_way * 1000:.0f} ms exceeds the bridge's "
        f"{watchdog * 1000:.0f} ms /cmd_vel deadman — teleop will stutter or "
        f"stop while the operator is still commanding motion"
    )


def test_the_gateway_deadman_fires_before_the_bridge_deadman(bridge_constants):
    """
    Layering intent: the gateway (400ms, WebSocket-side) should normally be
    the one that stops the robot, with the bridge (500ms, MQTT-side) as the
    backstop for a dead gateway. Inverting them would make the bridge fire
    first on every ordinary release.
    """
    gateway_deadman = 0.4   # main.py's velocity_ctrl_ws receive timeout
    assert gateway_deadman < bridge_constants["_CMD_VEL_WATCHDOG_S"]


# =============================================================================
# Liveness reporting
# =============================================================================

def test_robot_death_is_detected_within_a_stated_bound(bridge_constants):
    """
    robot_alive goes false via the broker's Last Will, which only fires after
    the keepalive lapses. The gateway applies no staleness timeout of its own
    on latest_health — it trusts the LWT — so this keepalive IS the detection
    latency for "robot uplink died".

    On a LAN a drop is near-instant. Over cellular the dashboard can show a
    healthy robot for the full keepalive window (1.5x per MQTT spec) after
    the robot is gone. Stated here so the number is a decision, not an
    accident.
    """
    keepalive = bridge_constants["keepalive"]
    worst_case_detection_s = keepalive * 1.5
    assert worst_case_detection_s <= 60, (
        f"a dead robot would still read as alive for up to "
        f"{worst_case_detection_s:.0f}s"
    )


def test_the_measured_rtt_is_reported(bridge_constants):
    """Not an assertion so much as a record: running the suite with a real
    HIVE_RTT_P99_MS prints the full margin table into the test log."""
    rows = [
        ("/nav_goal (fallback)", config.GOAL_ACK_TIMEOUT_S - bridge_constants["_GOAL_ACK_BUDGET_S"]),
        ("/webrtc/offer", config.CAMERA_OFFER_TIMEOUT_S - bridge_constants["_CAMERA_OFFER_TIMEOUT_S"]),
        ("/tasks", config.TASK_ACK_TIMEOUT_S - bridge_constants["hive_server_wait_s"]),
        ("/cancel_nav", config.CANCEL_ACK_TIMEOUT_S),
    ]
    print(f"\n  measured round trip: {RTT_S * 1000:.0f} ms "
          f"(safety factor x{SAFETY_FACTOR})")
    for name, margin in sorted(rows, key=lambda r: r[1]):
        verdict = "OK" if margin > RTT_S * SAFETY_FACTOR else "TOO TIGHT"
        print(f"  {name:<24} margin {margin * 1000:>6.0f} ms   {verdict}")
    assert True
