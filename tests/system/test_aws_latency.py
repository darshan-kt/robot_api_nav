"""
AWS-split latency tests: does POST /nav_goal still work when the
gateway<->broker hop crosses the internet?

The topology under test mirrors the real deployment:

    real gateway (in-process)  --[ LatencyProxy: +delay ]-->  broker
    fake bridge (test-owned)   --------- direct ---------->   broker

Only the gateway's link is delayed, because only that hop moves to AWS —
the bridge sits on the robot beside the broker's far end.

The fake bridge deliberately answers cmd/goal after exactly the bridge's own
_GOAL_ACK_BUDGET_S, which is what the /goal_pose fallback does: it burns the
entire budget before acking. That is the slowest legitimate response the
gateway can receive, so it is the path with the least latency headroom, and
the only one where a 504 means "the robot is driving and Cancel won't work".

Everything runs under a TEST-ONLY ROBOT_ID, so the real bridge never sees
these goals and the robot never moves.

MEASURED (HiveMQ CE, loopback + injected delay, fallback ack at 4.5s):

    round trip     0 ms -> 200 after  4.5 s
    round trip   500 ms -> 200 after  5.2 s
    round trip  1000 ms -> 200 after  6.0 s
    round trip  2000 ms -> 200 after  7.5 s
    round trip  3500 ms -> 200 after 10.5 s
    round trip  5000 ms -> 504 after 13.5 s
    round trip  6000 ms -> 504 after 15.0 s

The break point (between 3.5 s and 5 s round trip) is far higher than the nominal
GOAL_ACK_TIMEOUT_S - _GOAL_ACK_BUDGET_S = 1.5 s margin suggests, and the
reason is worth knowing: the gateway publishes cmd/goal at QoS1 and AWAITS
the broker's PUBACK before starting its asyncio.wait_for clock. That wait
absorbs roughly a round trip, so latency is paid partly outside the timeout
window rather than entirely inside it.

The practical consequence over AWS is therefore NOT an early 504 — it is the
wall clock. At a 2 s round trip the operator waits 7.5 s for a dispatch
response, and at 3.5 s waits over 10 s, with the robot already driving the
whole time. See test_the_operator_wait_grows_with_latency.
"""
import json
import os
import threading
import time

import pytest
from fastapi.testclient import TestClient

from app import config
from app import main as gateway_main
from app.mqtt_client import GatewayMqttClient

# Plain absolute imports: pytest's default "prepend" import mode puts this
# directory on sys.path, and there is no __init__.py here to make it a
# package. Broker coordinates are read the same way conftest.py reads them
# rather than imported from it — importing a conftest gives you a second,
# separate module object.
from latency_proxy import LatencyProxy

BROKER_HOST = os.environ.get("HIVE_TEST_MQTT_HOST", "localhost")
BROKER_PORT = int(os.environ.get("HIVE_TEST_MQTT_PORT", "1883"))

pytestmark = [pytest.mark.system, pytest.mark.broker_only]

# Never "hive/robot-1" — that tree belongs to the real bridge.
TEST_ROBOT_ID = f"latency-test-{os.getpid()}"
TEST_PREFIX = f"hive/{TEST_ROBOT_ID}"

# What the bridge burns before publishing the fallback ack. Kept in sync with
# bridge_node._GOAL_ACK_BUDGET_S by test_timeout_margins.py, which parses the
# real constant out of the source.
FALLBACK_ACK_DELAY_S = 4.5


class FakeBridge:
    """
    Stands in for hive_mqtt_bridge on the robot's own network: connects
    straight to the broker and answers cmd/goal after `ack_delay_s`,
    reporting the /goal_pose fallback shape.
    """

    def __init__(self, ack_delay_s: float = FALLBACK_ACK_DELAY_S):
        import paho.mqtt.client as mqtt

        self.ack_delay_s = ack_delay_s
        self.received: list[dict] = []
        try:
            self._c = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                client_id=f"fake-bridge-{os.getpid()}")
        except (AttributeError, TypeError):
            self._c = mqtt.Client(client_id=f"fake-bridge-{os.getpid()}")

        self._c.on_message = self._on_message
        self._c.connect(BROKER_HOST, BROKER_PORT, keepalive=30)
        self._c.subscribe(f"{TEST_PREFIX}/cmd/goal", qos=1)
        self._c.loop_start()

    def _on_message(self, client, userdata, msg):
        payload = json.loads(msg.payload)
        self.received.append(payload)
        threading.Thread(target=self._ack, args=(payload,), daemon=True).start()

    def _ack(self, payload: dict):
        time.sleep(self.ack_delay_s)
        self._c.publish(
            f"{TEST_PREFIX}/goal/ack",
            json.dumps({
                "goal_id": payload.get("goal_id"),
                "accepted": True,
                "waypoint_count": len(payload.get("poses", [])),
                "nav_mode": "goal_pose_fallback",
                "cancellable": False,
                "detail": "Nav2 answered no goal request within 4.5s",
            }),
            qos=1,
        )

    def close(self):
        self._c.loop_stop()
        self._c.disconnect()


def _dispatch_through_latency(one_way_s: float, ack_delay_s: float = FALLBACK_ACK_DELAY_S,
                              monkeypatch=None):
    """
    Run one POST /nav_goal against a gateway whose broker link has
    `one_way_s` added in each direction. Returns (status_code, body, elapsed).
    """
    bridge = FakeBridge(ack_delay_s=ack_delay_s)
    proxy = LatencyProxy(BROKER_HOST, BROKER_PORT, one_way_s).start()
    try:
        monkeypatch.setattr(config, "MQTT_HOST", "127.0.0.1")
        monkeypatch.setattr(config, "MQTT_PORT", proxy.port)
        monkeypatch.setattr(config, "ROBOT_ID", TEST_ROBOT_ID)
        monkeypatch.setattr(config, "TOPIC_PREFIX", TEST_PREFIX)
        monkeypatch.setattr(gateway_main, "mqtt_client", GatewayMqttClient())

        with TestClient(gateway_main.api_app) as client:
            # Wait for the (now slow) broker handshake before timing anything.
            # CONNECT/CONNACK plus SUBSCRIBE/SUBACK is two round trips, and
            # each is paid at the injected latency — so the allowance has to
            # scale with it, not be a fixed 20s.
            deadline = time.monotonic() + 20 + 12 * one_way_s
            while not gateway_main.mqtt_client.connected and time.monotonic() < deadline:
                time.sleep(0.05)
            assert gateway_main.mqtt_client.connected, "gateway never reached the broker"

            started = time.monotonic()
            r = client.post("/nav_goal", json={"poses": [{
                "header": {"frame_id": "map"},
                "pose": {"position": {"x": 1.0, "y": 1.0, "z": 0.0},
                         "orientation": {"x": 0, "y": 0, "z": 0, "w": 1}},
            }]})
            elapsed = time.monotonic() - started

        return r.status_code, (r.json() if r.content else {}), elapsed
    finally:
        proxy.stop()
        bridge.close()


# =============================================================================
# Baseline — the LAN case you have tested locally
# =============================================================================

def test_fallback_dispatch_succeeds_with_no_added_latency(monkeypatch):
    """
    Same-network baseline: the fallback ack arrives 4.5s in, comfortably
    inside the gateway's 6s timeout. This is what passes locally today.
    """
    status, body, elapsed = _dispatch_through_latency(0.0, monkeypatch=monkeypatch)

    assert status == 200, f"baseline dispatch failed: {body}"
    assert body["nav_mode"] == "goal_pose_fallback"
    assert body["cancellable"] is False
    assert elapsed < config.GOAL_ACK_TIMEOUT_S


def test_fallback_dispatch_survives_a_realistic_cellular_round_trip(monkeypatch):
    """
    150 ms each way = 300 ms round trip, a normal good-signal LTE figure.
    Still inside the 1.5s margin.
    """
    status, body, _ = _dispatch_through_latency(0.15, monkeypatch=monkeypatch)
    assert status == 200, f"dispatch failed at 300ms RTT: {body}"
    assert body["nav_mode"] == "goal_pose_fallback"


# =============================================================================
# The failure this exists to demonstrate
# =============================================================================

def test_fallback_dispatch_times_out_past_the_measured_break_point(monkeypatch):
    """
    2.5 s each way = 5 s round trip — the lowest value the sweep measured
    as failing (3.5 s still succeeds). This is the regime of a badly congested or satellite link,
    not ordinary LTE.

    When it trips, the operator sees 504 while the bridge has ALREADY
    published to /goal_pose — the robot is driving, and because /goal_pose
    yields no goal handle, cmd/cancel_nav answers "no active goal to cancel".
    Failed in the UI, moving in reality, Cancel inoperative.

    If this starts passing with a 200, the timeouts were widened — record
    that in test_timeout_margins.py and re-run the sweep for a new number.
    """
    status, body, elapsed = _dispatch_through_latency(2.5, monkeypatch=monkeypatch)

    assert status == 504, (
        f"expected a timeout at 5s round trip, got {status}: {body}")
    assert elapsed > config.GOAL_ACK_TIMEOUT_S


def test_the_operator_wait_grows_with_latency(monkeypatch):
    """
    The effect that actually bites over AWS, well before any 504.

    A dispatch that answers in 4.5 s locally takes ~7.5 s at a 2 s round
    trip. The UI has no progress indication for that window and the robot is
    already moving throughout it, so the operator is looking at an
    unresponsive button while the vehicle drives.
    """
    _, _, baseline = _dispatch_through_latency(0.0, monkeypatch=monkeypatch)
    status, _, delayed = _dispatch_through_latency(1.0, monkeypatch=monkeypatch)

    assert status == 200, "2s round trip should still dispatch successfully"
    assert delayed > baseline + 1.0, (
        "latency is expected to lengthen the operator's wait — if it no "
        "longer does, the measurement is wrong, not the system")
    assert delayed < 10.0, f"operator waited {delayed:.1f}s for a dispatch response"


def test_the_late_ack_proves_the_robot_accepted_what_the_operator_saw_fail(monkeypatch):
    """
    Nails the dangerous half: the 504 is NOT the robot refusing. The bridge
    accepted, and its ack is simply in flight when the gateway gives up.
    Verified by watching the broker directly.

    This is what makes the fallback path worth special handling: on any
    other endpoint a 504 just means "retry". Here it means "the robot may
    already be driving, and Cancel will not stop it".
    """
    import paho.mqtt.client as mqtt

    acks: list[dict] = []
    try:
        watcher = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                              client_id=f"ack-watch-{os.getpid()}")
    except (AttributeError, TypeError):
        watcher = mqtt.Client(client_id=f"ack-watch-{os.getpid()}")

    watcher.on_message = lambda c, u, m: acks.append(json.loads(m.payload))
    watcher.connect(BROKER_HOST, BROKER_PORT, keepalive=30)
    watcher.subscribe(f"{TEST_PREFIX}/goal/ack", qos=1)
    watcher.loop_start()
    try:
        status, _, _ = _dispatch_through_latency(2.5, monkeypatch=monkeypatch)
        assert status == 504

        deadline = time.monotonic() + 10
        while not acks and time.monotonic() < deadline:
            time.sleep(0.05)

        assert acks, "no goal/ack ever reached the broker"
        assert acks[0]["accepted"] is True, \
            "the robot ACCEPTED the goal the operator was told had failed"
    finally:
        watcher.loop_stop()
        watcher.disconnect()


# =============================================================================
# Where exactly it breaks
# =============================================================================

@pytest.mark.slow
def test_report_the_breaking_point_round_trip(monkeypatch):
    """
    Sweeps latency and prints the last round trip that still works. Run with
    -s to read it:

        .venv-test/bin/python -m pytest tests/system/test_aws_latency.py \\
            -k breaking_point -s

    Use the number as HIVE_RTT_P99_MS's ceiling: if your measured p99 is
    anywhere near it, widen GOAL_ACK_TIMEOUT_S before the AWS cutover.
    """
    results = []
    # Stops at a 6s round trip: 4s already 504s, and past ~6s the MQTT
    # handshake itself dominates the run time without adding information.
    for one_way in (0.0, 0.25, 0.5, 1.0, 1.75, 2.5, 3.0):
        status, _, elapsed = _dispatch_through_latency(one_way, monkeypatch=monkeypatch)
        results.append((one_way * 2, status, elapsed))
        print(f"  round trip {one_way * 2 * 1000:>5.0f} ms -> HTTP {status} "
              f"after {elapsed:.2f}s")

    ok = [rtt for rtt, status, _ in results if status == 200]
    failed = [rtt for rtt, status, _ in results if status == 504]

    print(f"\n  highest round trip that still dispatches: {max(ok) * 1000:.0f} ms")
    if failed:
        print(f"  lowest round trip that 504s:              {min(failed) * 1000:.0f} ms")
    print(f"  margin per test_timeout_margins.py:       "
          f"{(config.GOAL_ACK_TIMEOUT_S - FALLBACK_ACK_DELAY_S) * 1000:.0f} ms\n")

    assert ok, "the fallback path failed even at zero latency"
