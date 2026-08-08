#!/usr/bin/env python3
"""
hive_camera_bridge — streams a ROS 2 camera topic to the browser over WebRTC.

Subscribes to sensor_msgs/Image (default /camera/image_raw — the RGB feed
from the turtlebot3_burger_cam Gazebo model, see turtlebot_mcp_ros2's
docker-compose.yml) and exposes an aiohttp HTTP server with one endpoint,
POST /offer, implementing WebRTC's standard SDP offer/answer exchange.

The browser never talks to this node directly, and neither does the gateway
anymore: hive_mqtt_bridge (same container/host as this node) relays the SDP
offer in over MQTT (cmd/webrtc_offer) and calls POST /offer here over plain
localhost HTTP, then publishes the answer back out (webrtc/answer) — see
that node's _handle_cmd_webrtc_offer. This exists because the gateway
(backend/hive_api_gateway) may run on a completely different network than
the robot (see README's AWS section), so a direct HTTP call from the
gateway to this port no longer reaches anywhere; MQTT already crosses that
gap for every other command, so signaling rides it too. What's different
from the MQTT path: once signaling completes, the actual video (RTP) flows
directly between the browser and this node over an ICE-negotiated path — it
does NOT go through the gateway, hive_mqtt_bridge, or the MQTT broker. MQTT
is not built for bulk real-time media; WebRTC's whole design is a signaling
channel (arbitrarily proxyable) plus a separate, direct media transport.
This node is where rclpy and aiortc are the only place both need to
coexist — same "boundary node" shape as hive_mqtt_bridge, different
protocol on the far side.
"""
import asyncio
import os
import threading

import numpy as np
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, QoSReliabilityPolicy
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

import av
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack

CAMERA_TOPIC   = os.environ.get('CAMERA_TOPIC', '/camera/image_raw')
SIGNALING_PORT = int(os.environ.get('CAMERA_SIGNALING_PORT', '8766'))
TARGET_FPS     = float(os.environ.get('CAMERA_FPS', '15'))


class RosFrameSource:
    """
    Thread-safe latest-frame handoff between rclpy's callback thread (main
    thread, where rclpy.spin() runs) and the asyncio loop the WebRTC tracks
    run on (a background thread — aiortc/aiohttp are asyncio-native and
    need their own loop, separate from rclpy's executor). Same
    cross-thread cached-latest-value pattern hive_mqtt_bridge uses for its
    telemetry/localisation state, just holding a numpy frame instead of a
    dict.
    """

    def __init__(self):
        self._lock  = threading.Lock()
        self._frame: np.ndarray | None = None

    def set(self, frame: np.ndarray) -> None:
        with self._lock:
            self._frame = frame

    def get(self) -> np.ndarray | None:
        with self._lock:
            return self._frame


class CameraTrack(VideoStreamTrack):
    """
    One instance per viewer (aiortc peer connections are 1:1), but every
    instance reads the same RosFrameSource — N browsers watching costs one
    ROS subscription and one frame buffer, not N.
    """

    def __init__(self, source: RosFrameSource):
        super().__init__()
        self._source = source
        self._frame_interval = 1.0 / TARGET_FPS

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        frame = self._source.get()
        if frame is None:
            # Nothing published yet (Gazebo/camera plugin still coming up,
            # or CAMERA_TOPIC is wrong) — send a black placeholder rather
            # than blocking, so the peer connection stays alive and the
            # browser sees "connected, no signal" instead of a failed offer.
            frame = np.zeros((240, 320, 3), dtype=np.uint8)

        av_frame = av.VideoFrame.from_ndarray(frame, format='bgr24')
        av_frame.pts = pts
        av_frame.time_base = time_base

        # VideoStreamTrack.recv() is expected to pace itself — nothing
        # upstream throttles how often this is called otherwise.
        await asyncio.sleep(self._frame_interval)
        return av_frame


class CameraBridgeNode(Node):
    def __init__(self, source: RosFrameSource):
        super().__init__('hive_camera_bridge')
        self._source = source
        self._cv_bridge = CvBridge()

        # BEST_EFFORT + depth=1: only the latest frame ever matters here,
        # same reasoning as hive_mqtt_bridge's /scan subscription — queuing
        # stale camera frames would only add latency to a live feed.
        qos = QoSProfile(depth=1, reliability=QoSReliabilityPolicy.BEST_EFFORT)
        self.create_subscription(Image, CAMERA_TOPIC, self._on_image, qos)
        self.get_logger().info(
            f'hive_camera_bridge subscribed to {CAMERA_TOPIC}, '
            f'signaling on :{SIGNALING_PORT}, target {TARGET_FPS} fps'
        )

    def _on_image(self, msg: Image):
        try:
            frame = self._cv_bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
        except Exception as exc:
            self.get_logger().warning(f'[camera] frame conversion failed: {exc}')
            return
        self._source.set(frame)


# =============================================================================
# WebRTC signaling (aiohttp) — its own asyncio loop in a background thread,
# alongside rclpy.spin() on the main thread.
# =============================================================================

_active_connections: set[RTCPeerConnection] = set()


async def _handle_offer(request: web.Request, source: RosFrameSource) -> web.Response:
    params = await request.json()

    pc = RTCPeerConnection()
    _active_connections.add(pc)

    @pc.on('connectionstatechange')
    async def _on_state_change():
        if pc.connectionState in ('failed', 'closed', 'disconnected'):
            _active_connections.discard(pc)
            await pc.close()

    pc.addTrack(CameraTrack(source))

    offer_desc = RTCSessionDescription(sdp=params['sdp'], type=params['type'])
    await pc.setRemoteDescription(offer_desc)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.json_response({
        'sdp':  pc.localDescription.sdp,
        'type': pc.localDescription.type,
    })


async def _handle_health(request: web.Request) -> web.Response:
    return web.json_response({'status': 'ok', 'viewers': len(_active_connections)})


def _run_signaling_server(source: RosFrameSource) -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    app = web.Application()
    app.router.add_post('/offer', lambda r: _handle_offer(r, source))
    app.router.add_get('/health', _handle_health)

    async def _start():
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', SIGNALING_PORT)
        await site.start()

    loop.run_until_complete(_start())
    loop.run_forever()


def main(args=None):
    rclpy.init(args=args)
    source = RosFrameSource()

    signaling_thread = threading.Thread(
        target=_run_signaling_server, args=(source,), daemon=True,
    )
    signaling_thread.start()

    node = CameraBridgeNode(source)
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
