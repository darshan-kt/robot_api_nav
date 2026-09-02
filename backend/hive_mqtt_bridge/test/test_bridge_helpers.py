"""
Unit tests for hive_mqtt_bridge — the ROS 2 side of the MQTT hop.

Run these INSIDE the robotstore container, which is the only place rclpy,
nav2_msgs and hive_interfaces are actually built:

    docker exec robotstore_cont-run-arm bash -lc \
      'source /opt/ros/humble/setup.bash && source ~/ros2_ws/install/setup.bash && \
       cd ~/ros2_ws/src/hive_mqtt_bridge && python3 -m pytest test -q'

No node is spun up and no DDS traffic is generated: the module-level helpers
are pure, and the handler methods are exercised on a bare instance with only
the attributes they touch. That keeps them fast and deterministic while still
covering the safety logic (teleop clamping, the /cmd_vel deadman, liveness).
"""
import json
import time

import pytest

from hive_mqtt_bridge import bridge_node as bn


# =============================================================================
# Topic naming — must mirror the gateway's app/config.py exactly, or the two
# halves of the system talk past each other on the broker.
# =============================================================================

def test_topic_prefix_matches_the_documented_tree():
    assert bn.TOPIC_PREFIX == f"hive/{bn.ROBOT_ID}"


@pytest.mark.parametrize("suffix", [
    "telemetry", "localisation", "plan", "scan", "health",
    "task/ack", "task/result", "goal/ack", "goal/result",
    "cancel_nav/ack", "webrtc/answer",
    "cmd/task", "cmd/velocity", "cmd/goal", "cmd/cancel_nav",
    "cmd/set_pose", "cmd/webrtc_offer",
])
def test_topic_builds_the_expected_name(suffix):
    assert bn._topic(suffix) == f"hive/{bn.ROBOT_ID}/{suffix}"


# =============================================================================
# _dict_to_pose_stamped — JSON off the bus -> a real ROS message
# =============================================================================

def test_dict_to_pose_stamped_maps_every_field():
    ps = bn._dict_to_pose_stamped({
        "header": {"frame_id": "map"},
        "pose": {"position": {"x": 1.5, "y": -2.25, "z": 0.5},
                 "orientation": {"x": 0.1, "y": 0.2, "z": 0.3, "w": 0.9}},
    })
    assert ps.header.frame_id == "map"
    assert (ps.pose.position.x, ps.pose.position.y, ps.pose.position.z) == (1.5, -2.25, 0.5)
    assert ps.pose.orientation.w == pytest.approx(0.9)


def test_dict_to_pose_stamped_defaults_to_identity_orientation():
    """w must default to 1.0 — a zero quaternion is invalid and Nav2 rejects it."""
    ps = bn._dict_to_pose_stamped({})
    assert ps.pose.orientation.w == 1.0
    assert (ps.pose.orientation.x, ps.pose.orientation.y, ps.pose.orientation.z) == (0.0, 0.0, 0.0)


def test_dict_to_pose_stamped_defaults_frame_to_map():
    assert bn._dict_to_pose_stamped({}).header.frame_id == "map"


def test_dict_to_pose_stamped_coerces_ints_to_float():
    """ROS float64 fields reject Python ints — this coercion is load-bearing."""
    ps = bn._dict_to_pose_stamped({"pose": {"position": {"x": 1, "y": 2, "z": 0}}})
    assert isinstance(ps.pose.position.x, float)


def test_first_pose_stamped_picks_the_first_waypoint():
    ps = bn._first_pose_stamped([
        {"pose": {"position": {"x": 7.0, "y": 0.0}}},
        {"pose": {"position": {"x": 9.0, "y": 0.0}}},
    ])
    assert ps.pose.position.x == 7.0


def test_first_pose_stamped_of_an_empty_route_is_a_default_pose():
    ps = bn._first_pose_stamped([])
    assert ps.pose.position.x == 0.0 and ps.pose.orientation.w == 1.0


# =============================================================================
# _poses_to_flat_waypoints — the contract with runner.cpp / IterateWaypoints
# =============================================================================

def test_flat_waypoints_use_the_keys_the_bt_layer_reads():
    out = bn._poses_to_flat_waypoints([{
        "header": {"frame_id": "map"},
        "pose": {"position": {"x": 1.0, "y": 2.0, "z": 0.0},
                 "orientation": {"x": 0.0, "y": 0.0, "z": 0.7, "w": 0.7}},
    }])
    assert set(out[0]) == {"x", "y", "z", "qx", "qy", "qz", "qw", "frame"}
    assert out[0]["qz"] == 0.7 and out[0]["frame"] == "map"


def test_flat_waypoints_preserve_route_order():
    xs = [1.0, 5.0, 3.0]
    out = bn._poses_to_flat_waypoints([{"pose": {"position": {"x": x, "y": 0.0}}} for x in xs])
    assert [w["x"] for w in out] == xs


def test_flat_waypoints_of_an_empty_route_is_empty():
    assert bn._poses_to_flat_waypoints([]) == []


def test_flat_waypoints_default_missing_fields():
    out = bn._poses_to_flat_waypoints([{}])
    assert out[0] == {"x": 0.0, "y": 0.0, "z": 0.0, "qx": 0.0, "qy": 0.0,
                      "qz": 0.0, "qw": 1.0, "frame": "map"}


# =============================================================================
# _build_json_payload — what the behavior tree actually receives
# =============================================================================

def test_json_payload_carries_waypoints_and_defaults():
    cfg = json.loads(bn._build_json_payload({}, [{"pose": {"position": {"x": 1.0, "y": 2.0}}}]))
    assert cfg["priority"] == "normal"
    assert cfg["pause_ms"] == 500
    assert len(cfg["waypoints"]) == 1


def test_json_payload_omits_waypoints_for_a_waypointless_behaviour():
    cfg = json.loads(bn._build_json_payload({}, []))
    assert "waypoints" not in cfg


@pytest.mark.parametrize("key,value", [("speed", 0.4), ("priority", "high"), ("pause_ms", 1200)])
def test_top_level_params_override_the_defaults(key, value):
    cfg = json.loads(bn._build_json_payload({key: value}, []))
    assert cfg[key] == value


def test_json_payload_string_is_parsed_and_merged():
    cfg = json.loads(bn._build_json_payload(
        {"json_payload": '{"custom": "value", "priority": "low"}'}, []))
    assert cfg["custom"] == "value"
    assert cfg["priority"] == "low"


def test_top_level_params_win_over_json_payload():
    """Explicit beats embedded — otherwise a stale json_payload silently
    overrides the speed the operator just set."""
    cfg = json.loads(bn._build_json_payload(
        {"json_payload": '{"speed": 0.1}', "speed": 0.7}, []))
    assert cfg["speed"] == 0.7


def test_json_payload_accepts_a_dict_as_well_as_a_string():
    cfg = json.loads(bn._build_json_payload({"json_payload": {"custom": 1}}, []))
    assert cfg["custom"] == 1


def test_malformed_json_payload_degrades_to_defaults_instead_of_raising():
    cfg = json.loads(bn._build_json_payload({"json_payload": "{not json"}, []))
    assert cfg["priority"] == "normal" and cfg["pause_ms"] == 500


def test_json_payload_is_always_valid_json_for_the_cpp_side():
    """runner.cpp parses this string; anything unserialisable breaks the tick."""
    for payload in ({}, {"speed": 0.5}, {"json_payload": ""}, {"json_payload": None}):
        json.loads(bn._build_json_payload(payload, []))


# =============================================================================
# Safety limits — the second, independent enforcement point
# =============================================================================

class _FakeLogger:
    def __init__(self):
        self.messages = []

    def info(self, msg):
        self.messages.append(msg)

    def warning(self, msg):
        self.messages.append(msg)

    def error(self, msg):
        self.messages.append(msg)


class _FakePublisher:
    def __init__(self):
        self.published = []

    def publish(self, msg):
        self.published.append(msg)


@pytest.fixture
def teleop_node():
    """
    A BridgeNode with ONLY the teleop attributes populated — no rclpy init,
    no DDS, no MQTT. Enough to exercise clamping and the deadman exactly as
    they run in production.
    """
    import threading

    node = bn.BridgeNode.__new__(bn.BridgeNode)
    node.cmd_vel_pub = _FakePublisher()
    node._cmd_vel_lock = threading.Lock()
    node._last_cmd_vel_time = None
    node._last_cmd_vel_nonzero = False
    node._logger = _FakeLogger()
    node.get_logger = lambda: node._logger
    return node


def _last_twist(node):
    return node.cmd_vel_pub.published[-1]


@pytest.mark.parametrize("sent,expected", [(5.0, 0.8), (-5.0, -0.8), (0.5, 0.5), (0.0, 0.0)])
def test_bridge_clamps_linear_velocity(teleop_node, sent, expected):
    """
    Defense in depth: the gateway clamps too, but anything that can publish
    to the broker — a stray script, a compromised client — reaches this
    handler directly. The robot-side limit is the one that actually protects
    the hardware.
    """
    teleop_node._handle_cmd_velocity(json.dumps({"linear": sent, "angular": 0.0}).encode())
    assert _last_twist(teleop_node).linear.x == pytest.approx(expected)


@pytest.mark.parametrize("sent,expected", [(9.9, 1.0), (-9.9, -1.0), (0.7, 0.7)])
def test_bridge_clamps_angular_velocity(teleop_node, sent, expected):
    teleop_node._handle_cmd_velocity(json.dumps({"linear": 0.0, "angular": sent}).encode())
    assert _last_twist(teleop_node).angular.z == pytest.approx(expected)


def test_bridge_limits_match_the_gateway_limits():
    """If these drift apart, the gateway silently permits speeds the robot
    then clips — or worse, the reverse."""
    assert bn._TELEOP_MAX_LINEAR == 0.8
    assert bn._TELEOP_MAX_ANGULAR == 1.0


def test_malformed_velocity_json_publishes_nothing(teleop_node):
    teleop_node._handle_cmd_velocity(b"{not json")
    assert teleop_node.cmd_vel_pub.published == []


def test_non_numeric_velocity_publishes_nothing(teleop_node):
    teleop_node._handle_cmd_velocity(json.dumps({"linear": "fast"}).encode())
    assert teleop_node.cmd_vel_pub.published == []


def test_missing_velocity_fields_are_treated_as_stop(teleop_node):
    teleop_node._handle_cmd_velocity(b"{}")
    assert _last_twist(teleop_node).linear.x == 0.0
    assert _last_twist(teleop_node).angular.z == 0.0


# =============================================================================
# /cmd_vel deadman — independent of the gateway's WebSocket-side watchdog
# =============================================================================

def test_deadman_zeroes_cmd_vel_after_the_timeout(teleop_node):
    """
    Covers the failure the gateway's own watchdog cannot see: the browser
    <-> gateway socket is healthy but the MQTT hop stalls. Without this the
    robot keeps driving at its last commanded speed.
    """
    teleop_node._handle_cmd_velocity(json.dumps({"linear": 0.6, "angular": 0.0}).encode())
    teleop_node._last_cmd_vel_time = time.monotonic() - (bn._CMD_VEL_WATCHDOG_S + 0.1)

    teleop_node._cmd_vel_watchdog_tick()

    assert _last_twist(teleop_node).linear.x == 0.0


def test_deadman_does_not_fire_while_frames_keep_arriving(teleop_node):
    teleop_node._handle_cmd_velocity(json.dumps({"linear": 0.6, "angular": 0.0}).encode())
    teleop_node._cmd_vel_watchdog_tick()
    assert _last_twist(teleop_node).linear.x == pytest.approx(0.6)


def test_deadman_fires_once_then_latches(teleop_node):
    """It runs at 10Hz; re-publishing zero forever would flood /cmd_vel."""
    teleop_node._handle_cmd_velocity(json.dumps({"linear": 0.6, "angular": 0.0}).encode())
    teleop_node._last_cmd_vel_time = time.monotonic() - 10.0

    for _ in range(5):
        teleop_node._cmd_vel_watchdog_tick()

    stops = [m for m in teleop_node.cmd_vel_pub.published if m.linear.x == 0.0]
    assert len(stops) == 1


def test_deadman_is_a_noop_before_any_teleop_happens(teleop_node):
    teleop_node._cmd_vel_watchdog_tick()
    assert teleop_node.cmd_vel_pub.published == []


def test_deadman_does_not_re_fire_after_a_clean_stop(teleop_node):
    """A zero frame already stopped the robot — the watchdog has nothing to do."""
    teleop_node._handle_cmd_velocity(json.dumps({"linear": 0.0, "angular": 0.0}).encode())
    teleop_node._last_cmd_vel_time = time.monotonic() - 10.0
    teleop_node._cmd_vel_watchdog_tick()
    assert len(teleop_node.cmd_vel_pub.published) == 1


def test_watchdog_window_is_wider_than_the_gateway_side_one():
    """0.5s bridge-side vs 0.4s gateway-side: the gateway should normally win,
    with the bridge as the backstop for a dead MQTT hop."""
    assert bn._CMD_VEL_WATCHDOG_S == 0.5


# =============================================================================
# Liveness — what /health ultimately reports to the dashboard
# =============================================================================

@pytest.fixture
def alive_node():
    import threading

    node = bn.BridgeNode.__new__(bn.BridgeNode)
    node._alive_lock = threading.Lock()
    node._cmd_vel_time = 0.0
    node._scan_time = 0.0
    node._camera_image_time = 0.0
    return node


def test_robot_is_not_alive_before_any_topic_publishes(alive_node):
    """
    The regression this guards: _scan_time was once created only inside
    _scan_cb, so a health tick before the first /scan crashed the node.
    """
    status = alive_node.is_robot_alive()
    assert status["alive"] is False
    assert status["scan_age_s"] is None
    assert status["cmd_vel_age_s"] is None
    assert status["camera_image_age_s"] is None


@pytest.mark.parametrize("attr", ["_scan_time", "_cmd_vel_time", "_camera_image_time"])
def test_any_single_fresh_topic_means_alive(alive_node, attr):
    setattr(alive_node, attr, time.monotonic())
    assert alive_node.is_robot_alive()["alive"] is True


def test_stale_topics_mean_not_alive(alive_node):
    old = time.monotonic() - 30.0
    alive_node._scan_time = old
    alive_node._cmd_vel_time = old
    alive_node._camera_image_time = old

    status = alive_node.is_robot_alive(max_age=5.0)
    assert status["alive"] is False
    assert status["scan_age_s"] > 5.0        # age still reported, for diagnosis


def test_liveness_boundary_is_max_age(alive_node):
    alive_node._scan_time = time.monotonic() - 4.9
    assert alive_node.is_robot_alive(max_age=5.0)["alive"] is True

    alive_node._scan_time = time.monotonic() - 5.1
    assert alive_node.is_robot_alive(max_age=5.0)["alive"] is False


# =============================================================================
# Command payload validation
#
# REGRESSION SUITE. Publishing `[]` to cmd/velocity used to raise
# AttributeError ('list' object has no attribute 'get') inside paho's network
# thread. Several handlers run inline on that thread, so the exception killed
# it: the bridge then kept publishing telemetry from its ROS timers — /health
# still reported robot_alive: true — while silently ignoring EVERY command,
# including cancel_nav. Anything able to publish to the broker could put the
# robot into that state with one malformed message.
# =============================================================================

@pytest.mark.parametrize("raw", [
    b"[]",                     # the payload that actually broke it
    b'["linear", 0.5]',
    b'"just a string"',
    b"42",
    b"true",
    b"null",
    b"{not json",
    b"\xff\xfe binary",
])
def test_a_non_object_payload_is_rejected_not_raised(raw):
    logger = _FakeLogger()
    assert bn._parse_command(raw, "cmd/velocity", logger) is None


@pytest.mark.parametrize("raw", [b"[]", b'"str"', b"42", b"{not json"])
def test_a_json_array_does_not_crash_the_velocity_handler(teleop_node, raw):
    teleop_node._handle_cmd_velocity(raw)   # must not raise
    assert teleop_node.cmd_vel_pub.published == []


def test_an_empty_velocity_payload_is_treated_as_a_stop(teleop_node):
    """Empty decodes to {}, which clamps to a zero twist — fail-safe, and
    the only non-rejecting case in the parser."""
    teleop_node._handle_cmd_velocity(b"")
    assert _last_twist(teleop_node).linear.x == 0.0
    assert _last_twist(teleop_node).angular.z == 0.0


def test_parse_command_accepts_a_normal_object():
    assert bn._parse_command(b'{"linear": 0.5}', "cmd/velocity", _FakeLogger()) == {"linear": 0.5}


def test_parse_command_treats_an_empty_payload_as_an_empty_object():
    """cmd/cancel_nav is sometimes published with no body — it must still
    mean "stop", not "ignore". Empty is the one input that decodes rather
    than being rejected."""
    assert bn._parse_command(b"", "cmd/cancel_nav", _FakeLogger()) == {}


def test_every_command_handler_uses_the_shared_parser():
    """
    Guards against a new handler being added with its own json.loads and
    reintroducing the crash. Checked by source inspection because the
    handlers themselves need a live node to call.
    """
    import inspect

    src = inspect.getsource(bn)
    for handler in ("_handle_cmd_task", "_handle_cmd_velocity", "_handle_cmd_goal",
                    "_handle_cmd_cancel_nav", "_handle_cmd_set_pose",
                    "_handle_cmd_webrtc_offer"):
        body = src[src.index(f"def {handler}("):]
        body = body[:body.index("\n    def ", 10)] if "\n    def " in body[10:] else body
        assert "_parse_command(" in body, \
            f"{handler} parses its payload itself instead of using _parse_command"


def test_the_mqtt_dispatch_is_wrapped_so_a_handler_cannot_kill_the_link():
    """
    The structural backstop: _on_mqtt_message must never let an exception
    escape into paho's network thread, whatever a handler does.
    """
    import inspect

    src = inspect.getsource(bn.BridgeNode._on_mqtt_message)
    assert "try:" in src and "except Exception" in src


class _ExplodingNode:
    """A BridgeNode whose dispatch always raises — proves the guard holds."""

    def __init__(self):
        self._logger = _FakeLogger()

    def get_logger(self):
        return self._logger

    def _dispatch_mqtt_message(self, msg):
        raise RuntimeError("handler blew up")


def test_a_raising_handler_is_logged_and_contained():
    class _Msg:
        topic = "hive/robot-1/cmd/task"
        payload = b"{}"

    node = _ExplodingNode()
    bn.BridgeNode._on_mqtt_message(node, None, None, _Msg())   # must not raise
    assert any("raised" in m for m in node._logger.messages)
