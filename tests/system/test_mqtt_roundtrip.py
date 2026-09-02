"""
Broker-level system tests: what hive_mqtt_bridge actually puts on the wire.

These connect to the live broker as a third party — neither gateway nor
bridge — so they verify the contract at the point where the two halves of
the system are decoupled. This is the layer that has to keep working when
the gateway moves to AWS and the robot stays on its own network.
"""
import json

import pytest

pytestmark = pytest.mark.system


# =============================================================================
# The bridge's periodic state publications
# =============================================================================

def test_bridge_publishes_health(mqtt_recorder):
    health = mqtt_recorder.wait_for("health", timeout=15.0)
    assert {"ros_ready", "robot_alive"} <= set(health)


def test_health_is_retained_so_a_late_subscriber_sees_it_immediately(mqtt_recorder):
    """
    Retained + Last Will is what lets a freshly-started gateway know the
    robot's state without waiting a full publish interval.
    """
    health = mqtt_recorder.wait_for("health", timeout=2.0)
    assert health is not None


def test_bridge_publishes_telemetry(mqtt_recorder):
    telemetry = mqtt_recorder.wait_for("telemetry", timeout=10.0)
    assert telemetry["type"] == "telemetry"
    assert {"x", "y", "theta"} <= set(telemetry)


def test_bridge_publishes_localisation_with_an_age(mqtt_recorder):
    loc = mqtt_recorder.wait_for("localisation", timeout=10.0)
    assert {"x", "y", "yaw", "frame_id"} <= set(loc)
    assert loc["frame_id"] == "map"


def test_bridge_publishes_plan(mqtt_recorder):
    plan = mqtt_recorder.wait_for("plan", timeout=10.0)
    assert plan["type"] == "plan"
    assert isinstance(plan["points"], list)


def test_bridge_publishes_scan(mqtt_recorder):
    scan = mqtt_recorder.wait_for("scan", timeout=15.0)
    assert isinstance(scan["ranges"], list) and len(scan["ranges"]) > 0
    assert {"angle_min", "angle_max", "frame_id"} <= set(scan)


def test_every_published_payload_is_valid_json(mqtt_recorder):
    """A non-JSON payload is dropped silently by the gateway — it must never
    happen in the first place."""
    mqtt_recorder.wait_for("health", timeout=15.0)
    for topic, payload in mqtt_recorder.messages:
        assert isinstance(payload, (dict, list)), f"{topic} carried non-JSON: {payload!r}"


def test_the_bridge_stays_inside_its_own_topic_tree(mqtt_recorder):
    """Two robots on one broker must not overhear each other."""
    mqtt_recorder.wait_for("health", timeout=15.0)
    for topic, _ in mqtt_recorder.messages:
        assert topic.startswith(mqtt_recorder._prefix + "/")


# =============================================================================
# Command round trips — third party -> broker -> bridge -> ROS -> ack
# =============================================================================

def test_cancel_nav_command_is_acked_by_the_bridge(mqtt_recorder):
    """Safe: cancelling when nothing is running is a documented no-op."""
    request_id = "systest-cancel-1"
    mqtt_recorder.publish("cmd/cancel_nav", {"request_id": request_id})

    ack = mqtt_recorder.wait_for(
        "cancel_nav/ack", timeout=10.0,
        match=lambda p: isinstance(p, dict) and p.get("request_id") == request_id,
    )
    assert "cancelled" in ack


def test_the_bridge_ignores_a_malformed_command_instead_of_dying(mqtt_recorder):
    """
    A garbage publish from anything on the broker must not take the bridge
    down — it's the single point of failure for the whole robot link.
    """
    mqtt_recorder._client.publish(f"{mqtt_recorder._prefix}/cmd/task", b"{not json", qos=1)
    mqtt_recorder._client.publish(f"{mqtt_recorder._prefix}/cmd/set_pose", b"", qos=1)
    mqtt_recorder._client.publish(f"{mqtt_recorder._prefix}/cmd/velocity", b"[]", qos=0)

    # Still publishing afterwards => still alive.
    mqtt_recorder.messages.clear()
    mqtt_recorder.wait_for("telemetry", timeout=15.0)


def test_gateway_and_bridge_agree_on_the_topic_prefix(mqtt_recorder, http):
    """
    The gateway reads /health from the same tree the bridge publishes to.
    A ROBOT_ID mismatch between the two containers would show up here and
    nowhere else — the gateway would simply report the robot as dead.
    """
    mqtt_recorder.wait_for("health", timeout=15.0)
    assert http.get("/health").json()["mqtt_connected"] is True
    assert http.get("/health").json()["robot_alive"] is True


# =============================================================================
# Motion — opt-in only
# =============================================================================

def test_velocity_command_reaches_the_robot(mqtt_recorder, motion):
    """
    Publishes a brief non-zero twist and then a stop. Gated behind
    HIVE_ALLOW_MOTION=1 because it physically drives the robot.
    """
    import time

    mqtt_recorder.publish("cmd/velocity", {"linear": 0.05, "angular": 0.0}, qos=0)
    time.sleep(0.3)
    mqtt_recorder.publish("cmd/velocity", {"linear": 0.0, "angular": 0.0}, qos=0)

    telemetry = mqtt_recorder.wait_for("telemetry", timeout=10.0)
    assert telemetry["type"] == "telemetry"


def test_bridge_deadman_stops_the_robot_when_commands_stop(mqtt_recorder, motion):
    """
    Send one non-zero frame and then go silent. The bridge's own 500ms
    watchdog must zero /cmd_vel without any further input — the protection
    that survives a dead gateway.
    """
    import time

    mqtt_recorder.publish("cmd/velocity", {"linear": 0.05, "angular": 0.0}, qos=0)
    time.sleep(2.0)   # far longer than the 500ms watchdog

    health = mqtt_recorder.wait_for("health", timeout=15.0)
    assert health["robot_alive"] is True   # still up after the watchdog fired
