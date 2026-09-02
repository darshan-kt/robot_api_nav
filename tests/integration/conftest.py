"""
Integration-test rig: the REAL FastAPI app, wired to a FAKE broker link.

Everything from the HTTP/WebSocket boundary down through routing, validation,
coordinate conversion, error mapping and response shaping is exercised for
real. Only mqtt_client is swapped out — so these tests assert exactly what an
operator's browser sees, and exactly what would go onto the MQTT bus, without
needing a broker, a bridge, or a robot.
"""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app import main as gateway_main
from app.mqtt_client import AckTimeout, MqttUnavailable


class FakeGatewayMqtt:
    """
    Records every outbound call and returns programmable acks.

    Tests set .task_ack / .goal_ack / .cancel_ack / .webrtc_answer to a dict
    (returned) or an Exception instance (raised), which is how the 503/504
    error-mapping paths get covered.
    """

    def __init__(self):
        self.connected = True

        self.latest_telemetry = None
        self.latest_localisation = None
        self.latest_plan = None
        self.latest_scan = None
        self.latest_health = None

        self.task_ack = {"accepted": True, "behavior": "FollowRoute",
                         "waypoint_count": 0, "nav_mode": "hive_bt"}
        self.goal_ack = {"accepted": True, "waypoint_count": 0,
                         "nav_mode": "navigate_through_poses", "cancellable": True}
        self.cancel_ack = {"cancelled": True, "detail": "cancel requested"}
        self.webrtc_answer = {"sdp": "v=0-answer", "type": "answer"}

        self.published_tasks: list[dict] = []
        self.published_goals: list[list] = []
        self.published_velocities: list[tuple[float, float]] = []
        self.published_poses: list[tuple[dict, list | None]] = []
        self.published_offers: list[tuple[str, str]] = []
        self.cancel_calls = 0

    # --- lifecycle (no-ops; nothing to connect to) -------------------------
    def start(self):
        pass

    async def stop(self):
        pass

    # --- outbound ----------------------------------------------------------
    @staticmethod
    def _resolve(value):
        if isinstance(value, Exception):
            raise value
        return value

    async def publish_task(self, payload, timeout=None):
        self.published_tasks.append(payload)
        return self._resolve(self.task_ack)

    async def publish_goal(self, poses, timeout=None):
        self.published_goals.append(poses)
        ack = self._resolve(self.goal_ack)
        return {**ack, "goal_id": "fake-goal-id"}

    async def publish_cancel_nav(self, timeout=None):
        self.cancel_calls += 1
        return self._resolve(self.cancel_ack)

    async def publish_set_pose(self, pose, covariance=None):
        self.published_poses.append((pose, covariance))
        if isinstance(self.task_ack, MqttUnavailable):
            raise self.task_ack

    async def publish_velocity(self, linear, angular):
        self.published_velocities.append((linear, angular))

    async def publish_webrtc_offer(self, sdp, type_, timeout=None):
        self.published_offers.append((sdp, type_))
        return self._resolve(self.webrtc_answer)


@pytest.fixture
def fake_mqtt(monkeypatch):
    fake = FakeGatewayMqtt()
    monkeypatch.setattr(gateway_main, "mqtt_client", fake)
    return fake


@pytest.fixture
def client(fake_mqtt):
    with TestClient(gateway_main.api_app) as c:
        yield c


@pytest.fixture
def offline_mqtt(fake_mqtt):
    """Broker link down: every command raises MqttUnavailable -> 503."""
    fake_mqtt.connected = False
    err = MqttUnavailable("MQTT broker unreachable")
    fake_mqtt.task_ack = err
    fake_mqtt.goal_ack = err
    fake_mqtt.cancel_ack = err
    fake_mqtt.webrtc_answer = err
    return fake_mqtt


@pytest.fixture
def silent_robot(fake_mqtt):
    """Broker up, robot never answers: every command raises AckTimeout -> 504."""
    err = AckTimeout("No response from robot within 8s")
    fake_mqtt.task_ack = err
    fake_mqtt.goal_ack = err
    fake_mqtt.cancel_ack = err
    fake_mqtt.webrtc_answer = err
    return fake_mqtt


@pytest.fixture
def map_dir(tmp_path, monkeypatch):
    """An isolated ROBOT_MAP_DIR holding a valid 4x4 greyscale .pgm + .yaml."""
    from app import config

    pgm = tmp_path / "unit_map.pgm"
    pgm.write_bytes(b"P5\n4 4\n255\n" + bytes(range(0, 256, 16)))
    (tmp_path / "unit_map.yaml").write_text(
        "image: unit_map.pgm\nresolution: 0.07\norigin: [-1.5, -2.5, 0.0]\n"
    )
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(tmp_path))
    return tmp_path
