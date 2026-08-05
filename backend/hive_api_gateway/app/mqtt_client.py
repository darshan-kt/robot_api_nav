"""
GatewayMqttClient — the gateway's ONLY connection to the robot.

Owns the single aiomqtt connection to the broker and runs entirely inside
FastAPI's own asyncio event loop. Worth calling out explicitly: the old
ApiNode needed threading.Lock around every cached attribute because it was
bridging an asyncio loop (FastAPI/uvicorn) and a separate rclpy-spin thread
touching the same state. There is only one thread here — aiomqtt's message
loop and the REST/WebSocket handlers are all coroutines on the same event
loop — so plain attribute reads/writes are safe without any locking.
"""
import asyncio
import json
import logging

import aiomqtt

from . import config

logger = logging.getLogger('gateway.mqtt')


class MqttUnavailable(Exception):
    """Raised when a command needs to be published but the broker link is down."""


class TaskAckTimeout(Exception):
    """Raised when the bridge doesn't answer a cmd/task publish in time."""


class GatewayMqttClient:
    def __init__(self):
        self._client: aiomqtt.Client | None = None
        self._connected = asyncio.Event()
        self._listen_task: asyncio.Task | None = None

        # Cached latest state — updated by the message-listener loop below,
        # read directly by REST/WebSocket handlers. Mirrors the old
        # ApiNode.get_odom() / get_localization() / get_plan() / get_scan()
        # cache-latest-value pattern, just fed by MQTT instead of rclpy
        # subscriptions.
        self.latest_telemetry:    dict | None = None
        self.latest_localisation: dict | None = None
        self.latest_plan:         dict | None = None
        self.latest_scan:         dict | None = None
        self.latest_health:       dict | None = None

        # task_id -> Future, resolved when a matching task/ack arrives.
        self._pending_acks: dict[str, asyncio.Future] = {}

    # =========================================================================
    # Lifecycle
    # =========================================================================

    def start(self):
        self._listen_task = asyncio.create_task(self._run(), name='mqtt-listener')

    async def stop(self):
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except (asyncio.CancelledError, Exception):
                pass

    async def _run(self):
        """Connect, listen, and reconnect forever with backoff — same
        reconnect-with-backoff shape the frontend's WS hooks already use, so
        the gateway behaves the same way toward its broker as browsers do
        toward the gateway."""
        delay = 2.0
        while True:
            try:
                async with aiomqtt.Client(
                    config.MQTT_HOST, config.MQTT_PORT,
                    username=config.MQTT_USERNAME, password=config.MQTT_PASSWORD,
                    identifier=f'hive_api_gateway-{config.ROBOT_ID}',
                ) as client:
                    self._client = client
                    self._connected.set()
                    delay = 2.0
                    logger.info(f'[mqtt] connected to {config.MQTT_HOST}:{config.MQTT_PORT}')

                    await client.subscribe(f'{config.TOPIC_PREFIX}/#', qos=1)

                    async for message in client.messages:
                        self._on_message(str(message.topic), message.payload)

            except aiomqtt.MqttError as exc:
                logger.warning(f'[mqtt] connection lost ({exc}) — retrying in {delay:.0f}s')
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception('[mqtt] unexpected error in listener loop')
            finally:
                self._client = None
                self._connected.clear()

            await asyncio.sleep(delay)
            delay = min(delay * 1.5, 15.0)

    @property
    def connected(self) -> bool:
        return self._connected.is_set()

    # =========================================================================
    # Incoming messages (bridge -> broker -> gateway)
    # =========================================================================

    def _on_message(self, topic: str, payload: bytes):
        prefix = f'{config.TOPIC_PREFIX}/'
        if not topic.startswith(prefix):
            return
        suffix = topic[len(prefix):]

        try:
            data = json.loads(payload)
        except ValueError:
            logger.warning(f'[mqtt] non-JSON payload on {topic}, dropping')
            return

        if suffix == 'telemetry':
            self.latest_telemetry = data
        elif suffix == 'localisation':
            self.latest_localisation = data
        elif suffix == 'plan':
            self.latest_plan = data
        elif suffix == 'scan':
            self.latest_scan = data
        elif suffix == 'health':
            self.latest_health = data
        elif suffix == 'task/ack':
            fut = self._pending_acks.pop(data.get('task_id'), None)
            if fut and not fut.done():
                fut.set_result(data)
        elif suffix == 'task/result':
            logger.info(f'[mqtt] task/result: {data}')

    # =========================================================================
    # Outgoing commands (gateway -> broker -> bridge)
    # =========================================================================

    async def publish_task(self, payload: dict, timeout: float = config.TASK_ACK_TIMEOUT_S) -> dict:
        """
        Publish cmd/task and wait for the bridge's task/ack — preserves the
        old synchronous "did the robot accept this goal" response shape
        (accepted / nav_mode / waypoint_count / detail) that the frontend's
        POST /tasks handling already expects.
        """
        if not self.connected or self._client is None:
            raise MqttUnavailable('MQTT broker unreachable')

        task_id = payload['task_id']
        fut: asyncio.Future = asyncio.get_running_loop().create_future()
        self._pending_acks[task_id] = fut
        try:
            await self._client.publish(f'{config.TOPIC_PREFIX}/cmd/task', json.dumps(payload), qos=1)
            return await asyncio.wait_for(fut, timeout=timeout)
        except asyncio.TimeoutError:
            raise TaskAckTimeout(f'No response from robot within {timeout:.0f}s')
        finally:
            self._pending_acks.pop(task_id, None)

    async def publish_velocity(self, linear: float, angular: float):
        """Best-effort — if the link is down, the bridge's own 500ms
        cmd/velocity watchdog zeroes /cmd_vel independently, so there's
        nothing useful to raise here."""
        if not self.connected or self._client is None:
            return
        await self._client.publish(
            f'{config.TOPIC_PREFIX}/cmd/velocity',
            json.dumps({'linear': linear, 'angular': angular}),
            qos=0,
        )
