"""
The four WebSocket streams: /api/telemetry, /api/localisation, /api/plan,
/api/scan, and the teleop channel /api/velocity_ctrl.

/api/velocity_ctrl is the safety-critical one — it is the only path in the
system that makes the wheels turn from a browser. Its clamping and its
deadman behaviour get the most attention here.
"""
import json

import pytest

pytestmark = pytest.mark.integration


# =============================================================================
# Read-only state streams
# =============================================================================

def test_telemetry_stream_relays_the_cached_value(client, fake_mqtt):
    fake_mqtt.latest_telemetry = {"type": "telemetry", "x": 1.0, "y": 2.0, "theta": 0.5}
    with client.websocket_connect("/api/telemetry") as ws:
        assert ws.receive_json() == fake_mqtt.latest_telemetry


def test_localisation_stream_tags_the_message_type(client, fake_mqtt):
    """The frontend hook switches on `type`; the bridge payload doesn't carry it."""
    fake_mqtt.latest_localisation = {"x": 1.0, "y": 2.0, "yaw": 0.1,
                                     "frame_id": "map", "age_s": 0.2}
    with client.websocket_connect("/api/localisation") as ws:
        msg = ws.receive_json()
    assert msg["type"] == "localisation"
    assert msg["x"] == 1.0 and msg["frame_id"] == "map"


def test_plan_stream_sends_an_explicit_empty_plan_when_idle(client, fake_mqtt):
    """
    Silence would leave a stale route drawn on the operator's map. An empty
    points[] is what clears it.
    """
    fake_mqtt.latest_plan = None
    with client.websocket_connect("/api/plan") as ws:
        msg = ws.receive_json()
    assert msg == {"type": "plan", "frame_id": "map", "age_s": None, "points": []}


def test_plan_stream_relays_an_active_plan(client, fake_mqtt):
    fake_mqtt.latest_plan = {"type": "plan", "frame_id": "map", "age_s": 0.1,
                             "points": [{"x": 1.0, "y": 1.0}, {"x": 2.0, "y": 2.0}]}
    with client.websocket_connect("/api/plan") as ws:
        assert len(ws.receive_json()["points"]) == 2


def test_streams_accept_a_connection_before_any_data_exists(client, fake_mqtt):
    """A browser opening the dashboard before the robot boots must not error."""
    fake_mqtt.latest_telemetry = None
    with client.websocket_connect("/api/telemetry"):
        pass   # connect + close cleanly


# =============================================================================
# /api/scan — opt-in gating
# =============================================================================

def test_scan_sends_nothing_until_the_client_opts_in(client, fake_mqtt):
    """
    The bridge publishes scan continuously now; this handler is the only
    remaining place the browser's opt-in is enforced. A leak here means every
    dashboard tab pays for LIDAR bandwidth it never asked for.
    """
    fake_mqtt.latest_scan = {"type": "scan", "ranges": [1.0, 2.0]}
    with client.websocket_connect("/api/scan") as ws:
        ws.send_text(json.dumps({"type": "scan_toggle", "enabled": False}))
        ws.send_text(json.dumps({"type": "ping"}))
        ws.send_text(json.dumps({"type": "scan_toggle", "enabled": True}))
        assert ws.receive_json()["type"] == "scan"


def test_scan_streams_after_opt_in(client, fake_mqtt):
    fake_mqtt.latest_scan = {"type": "scan", "frame_id": "base_scan",
                             "angle_min": -3.14, "ranges": [1.0] * 360}
    with client.websocket_connect("/api/scan") as ws:
        ws.send_text(json.dumps({"type": "scan_toggle", "enabled": True}))
        msg = ws.receive_json()
    assert len(msg["ranges"]) == 360


def test_scan_survives_a_malformed_client_message(client, fake_mqtt):
    fake_mqtt.latest_scan = {"type": "scan", "ranges": []}
    with client.websocket_connect("/api/scan") as ws:
        ws.send_text("not json")
        ws.send_text(json.dumps({"type": "scan_toggle", "enabled": True}))
        assert ws.receive_json()["type"] == "scan"


# =============================================================================
# /api/velocity_ctrl — teleop
# =============================================================================

def _drive(client, frames):
    """Send frames, then close; returns everything that reached the bus."""
    with client.websocket_connect("/api/velocity_ctrl") as ws:
        for f in frames:
            ws.send_text(json.dumps(f) if isinstance(f, dict) else f)


def test_velocity_frames_reach_the_bus(client, fake_mqtt):
    _drive(client, [{"type": "cmd_vel", "linear": 0.2, "angular": 0.1}])
    assert (0.2, 0.1) in fake_mqtt.published_velocities


@pytest.mark.parametrize("sent,expected", [
    (5.0,   0.8),    # forward, over the limit
    (-5.0, -0.8),    # reverse, over the limit
    (0.5,   0.5),    # in range, untouched
])
def test_linear_velocity_is_clamped(client, fake_mqtt, sent, expected):
    _drive(client, [{"type": "cmd_vel", "linear": sent, "angular": 0.0}])
    assert fake_mqtt.published_velocities[0][0] == pytest.approx(expected)


@pytest.mark.parametrize("sent,expected", [(9.9, 1.0), (-9.9, -1.0), (0.7, 0.7)])
def test_angular_velocity_is_clamped(client, fake_mqtt, sent, expected):
    _drive(client, [{"type": "cmd_vel", "linear": 0.0, "angular": sent}])
    assert fake_mqtt.published_velocities[0][1] == pytest.approx(expected)


def test_a_hostile_client_cannot_exceed_the_speed_limit(client, fake_mqtt):
    """Nothing above the limits may reach the bus, whatever the client sends."""
    _drive(client, [
        {"type": "cmd_vel", "linear": 1e9,   "angular": 1e9},
        {"type": "cmd_vel", "linear": -1e9,  "angular": -1e9},
        {"type": "cmd_vel", "linear": 0.81,  "angular": 1.01},
    ])
    for lin, ang in fake_mqtt.published_velocities:
        assert abs(lin) <= 0.8 and abs(ang) <= 1.0


def test_zero_frame_stops_the_robot(client, fake_mqtt):
    """The client's release frame — the normal way a drive ends."""
    _drive(client, [
        {"type": "cmd_vel", "linear": 0.5, "angular": 0.0},
        {"type": "cmd_vel", "linear": 0.0, "angular": 0.0},
    ])
    assert fake_mqtt.published_velocities[-1] == (0.0, 0.0)


def test_disconnect_while_moving_publishes_a_stop(client, fake_mqtt):
    """
    THE critical teleop case: the browser tab closes (or the operator's wifi
    drops) mid-drive. The handler's finally-block must zero the wheels rather
    than leaving the last non-zero command standing.
    """
    _drive(client, [{"type": "cmd_vel", "linear": 0.6, "angular": 0.0}])
    assert fake_mqtt.published_velocities[-1] == (0.0, 0.0)


def test_disconnect_while_stopped_does_not_emit_a_redundant_stop(client, fake_mqtt):
    _drive(client, [{"type": "cmd_vel", "linear": 0.0, "angular": 0.0}])
    assert fake_mqtt.published_velocities == [(0.0, 0.0)]


def test_non_cmd_vel_messages_are_ignored(client, fake_mqtt):
    _drive(client, [{"type": "hello"}, {"type": "scan_toggle", "enabled": True}])
    assert fake_mqtt.published_velocities == []


def test_malformed_teleop_frames_do_not_kill_the_channel(client, fake_mqtt):
    """One bad frame must not drop the operator's control link."""
    with client.websocket_connect("/api/velocity_ctrl") as ws:
        ws.send_text("{not json")
        ws.send_text(json.dumps({"type": "cmd_vel", "linear": 0.3, "angular": 0.0}))
        ws.send_text(json.dumps({"type": "cmd_vel", "linear": 0.0, "angular": 0.0}))
    assert (0.3, 0.0) in fake_mqtt.published_velocities


def test_missing_velocity_fields_default_to_zero(client, fake_mqtt):
    _drive(client, [{"type": "cmd_vel"}])
    assert fake_mqtt.published_velocities == [(0.0, 0.0)]


def test_non_numeric_velocity_does_not_reach_the_bus(client, fake_mqtt):
    """float("fast") raises inside the handler; the channel closes, and the
    finally-block's stop is the only thing that may be published."""
    _drive(client, [{"type": "cmd_vel", "linear": "fast", "angular": 0.0}])
    assert all(isinstance(v[0], float) for v in fake_mqtt.published_velocities)
    assert all(abs(v[0]) <= 0.8 for v in fake_mqtt.published_velocities)


def test_deadman_stops_the_robot_when_the_stream_goes_quiet(client, fake_mqtt):
    """
    THE other critical teleop case: the socket stays OPEN but frames stop
    arriving (frozen tab, stalled network, a UI bug that skips the release
    frame). After ~400ms of silence the handler must publish a zero itself
    without waiting for a disconnect.
    """
    import time

    with client.websocket_connect("/api/velocity_ctrl") as ws:
        ws.send_text(json.dumps({"type": "cmd_vel", "linear": 0.6, "angular": 0.0}))
        time.sleep(1.0)                       # go quiet, socket still open
        assert fake_mqtt.published_velocities[-1] == (0.0, 0.0), \
            "deadman did not zero /cmd_vel while the socket was still open"


def test_deadman_fires_once_not_continuously(client, fake_mqtt):
    """It latches on `moving` — an idle socket must not spam the bus at 2.5Hz."""
    import time

    with client.websocket_connect("/api/velocity_ctrl") as ws:
        ws.send_text(json.dumps({"type": "cmd_vel", "linear": 0.6, "angular": 0.0}))
        time.sleep(1.5)
        stops = [v for v in fake_mqtt.published_velocities if v == (0.0, 0.0)]
        assert len(stops) == 1, f"deadman published {len(stops)} stops while idle"
