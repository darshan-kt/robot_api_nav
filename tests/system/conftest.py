"""
System tests — run against the LIVE docker stack, not a fake.

They are skipped automatically when the stack isn't up, so `pytest tests/`
stays green on a laptop with nothing running. Bring the stack up first:

    docker compose up -d      (or: make run-all)

Anything that would physically MOVE the robot is gated behind
HIVE_ALLOW_MOTION=1 — see the `motion` fixture. Read-only checks and the
stop/cancel path always run, because those are safe by construction.
"""
import json
import os
import socket
import threading
import time

import pytest

GATEWAY_HOST = os.environ.get("HIVE_TEST_GATEWAY_HOST", "localhost")
GATEWAY_PORT = int(os.environ.get("HIVE_TEST_GATEWAY_PORT", "1717"))
BROKER_HOST = os.environ.get("HIVE_TEST_MQTT_HOST", "localhost")
BROKER_PORT = int(os.environ.get("HIVE_TEST_MQTT_PORT", "1883"))
APPSTORE_PORT = int(os.environ.get("HIVE_TEST_APPSTORE_PORT", "5174"))
ROBOT_ID = os.environ.get("ROBOT_ID", "robot-1")
TOPIC_PREFIX = f"hive/{ROBOT_ID}"

BASE_URL = f"http://{GATEWAY_HOST}:{GATEWAY_PORT}"
WS_URL = f"ws://{GATEWAY_HOST}:{GATEWAY_PORT}"


def _port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def pytest_collection_modifyitems(config, items):
    """
    Skip in one place when the stack is absent.

    Two tiers: most system tests need the gateway AND the broker, but the
    AWS-latency tests run the gateway in-process and only need a broker, so
    they stay runnable with just `docker compose up -d mqtt-broker`.
    """
    broker_up = _port_open(BROKER_HOST, BROKER_PORT)
    gateway_up = _port_open(GATEWAY_HOST, GATEWAY_PORT)

    skip_broker = pytest.mark.skip(
        reason=f"broker not reachable ({BROKER_HOST}:{BROKER_PORT}) "
               f"— start it with `docker compose up -d mqtt-broker`")
    skip_stack = pytest.mark.skip(
        reason=f"live stack not reachable ({BASE_URL} / {BROKER_HOST}:{BROKER_PORT}) "
               f"— start it with `docker compose up -d`")

    for item in items:
        if "system" not in item.keywords:
            continue
        if "broker_only" in item.keywords:
            if not broker_up:
                item.add_marker(skip_broker)
        elif not (broker_up and gateway_up):
            item.add_marker(skip_stack)


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def ws_url() -> str:
    return WS_URL


@pytest.fixture(scope="session")
def http():
    import httpx
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as c:
        yield c


@pytest.fixture
def motion():
    """
    Gate for anything that makes the robot move. Opt in explicitly:

        HIVE_ALLOW_MOTION=1 .venv-test/bin/python -m pytest tests/system
    """
    if os.environ.get("HIVE_ALLOW_MOTION") != "1":
        pytest.skip("would move the robot — set HIVE_ALLOW_MOTION=1 to run")


class MqttRecorder:
    """
    Subscribes to the robot's whole topic tree and records what arrives.
    Works with both paho 1.x and 2.x, since the host and the robot container
    ship different major versions.
    """

    def __init__(self, host: str, port: int, prefix: str):
        import paho.mqtt.client as mqtt

        try:   # paho 2.x
            self._client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                client_id=f"hive-systest-{os.getpid()}",
            )
        except (AttributeError, TypeError):   # paho 1.x
            self._client = mqtt.Client(client_id=f"hive-systest-{os.getpid()}")

        self._prefix = prefix
        self.messages: list[tuple[str, dict | str]] = []
        self._lock = threading.Lock()
        self._client.on_message = self._on_message
        self._client.connect(host, port, keepalive=30)
        self._client.subscribe(f"{prefix}/#", qos=1)
        self._client.loop_start()

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload)
        except ValueError:
            payload = msg.payload.decode("utf-8", "replace")
        with self._lock:
            self.messages.append((msg.topic, payload))

    def publish(self, suffix: str, payload: dict, qos: int = 1):
        self._client.publish(f"{self._prefix}/{suffix}", json.dumps(payload), qos=qos)

    def topics(self) -> set[str]:
        with self._lock:
            return {t for t, _ in self.messages}

    def wait_for(self, suffix: str, timeout: float = 10.0, match=None):
        """Block until a message on <prefix>/<suffix> arrives; return its payload."""
        topic = f"{self._prefix}/{suffix}"
        deadline = time.monotonic() + timeout
        seen = 0
        while time.monotonic() < deadline:
            with self._lock:
                pending = self.messages[seen:]
                seen = len(self.messages)
            for t, payload in pending:
                if t == topic and (match is None or match(payload)):
                    return payload
            time.sleep(0.05)
        pytest.fail(f"no message on {topic} within {timeout:.0f}s "
                    f"(saw topics: {sorted(self.topics())})")

    def close(self):
        self._client.loop_stop()
        self._client.disconnect()


@pytest.fixture
def mqtt_recorder():
    rec = MqttRecorder(BROKER_HOST, BROKER_PORT, TOPIC_PREFIX)
    try:
        yield rec
    finally:
        rec.close()
