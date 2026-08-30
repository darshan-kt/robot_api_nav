#!/usr/bin/env python3
"""
hive_mqtt_bridge — the ONLY place rclpy and MQTT coexist.

Bridges ROS 2 topics/actions <-> MQTT so backend/hive_api_gateway (FastAPI)
never has to import rclpy, run inside a colcon workspace, or share a DDS
domain with the robot. Everything this node does used to live inside
hive_api_gateway's ApiNode — same subscriptions, same action clients, same
cached-latest-value pattern — just re-pointed at MQTT instead of FastAPI's
in-process WebSocket handlers.

Topic tree (prefix "hive/<ROBOT_ID>/", ROBOT_ID from env, default "robot-1"):

  State (bridge -> broker -> gateway):
    telemetry     {type, x, y, theta}                          QoS0
    localisation  {type, x, y, yaw, frame_id, age_s}            QoS0, retained
    plan          {type, frame_id, age_s, points[]}             QoS0
    scan          {type, frame_id, angle_*, ranges[]}           QoS0, ~1Hz always-on
    health        {ros_ready, robot_alive, topics{...}}         QoS1, retained (+ LWT)
    task/ack      {task_id, accepted, behavior, nav_mode, ...}  QoS1 (reply to cmd/task)
    task/result   {task_id, success, outcome_text}              QoS1

  Commands (gateway -> broker -> bridge):
    cmd/task         mission dispatch (was POST /tasks)               QoS1
    cmd/velocity     teleop {linear, angular} (was /api/velocity_ctrl) QoS0
    cmd/goal         direct Nav2 dispatch (was POST /nav_goal)         QoS1
    cmd/cancel_nav   cancel active nav goal (was POST /cancel_nav)     QoS1
    cmd/set_pose     set AMCL initial pose (was POST /set_pose)        QoS1
    cmd/webrtc_offer relay a browser's SDP offer to the local camera
                     bridge over plain HTTP (localhost, same container/
                     host — see _handle_cmd_webrtc_offer) and publish
                     its answer back on webrtc/answer. Exists because
                     the gateway (backend/hive_api_gateway) may now be
                     on a completely different network than the robot
                     (see README's AWS section) — it can no longer
                     reach hive_camera_bridge's signaling port directly
                     the way it could when everything shared one host.
                     MQTT already crosses that gap reliably (the robot
                     dials OUT to the broker, same as every other
                     topic here), so signaling rides it too. The actual
                     video (RTP) still flows directly between the
                     browser and hive_camera_bridge once this
                     handshake completes — MQTT only ever carries the
                     one-time SDP text exchange, never the media.
    webrtc/answer    {offer_id, sdp, type} or {offer_id, error}     QoS1 (reply to cmd/webrtc_offer)

Poses inside cmd/task are already map-frame (metres + quaternion) — pixel<->map
conversion is pure math with no ROS dependency and stays in the gateway
(backend/hive_api_gateway/app/geometry.py). This node only ever deals with
ROS message construction, never coordinate math.
"""
import json
import math
import os
import threading
import time
import urllib.error
import urllib.request
import uuid

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.qos import QoSProfile, QoSDurabilityPolicy, QoSReliabilityPolicy

from nav2_msgs.action import NavigateThroughPoses
from hive_interfaces.action import ExecuteBehavior
from geometry_msgs.msg import PoseStamped, Twist
from nav_msgs.msg import OccupancyGrid, Odometry, Path as NavPath
from sensor_msgs.msg import Image, LaserScan
from geometry_msgs.msg import PoseWithCovarianceStamped

import paho.mqtt.client as mqtt

# =============================================================================
# Config (env vars — set by docker-compose)
# =============================================================================
ROBOT_ID     = os.environ.get('ROBOT_ID', 'robot-1')
MQTT_HOST    = os.environ.get('MQTT_HOST', 'localhost')
MQTT_PORT    = int(os.environ.get('MQTT_PORT', '1883'))
MQTT_USER    = os.environ.get('MQTT_USERNAME') or None
MQTT_PASS    = os.environ.get('MQTT_PASSWORD') or None
TOPIC_PREFIX = f'hive/{ROBOT_ID}'

# hive_camera_bridge's WebRTC signaling port — same container/host as this
# node (see cmd/webrtc_offer above), so "localhost" is always correct here
# regardless of where the gateway itself is running.
CAMERA_SIGNALING_PORT  = int(os.environ.get('CAMERA_SIGNALING_PORT', '8766'))
_CAMERA_OFFER_TIMEOUT_S = 5.0

# Teleop safety limits — same clamp the old gateway applied, now enforced at
# the point closest to /cmd_vel (defense in depth: even a compromised or
# buggy publisher on the broker can't exceed these).
_TELEOP_MAX_LINEAR  = 0.8   # m/s
_TELEOP_MAX_ANGULAR = 1.0   # rad/s

# If no cmd/velocity frame arrives within this window AND the last command
# was non-zero, zero /cmd_vel here too. The gateway already runs its own
# 400ms deadman on the browser WebSocket; this is the second half of that
# watchdog, re-anchored to MQTT connectivity instead of WebSocket
# connectivity, so a broker/network hiccup between gateway and bridge can't
# leave the robot creeping.
_CMD_VEL_WATCHDOG_S = 0.5

# Default /initialpose covariance for cmd/set_pose when the caller doesn't
# supply one — the SAME 6x6 row-major values turtlebot_mcp_ros2's own
# entrypoint_sim.sh already publishes to auto-set AMCL's estimate on sim
# boot (moderate x/y uncertainty, ~15° yaw std dev). AMCL only needs a
# reasonable starting point; it converges from here via scan matching.
_DEFAULT_INITIAL_POSE_COVARIANCE = (
    0.25, 0.0,  0.0, 0.0, 0.0, 0.0,
    0.0,  0.25, 0.0, 0.0, 0.0, 0.0,
    0.0,  0.0,  0.0, 0.0, 0.0, 0.0,
    0.0,  0.0,  0.0, 0.0, 0.0, 0.0,
    0.0,  0.0,  0.0, 0.0, 0.0, 0.0,
    0.0,  0.0,  0.0, 0.0, 0.0, 0.0685,
)


def _topic(suffix: str) -> str:
    return f'{TOPIC_PREFIX}/{suffix}'


# =============================================================================
# Goal-building helpers (ported unchanged from the old ApiNode / main.py —
# these shape the ROS goal, so they live here, not in the gateway)
# =============================================================================

def _dict_to_pose_stamped(pose_dict: dict) -> PoseStamped:
    ps  = PoseStamped()
    ps.header.frame_id = pose_dict.get('header', {}).get('frame_id', 'map')
    pos = pose_dict.get('pose', {}).get('position',    {})
    ori = pose_dict.get('pose', {}).get('orientation', {})
    ps.pose.position.x    = float(pos.get('x', 0.0))
    ps.pose.position.y    = float(pos.get('y', 0.0))
    ps.pose.position.z    = float(pos.get('z', 0.0))
    ps.pose.orientation.x = float(ori.get('x', 0.0))
    ps.pose.orientation.y = float(ori.get('y', 0.0))
    ps.pose.orientation.z = float(ori.get('z', 0.0))
    ps.pose.orientation.w = float(ori.get('w', 1.0))
    return ps


def _first_pose_stamped(poses: list) -> PoseStamped:
    if not poses:
        return PoseStamped()
    return _dict_to_pose_stamped(poses[0])


def _poses_to_flat_waypoints(poses: list) -> list:
    """PoseStamped-dict list -> flat waypoint dicts for runner.cpp / IterateWaypoints."""
    result = []
    for p in poses:
        header   = p.get('header', {})
        pose     = p.get('pose', {})
        position = pose.get('position', {})
        orient   = pose.get('orientation', {})
        result.append({
            'x':     float(position.get('x', 0.0)),
            'y':     float(position.get('y', 0.0)),
            'z':     float(position.get('z', 0.0)),
            'qx':    float(orient.get('x', 0.0)),
            'qy':    float(orient.get('y', 0.0)),
            'qz':    float(orient.get('z', 0.0)),
            'qw':    float(orient.get('w', 1.0)),
            'frame': header.get('frame_id', 'map'),
        })
    return result


def _build_json_payload(payload: dict, poses: list) -> str:
    raw_jp = payload.get('json_payload', '')
    if isinstance(raw_jp, str) and raw_jp.strip():
        try:    config = json.loads(raw_jp)
        except: config = {}
    elif isinstance(raw_jp, dict):
        config = dict(raw_jp)
    else:
        config = {}

    for key in ('speed', 'priority', 'pause_ms'):
        if key in payload:
            config[key] = payload[key]
    config.setdefault('priority', 'normal')
    config.setdefault('pause_ms', 500)

    if poses:
        config['waypoints'] = _poses_to_flat_waypoints(poses)

    return json.dumps(config)


# =============================================================================
# ROS 2 node
# =============================================================================

class BridgeNode(Node):
    def __init__(self):
        super().__init__('hive_mqtt_bridge')

        # ── ROS I/O (ported from hive_api_gateway's ApiNode) ────────────────
        self.client              = ActionClient(self, ExecuteBehavior, '/hive/execute_behavior')
        # Direct Nav2 dispatch — cmd/goal (below) and /tasks' Nav2-fallback
        # path both go through this ONE action client. Bypasses Hive/BT
        # entirely, same spirit as /cmd_vel bypassing it for teleop.
        self.nav_through_client  = ActionClient(self, NavigateThroughPoses, '/navigate_through_poses')
        self.cmd_vel_pub         = self.create_publisher(Twist, '/cmd_vel', 10)
        # AMCL initial pose — same topic RViz's "2D Pose Estimate" tool and
        # the sim's own entrypoint_sim.sh boot sequence both publish to.
        self.initial_pose_pub    = self.create_publisher(PoseWithCovarianceStamped, '/initialpose', 10)

        # Whichever NavigateThroughPoses goal is currently outstanding
        # (from either dispatch path above) — cmd/cancel_nav cancels this.
        self._nav_goal_lock         = threading.Lock()
        self._active_nav_goal_handle = None

        self._latest_pose      = None
        self._latest_pose_time = 0.0
        self._pose_lock        = threading.Lock()

        _amcl_qos = QoSProfile(
            depth=10,
            durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
            reliability=QoSReliabilityPolicy.RELIABLE,
        )
        self.create_subscription(PoseWithCovarianceStamped, '/amcl_pose', self._localization_cb, _amcl_qos)

        self._latest_plan = None
        self._plan_time   = 0.0
        self._plan_lock   = threading.Lock()
        self.create_subscription(NavPath, '/plan', self._plan_cb, 10)

        self._cmd_vel_time     = 0.0
        self._camera_image_time = 0.0
        self._alive_lock       = threading.Lock()

        _be_qos = QoSProfile(depth=5, reliability=QoSReliabilityPolicy.BEST_EFFORT)
        self._latest_scan_msg = None
        self._scan_received   = False
        self._scan_data_lock  = threading.Lock()

        self.create_subscription(LaserScan, '/scan', self._scan_cb, _be_qos)
        self.create_subscription(Twist, '/cmd_vel', self._cmd_vel_incoming_cb, _be_qos)
        self.create_subscription(Image, '/camera/image_raw', self._camera_image_cb, _be_qos)

        self._odom_x        = 0.0
        self._odom_y        = 0.0
        self._odom_yaw      = 0.0
        self._odom_received = False
        self._odom_lock     = threading.Lock()
        self.create_subscription(Odometry, '/odom', self._odom_cb, _be_qos)

        # ── Teleop watchdog state ────────────────────────────────────────────
        self._cmd_vel_lock          = threading.Lock()
        self._last_cmd_vel_time     = None
        self._last_cmd_vel_nonzero  = False

        # ── MQTT ──────────────────────────────────────────────────────────
        self._mqtt = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                                  client_id=f'hive_mqtt_bridge-{ROBOT_ID}')
        if MQTT_USER:
            self._mqtt.username_pw_set(MQTT_USER, MQTT_PASS)
        # Last Will and Testament: if this node dies or the connection drops
        # uncleanly, the broker publishes this on our behalf — subscribers
        # (the gateway) see "offline" immediately instead of waiting out a
        # staleness timeout.
        self._mqtt.will_set(
            _topic('health'),
            payload=json.dumps({'ros_ready': False, 'robot_alive': False, 'reason': 'bridge_disconnected'}),
            qos=1, retain=True,
        )
        self._mqtt.on_connect    = self._on_mqtt_connect
        self._mqtt.on_message    = self._on_mqtt_message
        self._mqtt.on_disconnect = self._on_mqtt_disconnect
        self._mqtt.reconnect_delay_set(min_delay=1, max_delay=30)

        self.get_logger().info(f'[mqtt] connecting to {MQTT_HOST}:{MQTT_PORT} as robot_id={ROBOT_ID} ...')
        self._mqtt.connect_async(MQTT_HOST, MQTT_PORT, keepalive=30)
        self._mqtt.loop_start()   # background network thread — on_message fires here

        # ── Periodic publish timers (replace the old per-WebSocket-client
        #    push loops — MQTT has no "only while someone's listening"
        #    concept for /scan the way the gateway's opt-in toggle did, so
        #    scan is now always published; the gateway applies the opt-in
        #    filter when relaying to browsers instead) ─────────────────────
        self.create_timer(1.0, self._telemetry_tick)
        self.create_timer(1.0, self._localisation_tick)
        self.create_timer(0.5, self._plan_tick)
        self.create_timer(1.0, self._scan_tick)
        self.create_timer(3.0, self._health_tick)
        self.create_timer(0.1, self._cmd_vel_watchdog_tick)

        self.get_logger().info('hive_mqtt_bridge up — subscribed to /amcl_pose, /plan, '
                                '/scan, /odom, /cmd_vel, /camera/image_raw')

    # =========================================================================
    # MQTT callbacks
    # =========================================================================

    def _on_mqtt_connect(self, client, userdata, flags, reason_code, properties=None):
        if reason_code != 0:
            self.get_logger().error(f'[mqtt] connect failed: {reason_code}')
            return
        self.get_logger().info(
            '[mqtt] connected — subscribing to cmd/task, cmd/velocity, cmd/goal, '
            'cmd/cancel_nav, cmd/set_pose, cmd/webrtc_offer'
        )
        client.subscribe(_topic('cmd/task'), qos=1)
        client.subscribe(_topic('cmd/velocity'), qos=0)
        client.subscribe(_topic('cmd/goal'), qos=1)
        client.subscribe(_topic('cmd/cancel_nav'), qos=1)
        client.subscribe(_topic('cmd/set_pose'), qos=1)
        client.subscribe(_topic('cmd/webrtc_offer'), qos=1)

    def _on_mqtt_disconnect(self, client, userdata, disconnect_flags, reason_code, properties=None):
        self.get_logger().warning(f'[mqtt] disconnected (reason={reason_code}) — paho will auto-reconnect')

    def _on_mqtt_message(self, client, userdata, msg):
        if msg.topic == _topic('cmd/task'):
            # Action-client calls (wait_for_server, send_goal_async) can block
            # briefly — never block paho's network thread with them, or
            # cmd/velocity frames queue up behind a slow/unavailable Hive
            # server check.
            threading.Thread(target=self._handle_cmd_task, args=(msg.payload,), daemon=True).start()
        elif msg.topic == _topic('cmd/velocity'):
            self._handle_cmd_velocity(msg.payload)
        elif msg.topic == _topic('cmd/goal'):
            # Same blocking-call concern as cmd/task above (wait_for_server).
            threading.Thread(target=self._handle_cmd_goal, args=(msg.payload,), daemon=True).start()
        elif msg.topic == _topic('cmd/cancel_nav'):
            # cancel_goal_async() is non-blocking — safe to call inline.
            self._handle_cmd_cancel_nav(msg.payload)
        elif msg.topic == _topic('cmd/set_pose'):
            # Plain message construction + publish — no blocking calls.
            self._handle_cmd_set_pose(msg.payload)
        elif msg.topic == _topic('cmd/webrtc_offer'):
            # Blocking local HTTP call (urllib) to hive_camera_bridge — same
            # "never block paho's network thread" concern as cmd/task/cmd/goal.
            threading.Thread(target=self._handle_cmd_webrtc_offer, args=(msg.payload,), daemon=True).start()

    def _mqtt_publish(self, suffix: str, payload: dict, qos: int = 0, retain: bool = False):
        try:
            self._mqtt.publish(_topic(suffix), json.dumps(payload), qos=qos, retain=retain)
        except Exception as exc:
            self.get_logger().warning(f'[mqtt] publish {suffix} failed: {exc}')

    # =========================================================================
    # cmd/task — mission dispatch (was POST /tasks)
    # =========================================================================

    def _handle_cmd_task(self, raw_payload: bytes):
        try:
            payload = json.loads(raw_payload)
        except ValueError:
            self.get_logger().warning('[cmd/task] invalid JSON, dropping')
            return

        task_id = payload.get('task_id') or str(uuid.uuid4())
        bid     = int(payload.get('id', 0))
        poses   = payload.get('poses', [])  # already map-frame — gateway did the pixel conversion

        self.get_logger().info(
            f'[cmd/task] id={bid} behavior={payload.get("behavior_name","")} '
            f'task={task_id} poses={len(poses)}'
        )

        hive_available = self.client.wait_for_server(timeout_sec=3.0)

        if hive_available:
            goal               = ExecuteBehavior.Goal()
            goal.id            = bid
            goal.task_id       = task_id
            goal.behavior_name = payload.get('behavior_name', '')
            goal.json_payload  = _build_json_payload(payload, poses)
            if bid == 21 and poses:
                goal.pose = _first_pose_stamped(poses)

            send_goal_future = self.client.send_goal_async(goal)
            send_goal_future.add_done_callback(
                lambda fut: self._on_hive_goal_response(fut, task_id, goal, poses, bid)
            )
            return

        # ── Fallback: Nav2 NavigateThroughPoses ──────────────────────────────
        self.get_logger().info('[cmd/task] Hive unavailable — falling back to Nav2 NavigateThroughPoses')

        if not poses:
            self._mqtt_publish('task/ack', {
                'task_id': task_id, 'accepted': False,
                'detail': 'Hive server unavailable and no waypoints to navigate',
            }, qos=1)
            return

        if not self.nav_through_client.wait_for_server(timeout_sec=3.0):
            self._mqtt_publish('task/ack', {
                'task_id': task_id, 'accepted': False,
                'detail': 'Neither Hive nor Nav2 NavigateThroughPoses is available',
            }, qos=1)
            return

        nav_goal = NavigateThroughPoses.Goal()
        nav_goal.poses = [_dict_to_pose_stamped(p) for p in poses]
        nav_goal.behavior_tree = ''

        send_goal_future = self.nav_through_client.send_goal_async(nav_goal)
        send_goal_future.add_done_callback(
            lambda fut: self._on_nav2_goal_response(fut, task_id, poses)
        )

    def _on_hive_goal_response(self, fut, task_id, goal, poses, bid):
        gh = fut.result()
        if gh is None or not gh.accepted:
            self._mqtt_publish('task/ack', {'task_id': task_id, 'accepted': False,
                                             'detail': 'Hive goal rejected'}, qos=1)
            return
        self.get_logger().info(f'[cmd/task] Hive goal accepted (task={task_id})')
        self._mqtt_publish('task/ack', {
            'task_id':        task_id,
            'accepted':       True,
            'behavior':       goal.behavior_name or f'id_{goal.id}',
            'waypoint_count': len(poses) if bid in (21, 22) else None,
            'nav_mode':       'hive',
        }, qos=1)

        result_future = gh.get_result_async()
        result_future.add_done_callback(lambda rf: self._on_hive_result(task_id, rf))

    def _on_hive_result(self, task_id, result_future):
        try:
            result = result_future.result().result
            self._mqtt_publish('task/result', {
                'task_id':      task_id,
                'success':      bool(result.success),
                'outcome_text': result.outcome_text,
            }, qos=1)
        except Exception as exc:
            self.get_logger().warning(f'[task/result] could not fetch result for {task_id}: {exc}')

    def _on_nav2_goal_response(self, fut, task_id, poses):
        gh = fut.result()
        if gh is None or not gh.accepted:
            self._mqtt_publish('task/ack', {'task_id': task_id, 'accepted': False,
                                             'detail': 'Nav2 goal rejected'}, qos=1)
            return
        self.get_logger().info(f'[cmd/task] Nav2 goal accepted (task={task_id})')
        self._mqtt_publish('task/ack', {
            'task_id':        task_id,
            'accepted':       True,
            'behavior':       'NavigateThroughPoses',
            'waypoint_count': len(poses),
            'nav_mode':       'nav2_direct',
        }, qos=1)
        # Same action client cmd/goal uses below — track it so cmd/cancel_nav
        # can cancel a /tasks-triggered Nav2 fallback too, not just cmd/goal.
        self._track_active_nav_goal(gh)

    # =========================================================================
    # Shared NavigateThroughPoses goal tracking — cmd/goal (below) and the
    # /tasks Nav2-fallback path above both dispatch through the SAME action
    # client, so cmd/cancel_nav needs one shared "what's currently active"
    # slot rather than two, or it'd only ever be able to cancel whichever
    # path happened to run last.
    # =========================================================================

    def _track_active_nav_goal(self, goal_handle, on_result=None):
        with self._nav_goal_lock:
            self._active_nav_goal_handle = goal_handle

        def _on_done(result_future):
            with self._nav_goal_lock:
                if self._active_nav_goal_handle is goal_handle:
                    self._active_nav_goal_handle = None
            if on_result:
                on_result(result_future)

        goal_handle.get_result_async().add_done_callback(_on_done)

    # =========================================================================
    # cmd/velocity — teleop (was /api/velocity_ctrl)
    # =========================================================================

    def _handle_cmd_velocity(self, raw_payload: bytes):
        try:
            data = json.loads(raw_payload)
        except ValueError:
            return

        lin = max(-_TELEOP_MAX_LINEAR,  min(_TELEOP_MAX_LINEAR,  float(data.get('linear',  0.0))))
        ang = max(-_TELEOP_MAX_ANGULAR, min(_TELEOP_MAX_ANGULAR, float(data.get('angular', 0.0))))

        self.publish_cmd_vel(lin, ang)
        with self._cmd_vel_lock:
            self._last_cmd_vel_time    = time.monotonic()
            self._last_cmd_vel_nonzero = (lin != 0.0 or ang != 0.0)

    def _cmd_vel_watchdog_tick(self):
        with self._cmd_vel_lock:
            if not self._last_cmd_vel_nonzero or self._last_cmd_vel_time is None:
                return
            stale = (time.monotonic() - self._last_cmd_vel_time) > _CMD_VEL_WATCHDOG_S
        if stale:
            self.get_logger().warning(
                f'[cmd/velocity] no frame in {_CMD_VEL_WATCHDOG_S * 1000:.0f}ms — '
                f'zeroing /cmd_vel (bridge-side deadman, MQTT link may be down)'
            )
            self.publish_cmd_vel(0.0, 0.0)
            with self._cmd_vel_lock:
                self._last_cmd_vel_nonzero = False

    def publish_cmd_vel(self, linear_x: float, angular_z: float):
        msg = Twist()
        msg.linear.x  = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_vel_pub.publish(msg)

    # =========================================================================
    # cmd/goal — direct Nav2 dispatch via NavigateThroughPoses (was a plain
    # `ros2 topic pub -1 /goal_pose ...`; replaced because /goal_pose only
    # ever takes ONE pose, and this needs to carry a whole waypoint route in
    # one call — the same array NavigateThroughPoses already expects):
    #
    #     ros2 action send_goal /navigate_through_poses \
    #       nav2_msgs/action/NavigateThroughPoses "{poses: [...]}"
    #
    # Bypasses Hive/BT entirely, same as cmd/velocity does for /cmd_vel.
    # Unlike cmd/velocity, this DOES ack (goal/ack) — an action has real
    # accept/reject semantics worth surfacing, unlike a raw topic publish.
    # It does NOT wait for the robot to finish driving the route; that's
    # reported separately on goal/result. Use cmd/cancel_nav to stop early.
    # =========================================================================

    def _handle_cmd_goal(self, raw_payload: bytes):
        try:
            payload = json.loads(raw_payload)
        except ValueError:
            self.get_logger().warning('[cmd/goal] invalid JSON, dropping')
            return

        goal_id = payload.get('goal_id') or str(uuid.uuid4())
        poses   = payload.get('poses', [])  # already map-frame — gateway did the pixel conversion

        if not poses:
            self._mqtt_publish('goal/ack', {'goal_id': goal_id, 'accepted': False,
                                             'detail': 'No poses provided'}, qos=1)
            return

        if not self.nav_through_client.wait_for_server(timeout_sec=3.0):
            self._mqtt_publish('goal/ack', {'goal_id': goal_id, 'accepted': False,
                                             'detail': 'Nav2 NavigateThroughPoses unavailable'}, qos=1)
            return

        nav_goal = NavigateThroughPoses.Goal()
        nav_goal.poses = [_dict_to_pose_stamped(p) for p in poses]
        nav_goal.behavior_tree = ''

        self.get_logger().info(f'[cmd/goal] dispatching {len(poses)} waypoint(s), goal={goal_id}')

        send_goal_future = self.nav_through_client.send_goal_async(nav_goal)
        send_goal_future.add_done_callback(
            lambda fut: self._on_direct_nav_goal_response(fut, goal_id, len(poses))
        )

    def _on_direct_nav_goal_response(self, fut, goal_id, waypoint_count):
        gh = fut.result()
        if gh is None or not gh.accepted:
            self._mqtt_publish('goal/ack', {'goal_id': goal_id, 'accepted': False,
                                             'detail': 'Nav2 goal rejected'}, qos=1)
            return

        self.get_logger().info(f'[cmd/goal] NavigateThroughPoses accepted (goal={goal_id})')
        self._mqtt_publish('goal/ack', {
            'goal_id':        goal_id,
            'accepted':       True,
            'waypoint_count': waypoint_count,
        }, qos=1)

        self._track_active_nav_goal(
            gh, on_result=lambda rf: self._on_direct_nav_result(goal_id, rf)
        )

    def _on_direct_nav_result(self, goal_id, result_future):
        try:
            result = result_future.result()
            self._mqtt_publish('goal/result', {
                'goal_id': goal_id,
                'status':  result.status,   # action_msgs/GoalStatus constants
            }, qos=1)
        except Exception as exc:
            self.get_logger().warning(f'[goal/result] could not fetch result for {goal_id}: {exc}')

    # =========================================================================
    # cmd/cancel_nav — cancel whatever NavigateThroughPoses goal is active
    # (was `ros2 action cancel /navigate_through_poses`). Cancels regardless
    # of whether it came from cmd/goal or /tasks' Nav2-fallback path — see
    # _track_active_nav_goal above. A no-op is reported honestly (cancelled:
    # false) rather than silently, so the operator knows nothing was running.
    # =========================================================================

    def _handle_cmd_cancel_nav(self, raw_payload: bytes):
        try:
            payload = json.loads(raw_payload) if raw_payload else {}
        except ValueError:
            payload = {}
        request_id = payload.get('request_id')

        with self._nav_goal_lock:
            gh = self._active_nav_goal_handle

        if gh is None:
            self._mqtt_publish('cancel_nav/ack', {
                'request_id': request_id, 'cancelled': False,
                'detail': 'No active NavigateThroughPoses goal to cancel',
            }, qos=1)
            return

        self.get_logger().info(f'[cmd/cancel_nav] cancelling active goal (request={request_id})')
        cancel_future = gh.cancel_goal_async()

        def _on_cancel_done(fut):
            try:
                response = fut.result()
                cancelled = len(response.goals_canceling) > 0
            except Exception as exc:
                self.get_logger().warning(f'[cmd/cancel_nav] cancel request failed: {exc}')
                cancelled = False
            self.get_logger().info(f'[cmd/cancel_nav] {"cancelled" if cancelled else "not cancelled"}')
            self._mqtt_publish('cancel_nav/ack', {
                'request_id': request_id, 'cancelled': cancelled,
            }, qos=1)

        cancel_future.add_done_callback(_on_cancel_done)

    # =========================================================================
    # cmd/set_pose — set AMCL's initial pose (was `ros2 topic pub -1
    # /initialpose ...`). Fire-and-forget like the old cmd/goal topic
    # publish used to be — /initialpose has no accept/reject semantics to
    # ack, it's just a topic AMCL listens to. Same mechanism RViz's "2D
    # Pose Estimate" tool and the sim's own entrypoint_sim.sh both use.
    # =========================================================================

    def _handle_cmd_set_pose(self, raw_payload: bytes):
        try:
            payload = json.loads(raw_payload)
        except ValueError:
            self.get_logger().warning('[cmd/set_pose] invalid JSON, dropping')
            return

        pose_dict = payload.get('pose')
        if not pose_dict:
            self.get_logger().warning('[cmd/set_pose] missing "pose", dropping')
            return

        inner = pose_dict.get('pose', {})
        pos   = inner.get('position', {})
        ori   = inner.get('orientation', {})

        msg = PoseWithCovarianceStamped()
        msg.header.frame_id = pose_dict.get('header', {}).get('frame_id', 'map')
        msg.header.stamp    = self.get_clock().now().to_msg()
        msg.pose.pose.position.x    = float(pos.get('x', 0.0))
        msg.pose.pose.position.y    = float(pos.get('y', 0.0))
        msg.pose.pose.position.z    = float(pos.get('z', 0.0))
        msg.pose.pose.orientation.x = float(ori.get('x', 0.0))
        msg.pose.pose.orientation.y = float(ori.get('y', 0.0))
        msg.pose.pose.orientation.z = float(ori.get('z', 0.0))
        msg.pose.pose.orientation.w = float(ori.get('w', 1.0))

        covariance = payload.get('covariance')
        if covariance and len(covariance) == 36:
            msg.pose.covariance = [float(v) for v in covariance]
        else:
            msg.pose.covariance = list(_DEFAULT_INITIAL_POSE_COVARIANCE)

        self.initial_pose_pub.publish(msg)
        self.get_logger().info(
            f'[cmd/set_pose] published /initialpose x={msg.pose.pose.position.x:.3f} '
            f'y={msg.pose.pose.position.y:.3f} frame={msg.header.frame_id}'
        )

    # =========================================================================
    # cmd/webrtc_offer — relay a browser's SDP offer to hive_camera_bridge's
    # local signaling HTTP server and publish its answer back on
    # webrtc/answer. See the module docstring's topic tree for why this
    # exists (the gateway can no longer reach the camera bridge directly
    # once they're split across networks — MQTT already crosses that gap
    # for everything else, so signaling rides it too; the video itself
    # never does).
    # =========================================================================

    def _handle_cmd_webrtc_offer(self, raw_payload: bytes):
        try:
            payload = json.loads(raw_payload)
        except ValueError:
            self.get_logger().warning('[cmd/webrtc_offer] invalid JSON, dropping')
            return

        offer_id = payload.get('offer_id')
        sdp      = payload.get('sdp')
        sdp_type = payload.get('type', 'offer')

        if not offer_id or not sdp:
            self.get_logger().warning('[cmd/webrtc_offer] missing offer_id/sdp, dropping')
            return

        self.get_logger().info(f'[cmd/webrtc_offer] relaying to local camera bridge (offer={offer_id})')

        body = json.dumps({'sdp': sdp, 'type': sdp_type}).encode('utf-8')
        req = urllib.request.Request(
            f'http://localhost:{CAMERA_SIGNALING_PORT}/offer',
            data=body,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=_CAMERA_OFFER_TIMEOUT_S) as resp:
                answer = json.loads(resp.read())
            self._mqtt_publish('webrtc/answer', {
                'offer_id': offer_id, 'sdp': answer['sdp'], 'type': answer['type'],
            }, qos=1)
            self.get_logger().info(f'[cmd/webrtc_offer] answered (offer={offer_id})')
        except (urllib.error.URLError, OSError, ValueError, KeyError) as exc:
            self.get_logger().warning(f'[cmd/webrtc_offer] camera bridge unreachable: {exc}')
            self._mqtt_publish('webrtc/answer', {
                'offer_id': offer_id,
                'error': f'camera bridge unreachable on robot: {exc}',
            }, qos=1)

    # =========================================================================
    # ROS subscriptions -> cached state (unchanged from ApiNode)
    # =========================================================================

    def _localization_cb(self, msg: PoseWithCovarianceStamped):
        pose_dict = {
            'frame_id': msg.header.frame_id,
            'position': {'x': msg.pose.pose.position.x, 'y': msg.pose.pose.position.y, 'z': msg.pose.pose.position.z},
            'orientation': {
                'x': msg.pose.pose.orientation.x, 'y': msg.pose.pose.orientation.y,
                'z': msg.pose.pose.orientation.z, 'w': msg.pose.pose.orientation.w,
            },
        }
        with self._pose_lock:
            self._latest_pose      = pose_dict
            self._latest_pose_time = time.monotonic()

    def get_localization(self) -> dict | None:
        """No staleness cutoff: AMCL only republishes on motion, so a stationary
        robot's last pose IS its current pose. age_s lets subscribers judge
        freshness themselves."""
        with self._pose_lock:
            if self._latest_pose is None:
                return None
            age = time.monotonic() - self._latest_pose_time
            return {**self._latest_pose, 'age_s': round(age, 2)}

    def _plan_cb(self, msg: NavPath):
        n = len(msg.poses)
        stride = max(1, n // 400)
        points = [{'x': round(p.pose.position.x, 3), 'y': round(p.pose.position.y, 3)}
                  for p in msg.poses[::stride]]
        if n > 0 and stride > 1:
            last = msg.poses[-1].pose.position
            points.append({'x': round(last.x, 3), 'y': round(last.y, 3)})
        with self._plan_lock:
            self._latest_plan = {'frame_id': msg.header.frame_id, 'points': points}
            self._plan_time   = time.monotonic()

    def get_plan(self) -> dict | None:
        with self._plan_lock:
            if self._latest_plan is None:
                return None
            age = time.monotonic() - self._plan_time
            if age > 15.0:
                return None
            return {**self._latest_plan, 'age_s': round(age, 2)}

    def _scan_cb(self, msg: LaserScan):
        with self._alive_lock:
            self._scan_time = time.monotonic()
        with self._scan_data_lock:
            self._latest_scan_msg = msg
            self._scan_received   = True

    def _cmd_vel_incoming_cb(self, msg: Twist):
        with self._alive_lock:
            self._cmd_vel_time = time.monotonic()

    def _camera_image_cb(self, msg: Image):
        with self._alive_lock:
            self._camera_image_time = time.monotonic()

    def get_scan(self) -> dict | None:
        with self._scan_data_lock:
            if not self._scan_received:
                return None
            msg = self._latest_scan_msg
        ranges = [round(r, 3) if math.isfinite(r) else None for r in msg.ranges]
        return {
            'frame_id':        msg.header.frame_id,
            'angle_min':       round(msg.angle_min,       4),
            'angle_max':       round(msg.angle_max,       4),
            'angle_increment': round(msg.angle_increment, 6),
            'range_min':       round(msg.range_min,       3),
            'range_max':       round(msg.range_max,       3),
            'ranges':          ranges,
        }

    def is_robot_alive(self, max_age: float = 5.0) -> dict:
        now = time.monotonic()
        with self._alive_lock:
            cmd_vel_age    = (now - self._cmd_vel_time)      if self._cmd_vel_time      > 0 else None
            scan_age       = (now - self._scan_time)          if self._scan_time         > 0 else None
            camera_age     = (now - self._camera_image_time)  if self._camera_image_time > 0 else None
        cmd_vel_ok    = cmd_vel_age  is not None and cmd_vel_age  < max_age
        scan_ok       = scan_age     is not None and scan_age     < max_age
        camera_ok     = camera_age   is not None and camera_age   < max_age
        return {
            'alive':              cmd_vel_ok or scan_ok or camera_ok,
            'cmd_vel_age_s':      round(cmd_vel_age,  2) if cmd_vel_age  is not None else None,
            'scan_age_s':         round(scan_age,     2) if scan_age     is not None else None,
            'camera_image_age_s': round(camera_age,   2) if camera_age   is not None else None,
        }

    def _odom_cb(self, msg: Odometry):
        qz  = msg.pose.pose.orientation.z
        qw  = msg.pose.pose.orientation.w
        yaw = 2.0 * math.atan2(qz, qw)
        with self._odom_lock:
            self._odom_x        = msg.pose.pose.position.x
            self._odom_y        = msg.pose.pose.position.y
            self._odom_yaw      = yaw
            self._odom_received = True

    def get_odom(self) -> dict | None:
        with self._odom_lock:
            if not self._odom_received:
                return None
            return {'x': round(self._odom_x, 3), 'y': round(self._odom_y, 3), 'yaw': round(self._odom_yaw, 4)}

    # =========================================================================
    # Periodic MQTT publish ticks
    # =========================================================================

    def _telemetry_tick(self):
        odom = self.get_odom()
        if odom:
            self._mqtt_publish('telemetry', {'type': 'telemetry', 'x': odom['x'], 'y': odom['y'], 'theta': odom['yaw']})

    def _localisation_tick(self):
        loc = self.get_localization()
        if not loc:
            return
        q = loc['orientation']
        yaw = math.atan2(2.0 * (q['w'] * q['z'] + q['x'] * q['y']),
                          1.0 - 2.0 * (q['y'] ** 2 + q['z'] ** 2))
        self._mqtt_publish('localisation', {
            'type': 'localisation', 'x': loc['position']['x'], 'y': loc['position']['y'],
            'yaw': yaw, 'frame_id': loc['frame_id'], 'age_s': loc['age_s'],
        }, retain=True)

    def _plan_tick(self):
        plan = self.get_plan()
        if plan:
            self._mqtt_publish('plan', {'type': 'plan', **plan})
        else:
            self._mqtt_publish('plan', {'type': 'plan', 'frame_id': 'map', 'age_s': None, 'points': []})

    def _scan_tick(self):
        scan = self.get_scan()
        if scan:
            self._mqtt_publish('scan', {'type': 'scan', **scan})

    def _health_tick(self):
        status = self.is_robot_alive()
        self._mqtt_publish('health', {
            'ros_ready':   True,
            'robot_alive': status['alive'],
            'topics': {
                '/cmd_vel':          status['cmd_vel_age_s'],
                '/scan':             status['scan_age_s'],
                '/camera/image_raw': status['camera_image_age_s'],
            },
        }, qos=1, retain=True)

    def destroy_node(self):
        self._mqtt.loop_stop()
        self._mqtt.disconnect()
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = BridgeNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
