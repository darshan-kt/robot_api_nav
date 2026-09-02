"""
/ping, /health and /webrtc/offer.

/health is what the dashboard's status light reads. Its most important
property is that it fails CLOSED — a gateway that can't see the robot must
never report the robot alive.
"""
import pytest

pytestmark = pytest.mark.integration


# =============================================================================
# /ping — liveness of this process only
# =============================================================================

def test_ping_is_ok(client):
    assert client.get("/ping").json() == {"status": "ok"}


def test_ping_answers_even_with_the_broker_down(client, offline_mqtt):
    """It's a process-liveness probe; coupling it to MQTT would make restarts
    look like crashes to an orchestrator."""
    assert client.get("/ping").status_code == 200


# =============================================================================
# /health
# =============================================================================

def test_health_fails_closed_when_mqtt_is_down(client, fake_mqtt):
    fake_mqtt.connected = False
    fake_mqtt.latest_health = {"ros_ready": True, "robot_alive": True, "topics": {}}

    body = client.get("/health").json()
    assert body["robot_alive"] is False, "must not report a live robot it cannot see"
    assert body["ros_ready"] is False
    assert body["mqtt_connected"] is False


def test_health_fails_closed_before_any_health_message_arrives(client, fake_mqtt):
    fake_mqtt.connected = True
    fake_mqtt.latest_health = None

    body = client.get("/health").json()
    assert body["robot_alive"] is False
    assert body["mqtt_connected"] is True
    assert set(body["topics"]) == {"/cmd_vel", "/scan", "/camera/image_raw"}


def test_health_passes_the_bridge_report_through(client, fake_mqtt):
    fake_mqtt.latest_health = {
        "ros_ready": True, "robot_alive": True,
        "topics": {"/cmd_vel": 0.2, "/scan": 0.1, "/camera/image_raw": 0.3},
    }
    body = client.get("/health").json()
    assert body["robot_alive"] is True
    assert body["topics"]["/scan"] == 0.1
    assert body["mqtt_connected"] is True


def test_health_surfaces_the_last_will_payload(client, fake_mqtt):
    """
    If the bridge dies uncleanly the broker publishes its retained LWT.
    That must reach the dashboard as robot_alive:false — no staleness
    timeout needed on this side.
    """
    fake_mqtt.latest_health = {"ros_ready": False, "robot_alive": False,
                               "reason": "bridge_disconnected"}
    body = client.get("/health").json()
    assert body["robot_alive"] is False
    assert body["reason"] == "bridge_disconnected"


def test_health_reports_the_topic_keys_the_dashboard_reads(client, fake_mqtt):
    """The dashboard indexes these three by name; renaming one blanks the UI."""
    fake_mqtt.latest_health = {"ros_ready": True, "robot_alive": True,
                               "topics": {"/cmd_vel": None, "/scan": None,
                                          "/camera/image_raw": None}}
    assert set(client.get("/health").json()["topics"]) == \
        {"/cmd_vel", "/scan", "/camera/image_raw"}


# =============================================================================
# /webrtc/offer
# =============================================================================

def test_webrtc_offer_relays_the_sdp_and_returns_the_answer(client, fake_mqtt):
    r = client.post("/webrtc/offer", json={"sdp": "v=0 browser offer", "type": "offer"})
    assert r.status_code == 200
    assert r.json() == {"sdp": "v=0-answer", "type": "answer"}
    assert fake_mqtt.published_offers == [("v=0 browser offer", "offer")]


def test_webrtc_offer_defaults_the_type(client, fake_mqtt):
    client.post("/webrtc/offer", json={"sdp": "v=0..."})
    assert fake_mqtt.published_offers[0][1] == "offer"


def test_webrtc_offer_requires_an_sdp(client, fake_mqtt):
    assert client.post("/webrtc/offer", json={"type": "offer"}).status_code == 422
    assert fake_mqtt.published_offers == []


def test_webrtc_camera_unreachable_is_503_not_504(client, fake_mqtt):
    """
    The bridge answered — the CAMERA is down. Distinct from a silent robot,
    and the operator needs to see the difference.
    """
    fake_mqtt.webrtc_answer = ValueError("hive_camera_bridge unreachable")
    r = client.post("/webrtc/offer", json={"sdp": "v=0..."})
    assert r.status_code == 503
    assert "camera" in r.json()["detail"].lower()


@pytest.mark.parametrize("fixture_name,expected", [("offline_mqtt", 503), ("silent_robot", 504)])
def test_webrtc_failure_mapping(client, request, fixture_name, expected):
    request.getfixturevalue(fixture_name)
    assert client.post("/webrtc/offer", json={"sdp": "v=0..."}).status_code == expected


# =============================================================================
# CORS — the browser-facing surface
# =============================================================================

def test_cors_headers_are_present_for_the_browser(client):
    r = client.options("/tasks", headers={
        "Origin": "http://localhost:5174",
        "Access-Control-Request-Method": "POST",
    })
    assert r.status_code in (200, 204)
    assert "access-control-allow-origin" in {k.lower() for k in r.headers}
