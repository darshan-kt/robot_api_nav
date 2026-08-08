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
import uuid

import aiomqtt

from . import config

logger = logging.getLogger('gateway.mqtt')


class MqttUnavailable(Exception):
    """Raised when a command needs to be published but the broker link is down."""


class AckTimeout(Exception):
    """Raised when the bridge doesn't answer a cmd/task, cmd/goal, or
    cmd/cancel_nav publish in time."""


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

        # id -> Future, resolved when the matching ack arrives. Separate maps
        # (rather than one shared one) so a task_id, goal_id, cancel
        # request_id, and webrtc offer_id can never collide even in
        # principle.
        self._pending_task_acks:   dict[str, asyncio.Future] = {}
        self._pending_goal_acks:   dict[str, asyncio.Future] = {}
        self._pending_cancel_acks: dict[str, asyncio.Future] = {}
        self._pending_webrtc_acks: dict[str, asyncio.Future] = {}

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
            self._resolve(self._pending_task_acks, data.get('task_id'), data)
        elif suffix == 'task/result':
            logger.info(f'[mqtt] task/result: {data}')
        elif suffix == 'goal/ack':
            self._resolve(self._pending_goal_acks, data.get('goal_id'), data)
        elif suffix == 'goal/result':
            logger.info(f'[mqtt] goal/result: {data}')
        elif suffix == 'cancel_nav/ack':
            self._resolve(self._pending_cancel_acks, data.get('request_id'), data)
        elif suffix == 'webrtc/answer':
            self._resolve(self._pending_webrtc_acks, data.get('offer_id'), data)

    @staticmethod
    def _resolve(pending: dict, key, data: dict):
        fut = pending.pop(key, None)
        if fut and not fut.done():
            fut.set_result(data)

    # =========================================================================
    # Outgoing commands (gateway -> broker -> bridge)
    # =========================================================================

    async def _publish_and_wait(self, pending: dict, key: str, mqtt_suffix: str,
                                 payload: dict, timeout: float) -> dict:
        """Shared publish-then-wait-for-ack machinery for cmd/task, cmd/goal,
        and cmd/cancel_nav — they all follow the same shape: publish a
        keyed command, register a Future under that key, resolve it when
        the matching ack arrives on the bus."""
        if not self.connected or self._client is None:
            raise MqttUnavailable('MQTT broker unreachable')

        fut: asyncio.Future = asyncio.get_running_loop().create_future()
        pending[key] = fut
        try:
            await self._client.publish(f'{config.TOPIC_PREFIX}/{mqtt_suffix}', json.dumps(payload), qos=1)
            return await asyncio.wait_for(fut, timeout=timeout)
        except asyncio.TimeoutError:
            raise AckTimeout(f'No response from robot within {timeout:.0f}s')
        finally:
            pending.pop(key, None)

    async def publish_task(self, payload: dict, timeout: float = config.TASK_ACK_TIMEOUT_S) -> dict:
        """
        Publish cmd/task and wait for the bridge's task/ack — preserves the
        old synchronous "did the robot accept this goal" response shape
        (accepted / nav_mode / waypoint_count / detail) that the frontend's
        POST /tasks handling already expects.
        """
        task_id = payload['task_id']
        return await self._publish_and_wait(self._pending_task_acks, task_id, 'cmd/task', payload, timeout)

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

    async def publish_goal(self, poses: list, timeout: float = config.GOAL_ACK_TIMEOUT_S) -> dict:
        """
        Direct Nav2 dispatch via NavigateThroughPoses — publishes cmd/goal
        and waits for the bridge's goal/ack (accept/reject), same pattern
        as publish_task. Does NOT wait for the robot to finish driving the
        route — see publish_cancel_nav to stop it early, and goal/result
        (logged, not surfaced synchronously) for eventual completion.
        """
        goal_id = str(uuid.uuid4())
        payload = {'goal_id': goal_id, 'poses': poses}
        ack = await self._publish_and_wait(self._pending_goal_acks, goal_id, 'cmd/goal', payload, timeout)
        return {**ack, 'goal_id': goal_id}

    async def publish_cancel_nav(self, timeout: float = config.CANCEL_ACK_TIMEOUT_S) -> dict:
        """
        Cancels whatever NavigateThroughPoses goal is currently active on
        the robot (regardless of whether it came from cmd/goal or /tasks'
        Nav2-fallback path — the bridge tracks one shared handle). Waits
        for cancel_nav/ack; a false "cancelled" in the response is a
        legitimate, non-error outcome (nothing was running).
        """
        request_id = str(uuid.uuid4())
        payload = {'request_id': request_id}
        return await self._publish_and_wait(
            self._pending_cancel_acks, request_id, 'cmd/cancel_nav', payload, timeout
        )

    async def publish_set_pose(self, pose: dict, covariance: list | None = None):
        """
        Sets AMCL's initial pose — fire-and-forget, same as
        `ros2 topic pub -1 /initialpose ...`. /initialpose has no
        accept/reject semantics to ack, so unlike publish_goal this
        doesn't wait for anything back.
        """
        if not self.connected or self._client is None:
            raise MqttUnavailable('MQTT broker unreachable')
        payload = {'pose': pose}
        if covariance is not None:
            payload['covariance'] = covariance
        await self._client.publish(
            f'{config.TOPIC_PREFIX}/cmd/set_pose',
            json.dumps(payload),
            qos=1,
        )

    async def publish_webrtc_offer(self, sdp: str, type_: str,
                                    timeout: float = config.CAMERA_OFFER_TIMEOUT_S) -> dict:
        """
        Relays a browser's WebRTC SDP offer to the robot over MQTT (topic
        cmd/webrtc_offer) and waits for the bridge's webrtc/answer — same
        publish-then-wait-for-ack shape as publish_goal/publish_cancel_nav.

        Replaces a direct HTTP call this process used to make straight to
        hive_camera_bridge's signaling port: that only worked when both
        processes shared a host/LAN. Once the gateway and the robot are on
        separate networks (see README's AWS section), MQTT is the only link
        between them — this rides that same link, matching every other
        command here. Only the one-time SDP text exchange goes through this
        path; the actual video stream (RTP) never does, it flows directly
        between the browser and hive_camera_bridge once negotiation
        finishes.

        Returns {"sdp": ..., "type": ...} on success. The bridge reports
        camera-bridge-unreachable-on-the-robot-side as {"error": "..."} in
        the SAME ack (not an AckTimeout) — see the ValueError raise below.
        """
        offer_id = str(uuid.uuid4())
        payload = {'offer_id': offer_id, 'sdp': sdp, 'type': type_}
        ack = await self._publish_and_wait(
            self._pending_webrtc_acks, offer_id, 'cmd/webrtc_offer', payload, timeout
        )
        if 'error' in ack:
            raise ValueError(ack['error'])
        return ack
