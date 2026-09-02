"""
Unit tests for app/mqtt_client.py — GatewayMqttClient.

This class is the gateway's entire link to the robot: every command out and
every piece of state in. The tests drive it with a fake aiomqtt client so
they cover the parts that only show up when things go wrong — broker down,
ack never arrives, ack arrives for a different id, malformed payload —
without needing a broker.
"""
import asyncio
import json

import pytest

from app import config
from app.mqtt_client import AckTimeout, GatewayMqttClient, MqttUnavailable

pytestmark = pytest.mark.unit


class FakeMqtt:
    """Stand-in for aiomqtt.Client — records publishes, never touches a socket."""

    def __init__(self):
        self.published: list[tuple[str, dict, int]] = []

    async def publish(self, topic, payload, qos=0, **kwargs):
        self.published.append((topic, json.loads(payload), qos))

    def last(self):
        return self.published[-1]


@pytest.fixture
def client():
    """A GatewayMqttClient wired to a fake broker and marked connected."""
    c = GatewayMqttClient()
    c._client = FakeMqtt()
    c._connected.set()
    return c


@pytest.fixture
def offline_client():
    """Same object, but with the broker link down."""
    return GatewayMqttClient()


def topic(suffix):
    return f"{config.TOPIC_PREFIX}/{suffix}"


# =============================================================================
# Inbound message routing — bridge -> broker -> gateway cache
# =============================================================================

@pytest.mark.parametrize("suffix,attr", [
    ("telemetry",    "latest_telemetry"),
    ("localisation", "latest_localisation"),
    ("plan",         "latest_plan"),
    ("scan",         "latest_scan"),
    ("health",       "latest_health"),
])
def test_state_topics_populate_their_cache(client, suffix, attr):
    payload = {"type": suffix, "value": 42}
    client._on_message(topic(suffix), json.dumps(payload).encode())
    assert getattr(client, attr) == payload


def test_latest_value_wins(client):
    client._on_message(topic("telemetry"), b'{"x": 1}')
    client._on_message(topic("telemetry"), b'{"x": 2}')
    assert client.latest_telemetry == {"x": 2}


def test_caches_start_empty(offline_client):
    c = offline_client
    assert (c.latest_telemetry, c.latest_localisation, c.latest_plan,
            c.latest_scan, c.latest_health) == (None, None, None, None, None)


def test_non_json_payload_is_dropped_not_raised(client):
    client._on_message(topic("telemetry"), b"not json at all")
    assert client.latest_telemetry is None


def test_topic_outside_our_prefix_is_ignored(client):
    """Another robot on the same broker must not poison this gateway's cache."""
    client._on_message("hive/robot-99/telemetry", b'{"x": 1}')
    client._on_message("some/other/system", b'{"x": 1}')
    assert client.latest_telemetry is None


def test_unknown_suffix_under_our_prefix_is_ignored(client):
    client._on_message(topic("something/new"), b'{"x": 1}')   # must not raise
    assert client.latest_telemetry is None


# =============================================================================
# Ack routing — the four keyed request/response channels
# =============================================================================

@pytest.mark.parametrize("suffix,pending_attr,key_field", [
    ("task/ack",       "_pending_task_acks",   "task_id"),
    ("goal/ack",       "_pending_goal_acks",   "goal_id"),
    ("cancel_nav/ack", "_pending_cancel_acks", "request_id"),
    ("webrtc/answer",  "_pending_webrtc_acks", "offer_id"),
])
async def test_ack_resolves_the_waiting_future(client, suffix, pending_attr, key_field):
    fut = asyncio.get_running_loop().create_future()
    getattr(client, pending_attr)["abc"] = fut

    client._on_message(topic(suffix), json.dumps({key_field: "abc", "ok": True}).encode())

    assert (await asyncio.wait_for(fut, 0.1))["ok"] is True
    assert "abc" not in getattr(client, pending_attr)


async def test_ack_for_a_different_id_leaves_the_future_pending(client):
    """A late ack from a previous, abandoned request must not resolve this one."""
    fut = asyncio.get_running_loop().create_future()
    client._pending_task_acks["current"] = fut

    client._on_message(topic("task/ack"), b'{"task_id": "stale", "accepted": true}')

    assert not fut.done()
    assert "current" in client._pending_task_acks


async def test_duplicate_ack_does_not_raise(client):
    """QoS1 permits redelivery — a second identical ack must be harmless."""
    fut = asyncio.get_running_loop().create_future()
    client._pending_task_acks["t1"] = fut
    msg = b'{"task_id": "t1", "accepted": true}'

    client._on_message(topic("task/ack"), msg)
    client._on_message(topic("task/ack"), msg)   # must not raise InvalidStateError

    assert (await fut)["accepted"] is True


async def test_pending_ack_maps_are_independent(client):
    """A task_id and a goal_id that collide must never cross-resolve."""
    task_fut = asyncio.get_running_loop().create_future()
    goal_fut = asyncio.get_running_loop().create_future()
    client._pending_task_acks["same-id"] = task_fut
    client._pending_goal_acks["same-id"] = goal_fut

    client._on_message(topic("goal/ack"), b'{"goal_id": "same-id", "accepted": true}')

    assert goal_fut.done() and not task_fut.done()


def test_result_topics_are_logged_not_cached(client):
    """task/result and goal/result are informational — they resolve nothing."""
    client._on_message(topic("task/result"), b'{"task_id": "t", "success": true}')
    client._on_message(topic("goal/result"), b'{"goal_id": "g", "status": 4}')
    assert client.latest_telemetry is None


# =============================================================================
# publish_task
# =============================================================================

async def test_publish_task_sends_on_cmd_task_at_qos1_and_returns_the_ack(client):
    payload = {"task_id": "t-1", "id": 22, "behavior_name": "FollowRoute", "poses": []}

    task = asyncio.create_task(client.publish_task(payload, timeout=1.0))
    await asyncio.sleep(0)   # let the publish land

    sent_topic, sent_payload, qos = client._client.last()
    assert sent_topic == topic("cmd/task")
    assert sent_payload == payload
    assert qos == 1

    client._on_message(topic("task/ack"), b'{"task_id": "t-1", "accepted": true, "behavior": "FollowRoute"}')
    assert (await task)["behavior"] == "FollowRoute"


async def test_publish_task_times_out_into_ack_timeout(client):
    with pytest.raises(AckTimeout):
        await client.publish_task({"task_id": "t-1"}, timeout=0.05)


async def test_timed_out_request_is_removed_from_the_pending_map(client):
    """Otherwise every timed-out mission leaks a Future for the process's life."""
    with pytest.raises(AckTimeout):
        await client.publish_task({"task_id": "leaky"}, timeout=0.05)
    assert client._pending_task_acks == {}


async def test_publish_task_raises_mqtt_unavailable_when_broker_is_down(offline_client):
    with pytest.raises(MqttUnavailable):
        await offline_client.publish_task({"task_id": "t-1"}, timeout=1.0)


async def test_rejection_ack_is_returned_not_raised(client):
    """The ack shape carries accept/reject — routing that decision is main.py's job."""
    task = asyncio.create_task(client.publish_task({"task_id": "t-1"}, timeout=1.0))
    await asyncio.sleep(0)
    client._on_message(topic("task/ack"), b'{"task_id": "t-1", "accepted": false, "detail": "no server"}')

    ack = await task
    assert ack["accepted"] is False and ack["detail"] == "no server"


# =============================================================================
# publish_goal / publish_cancel_nav
# =============================================================================

async def test_publish_goal_generates_a_goal_id_and_echoes_it_back(client):
    poses = [{"header": {"frame_id": "map"}, "pose": {"position": {"x": 1.0, "y": 2.0}}}]

    task = asyncio.create_task(client.publish_goal(poses, timeout=1.0))
    await asyncio.sleep(0)

    sent_topic, sent_payload, qos = client._client.last()
    assert sent_topic == topic("cmd/goal") and qos == 1
    assert sent_payload["poses"] == poses
    goal_id = sent_payload["goal_id"]

    client._on_message(topic("goal/ack"), json.dumps({"goal_id": goal_id, "accepted": True}).encode())
    result = await task
    assert result["goal_id"] == goal_id and result["accepted"] is True


async def test_each_goal_gets_a_unique_id(client):
    ids = set()
    for _ in range(3):
        task = asyncio.create_task(client.publish_goal([], timeout=0.05))
        await asyncio.sleep(0)
        ids.add(client._client.last()[1]["goal_id"])
        with pytest.raises(AckTimeout):
            await task
    assert len(ids) == 3


async def test_publish_cancel_nav_reports_nothing_was_running_as_a_normal_result(client):
    task = asyncio.create_task(client.publish_cancel_nav(timeout=1.0))
    await asyncio.sleep(0)
    request_id = client._client.last()[1]["request_id"]

    client._on_message(
        topic("cancel_nav/ack"),
        json.dumps({"request_id": request_id, "cancelled": False, "detail": "no active goal"}).encode(),
    )
    ack = await task
    assert ack["cancelled"] is False        # not an error


async def test_cancel_nav_raises_when_broker_is_down(offline_client):
    with pytest.raises(MqttUnavailable):
        await offline_client.publish_cancel_nav(timeout=1.0)


# =============================================================================
# publish_velocity — the teleop hot path
# =============================================================================

async def test_publish_velocity_uses_qos0_and_the_expected_payload(client):
    await client.publish_velocity(0.3, -0.5)
    sent_topic, payload, qos = client._client.last()
    assert sent_topic == topic("cmd/velocity")
    assert payload == {"linear": 0.3, "angular": -0.5}
    assert qos == 0, "teleop must be fire-and-forget; QoS1 would queue stale commands"


async def test_publish_velocity_is_silent_when_the_broker_is_down(offline_client):
    """
    Deliberate: the bridge's own 500ms watchdog zeroes /cmd_vel when MQTT
    stops arriving, so raising here would only spam the teleop WebSocket.
    """
    await offline_client.publish_velocity(0.3, 0.0)   # must not raise


async def test_publish_velocity_does_not_wait_for_an_ack(client):
    """It must return immediately — a 10Hz stream cannot block on round trips."""
    await asyncio.wait_for(client.publish_velocity(0.1, 0.1), timeout=0.05)
    assert client._pending_task_acks == {}


# =============================================================================
# publish_set_pose
# =============================================================================

async def test_set_pose_omits_covariance_when_not_supplied(client):
    await client.publish_set_pose({"pose": {"position": {"x": 0.0}}})
    sent_topic, payload, qos = client._client.last()
    assert sent_topic == topic("cmd/set_pose") and qos == 1
    assert "covariance" not in payload


async def test_set_pose_forwards_covariance_when_supplied(client):
    cov = [0.0] * 36
    await client.publish_set_pose({"pose": {}}, cov)
    assert client._client.last()[1]["covariance"] == cov


async def test_set_pose_raises_when_broker_is_down(offline_client):
    """Unlike velocity, a lost initial pose has no watchdog to recover it."""
    with pytest.raises(MqttUnavailable):
        await offline_client.publish_set_pose({"pose": {}})


# =============================================================================
# publish_webrtc_offer
# =============================================================================

async def test_webrtc_offer_returns_the_answer(client):
    task = asyncio.create_task(client.publish_webrtc_offer("v=0...", "offer", timeout=1.0))
    await asyncio.sleep(0)
    sent_topic, payload, _ = client._client.last()
    assert sent_topic == topic("cmd/webrtc_offer")
    assert payload["sdp"] == "v=0..." and payload["type"] == "offer"

    client._on_message(
        topic("webrtc/answer"),
        json.dumps({"offer_id": payload["offer_id"], "sdp": "v=0-answer", "type": "answer"}).encode(),
    )
    assert (await task)["sdp"] == "v=0-answer"


async def test_webrtc_error_ack_raises_value_error(client):
    """
    The bridge answers, but reports the camera bridge itself is unreachable.
    That is NOT a timeout — main.py maps this ValueError to 503, and the
    distinction is what tells an operator "camera down" vs "robot down".
    """
    task = asyncio.create_task(client.publish_webrtc_offer("v=0...", "offer", timeout=1.0))
    await asyncio.sleep(0)
    offer_id = client._client.last()[1]["offer_id"]

    client._on_message(
        topic("webrtc/answer"),
        json.dumps({"offer_id": offer_id, "error": "camera bridge unreachable"}).encode(),
    )
    with pytest.raises(ValueError, match="camera bridge unreachable"):
        await task


# =============================================================================
# Connection state
# =============================================================================

def test_connected_reflects_the_internal_event(client, offline_client):
    assert client.connected is True
    assert offline_client.connected is False


async def test_stop_is_safe_when_never_started(offline_client):
    await offline_client.stop()   # must not raise


async def test_stop_cancels_the_listener_task(offline_client):
    async def forever():
        await asyncio.Event().wait()

    offline_client._listen_task = asyncio.create_task(forever())
    await offline_client.stop()
    assert offline_client._listen_task.cancelled() or offline_client._listen_task.done()
