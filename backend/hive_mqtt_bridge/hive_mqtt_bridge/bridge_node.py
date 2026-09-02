#!/usr/bin/env python3
"""
hive_mqtt_bridge — the ONLY place rclpy and MQTT coexist.

Bridges ROS 2 topics/actions <-> MQTT so backend/hive_api_gateway (FastAPI)
never has to import rclpy, run inside a colcon workspace, or share a DDS
domain with the robot.

Topic tree (prefix "hive/<ROBOT_ID>/", ROBOT_ID from env, default "robot-1"):

  State (bridge -> broker -> gateway):
    telemetry     {type, x, y, theta}                          QoS0
    localisation  {type, x, y, yaw, frame_id, age_s}            QoS0, retained
    plan          {type, frame_id, age_s, points[]}             QoS0
    scan          {type, frame_id, angle_*, ranges[]}           QoS0, ~1Hz
    health        {ros_ready, robot_alive, topics{...}}         QoS1, retained
    task/ack      {task_id, accepted, behavior, nav_mode, ...} QoS1
    task/result   {task_id, success, outcome_text}              QoS1
    goal/ack      {goal_id, accepted, waypoint_count, nav_mode} QoS1
    goal/result   {goal_id, status}                             QoS1
    cancel_nav/ack {request_id, cancelled, ...}                 QoS1
    webrtc/answer {offer_id, sdp, type} or {offer_id, error}     QoS1

  Commands (gateway -> broker -> bridge):
    cmd/task         mission dispatch
    cmd/velocity     teleop {linear, angular}
    cmd/goal         direct Nav2 dispatch (NavigateThroughPoses, with a
                     /goal_pose fallback — see _handle_cmd_goal)
    cmd/cancel_nav   cancel active nav goal
    cmd/set_pose     set AMCL initial pose
    cmd/webrtc_offer relay browser SDP offer to local camera bridge

Poses inside cmd/task/cmd/goal/cmd/set_pose are already map-frame data.
Coordinate conversion stays in the gateway.
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
from rclpy.qos import (
    QoSProfile,
    QoSDurabilityPolicy,
    QoSReliabilityPolicy,
)

from nav2_msgs.action import NavigateThroughPoses
from hive_interfaces.action import ExecuteBehavior
from geometry_msgs.msg import (
    PoseStamped,
    Twist,
    PoseWithCovarianceStamped,
)
from nav_msgs.msg import Odometry, Path as NavPath
from sensor_msgs.msg import Image, LaserScan

import paho.mqtt.client as mqtt


# =============================================================================
# Config
# =============================================================================

ROBOT_ID = os.environ.get("ROBOT_ID", "robot-1")

MQTT_HOST = os.environ.get("MQTT_HOST", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))

MQTT_USER = os.environ.get("MQTT_USERNAME") or None
MQTT_PASS = os.environ.get("MQTT_PASSWORD") or None

TOPIC_PREFIX = f"hive/{ROBOT_ID}"

# hive_camera_bridge signaling endpoint
CAMERA_SIGNALING_PORT = int(
    os.environ.get("CAMERA_SIGNALING_PORT", "8766")
)

_CAMERA_OFFER_TIMEOUT_S = 5.0

# cmd/goal dispatch budget. The gateway gives up on goal/ack after 6s
# (GOAL_ACK_TIMEOUT_S), so everything below — server discovery AND the
# action goal-request round trip — has to finish inside this, with margin
# left over for the MQTT hop out to AWS.
_GOAL_ACK_BUDGET_S = 4.5

# Slice of that budget spent waiting for /navigate_through_poses to show up
# in the graph.
_NAV_SERVER_WAIT_S = 2.0

# Teleop safety limits
_TELEOP_MAX_LINEAR = 0.8
_TELEOP_MAX_ANGULAR = 1.0

# MQTT -> /cmd_vel watchdog
_CMD_VEL_WATCHDOG_S = 0.5

# Default AMCL covariance
_DEFAULT_INITIAL_POSE_COVARIANCE = (
    0.25, 0.0,  0.0, 0.0, 0.0, 0.0,
    0.0,  0.25, 0.0, 0.0, 0.0, 0.0,
    0.0,  0.0, 0.0, 0.0, 0.0, 0.0,
    0.0,  0.0, 0.0, 0.0, 0.0, 0.0,
    0.0,  0.0, 0.0, 0.0, 0.0, 0.0,
    0.0,  0.0, 0.0, 0.0, 0.0, 0.0685,
)


def _topic(suffix: str) -> str:
    """Return a fully-qualified MQTT topic."""
    return f"{TOPIC_PREFIX}/{suffix}"


def _parse_command(raw_payload, label: str, logger=None) -> dict | None:
    """
    Decode an MQTT command payload into a dict, or return None.

    Every cmd/* handler goes through this. Valid JSON that isn't an OBJECT
    (a list, a bare string, a number) used to reach payload.get() and raise
    AttributeError — and because several handlers run inline on paho's
    network thread, that exception killed the thread and silently took the
    ENTIRE command link down while telemetry kept publishing from the ROS
    timers. See test_bridge_helpers.py::test_a_json_array_does_not_crash.
    """
    try:
        data = json.loads(raw_payload) if raw_payload else {}
    except (ValueError, TypeError):
        if logger:
            logger.warning(f"[{label}] invalid JSON, dropping")
        return None

    if not isinstance(data, dict):
        if logger:
            logger.warning(f"[{label}] payload is {type(data).__name__}, not an object — dropping")
        return None

    return data


# =============================================================================
# Goal-building helpers
# =============================================================================

def _dict_to_pose_stamped(pose_dict: dict) -> PoseStamped:
    ps = PoseStamped()

    ps.header.frame_id = (
        pose_dict.get("header", {}).get("frame_id", "map")
    )

    pos = pose_dict.get("pose", {}).get("position", {})
    ori = pose_dict.get("pose", {}).get("orientation", {})

    ps.pose.position.x = float(pos.get("x", 0.0))
    ps.pose.position.y = float(pos.get("y", 0.0))
    ps.pose.position.z = float(pos.get("z", 0.0))

    ps.pose.orientation.x = float(ori.get("x", 0.0))
    ps.pose.orientation.y = float(ori.get("y", 0.0))
    ps.pose.orientation.z = float(ori.get("z", 0.0))
    ps.pose.orientation.w = float(ori.get("w", 1.0))

    return ps


def _first_pose_stamped(poses: list) -> PoseStamped:
    if not poses:
        return PoseStamped()

    return _dict_to_pose_stamped(poses[0])


def _poses_to_flat_waypoints(poses: list) -> list:
    """
    PoseStamped-dict list -> flat waypoint dicts for runner.cpp /
    IterateWaypoints.
    """

    result = []

    for p in poses:
        header = p.get("header", {})
        pose = p.get("pose", {})

        position = pose.get("position", {})
        orient = pose.get("orientation", {})

        result.append({
            "x": float(position.get("x", 0.0)),
            "y": float(position.get("y", 0.0)),
            "z": float(position.get("z", 0.0)),
            "qx": float(orient.get("x", 0.0)),
            "qy": float(orient.get("y", 0.0)),
            "qz": float(orient.get("z", 0.0)),
            "qw": float(orient.get("w", 1.0)),
            "frame": header.get("frame_id", "map"),
        })

    return result


def _build_json_payload(payload: dict, poses: list) -> str:
    raw_jp = payload.get("json_payload", "")

    if isinstance(raw_jp, str) and raw_jp.strip():
        try:
            config = json.loads(raw_jp)
        except (json.JSONDecodeError, TypeError):
            config = {}

    elif isinstance(raw_jp, dict):
        config = dict(raw_jp)

    else:
        config = {}

    for key in ("speed", "priority", "pause_ms"):
        if key in payload:
            config[key] = payload[key]

    config.setdefault("priority", "normal")
    config.setdefault("pause_ms", 500)

    if poses:
        config["waypoints"] = _poses_to_flat_waypoints(poses)

    return json.dumps(config)


# =============================================================================
# ROS 2 node
# =============================================================================

class BridgeNode(Node):

    def __init__(self):
        super().__init__("hive_mqtt_bridge")

        # =====================================================================
        # ROS action clients
        # =====================================================================

        self.client = ActionClient(
            self,
            ExecuteBehavior,
            "/hive/execute_behavior",
        )

        self.nav_through_client = ActionClient(
            self,
            NavigateThroughPoses,
            "/navigate_through_poses",
        )

        # =====================================================================
        # ROS publishers
        # =====================================================================

        self.cmd_vel_pub = self.create_publisher(
            Twist,
            "/cmd_vel",
            10,
        )

        self.initial_pose_pub = self.create_publisher(
            PoseWithCovarianceStamped,
            "/initialpose",
            10,
        )

        # Fallback dispatch path for cmd/goal — see _handle_cmd_goal's
        # docstring. Nav2's NavigateToPose navigator subscribes to
        # /goal_pose and relays it into an action goal ON ITSELF, in
        # process, so this reaches the planner without the cross-process
        # action handshake that send_goal_async depends on.
        self.goal_pose_pub = self.create_publisher(
            PoseStamped,
            "/goal_pose",
            10,
        )

        # =====================================================================
        # Navigation goal tracking
        # =====================================================================

        self._nav_goal_lock = threading.Lock()
        self._active_nav_goal_handle = None

        # =====================================================================
        # Localization state
        # =====================================================================

        self._latest_pose = None
        self._latest_pose_time = 0.0
        self._pose_lock = threading.Lock()

        _amcl_qos = QoSProfile(
            depth=10,
            durability=QoSDurabilityPolicy.TRANSIENT_LOCAL,
            reliability=QoSReliabilityPolicy.RELIABLE,
        )

        self.create_subscription(
            PoseWithCovarianceStamped,
            "/amcl_pose",
            self._localization_cb,
            _amcl_qos,
        )

        # =====================================================================
        # Plan state
        # =====================================================================

        self._latest_plan = None
        self._plan_time = 0.0
        self._plan_lock = threading.Lock()

        self.create_subscription(
            NavPath,
            "/plan",
            self._plan_cb,
            10,
        )

        # =====================================================================
        # Liveness state
        #
        # IMPORTANT:
        # All timestamp attributes are initialized BEFORE callbacks/timers
        # can access them.
        #
        # The original crash happened because _scan_time was only created
        # inside _scan_cb(), but _health_tick() could run before the first
        # /scan message arrived.
        # =====================================================================

        self._cmd_vel_time = 0.0
        self._scan_time = 0.0
        self._camera_image_time = 0.0

        self._alive_lock = threading.Lock()

        # =====================================================================
        # Laser scan state
        # =====================================================================

        _be_qos = QoSProfile(
            depth=5,
            reliability=QoSReliabilityPolicy.BEST_EFFORT,
        )

        self._latest_scan_msg = None
        self._scan_received = False
        self._scan_data_lock = threading.Lock()

        self.create_subscription(
            LaserScan,
            "/scan",
            self._scan_cb,
            _be_qos,
        )

        self.create_subscription(
            Twist,
            "/cmd_vel",
            self._cmd_vel_incoming_cb,
            _be_qos,
        )

        self.create_subscription(
            Image,
            "/camera/image_raw",
            self._camera_image_cb,
            _be_qos,
        )

        # =====================================================================
        # Odometry state
        # =====================================================================

        self._odom_x = 0.0
        self._odom_y = 0.0
        self._odom_yaw = 0.0
        self._odom_received = False
        self._odom_lock = threading.Lock()

        self.create_subscription(
            Odometry,
            "/odom",
            self._odom_cb,
            _be_qos,
        )

        # =====================================================================
        # Teleop watchdog state
        # =====================================================================

        self._cmd_vel_lock = threading.Lock()
        self._last_cmd_vel_time = None
        self._last_cmd_vel_nonzero = False

        # =====================================================================
        # MQTT state
        # =====================================================================

        self._shutting_down = False

        self._mqtt = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=f"hive_mqtt_bridge-{ROBOT_ID}",
        )

        if MQTT_USER:
            self._mqtt.username_pw_set(
                MQTT_USER,
                MQTT_PASS,
            )

        # =====================================================================
        # MQTT Last Will
        # =====================================================================

        self._mqtt.will_set(
            _topic("health"),
            payload=json.dumps({
                "ros_ready": False,
                "robot_alive": False,
                "reason": "bridge_disconnected",
            }),
            qos=1,
            retain=True,
        )

        self._mqtt.on_connect = self._on_mqtt_connect
        self._mqtt.on_message = self._on_mqtt_message
        self._mqtt.on_disconnect = self._on_mqtt_disconnect

        self._mqtt.reconnect_delay_set(
            min_delay=1,
            max_delay=30,
        )

        self.get_logger().info(
            f"[mqtt] connecting to {MQTT_HOST}:{MQTT_PORT} "
            f"as robot_id={ROBOT_ID} ..."
        )

        self._mqtt.connect_async(
            MQTT_HOST,
            MQTT_PORT,
            keepalive=30,
        )

        self._mqtt.loop_start()

        # =====================================================================
        # Periodic timers
        # =====================================================================

        self.create_timer(
            1.0,
            self._telemetry_tick,
        )

        self.create_timer(
            1.0,
            self._localisation_tick,
        )

        self.create_timer(
            0.5,
            self._plan_tick,
        )

        self.create_timer(
            1.0,
            self._scan_tick,
        )

        self.create_timer(
            3.0,
            self._health_tick,
        )

        self.create_timer(
            0.1,
            self._cmd_vel_watchdog_tick,
        )

        self.get_logger().info(
            "hive_mqtt_bridge up — subscribed to "
            "/amcl_pose, /plan, /scan, /odom, /cmd_vel, "
            "/camera/image_raw"
        )

    # =========================================================================
    # MQTT callbacks
    # =========================================================================

    def _on_mqtt_connect(
        self,
        client,
        userdata,
        flags,
        reason_code,
        properties=None,
    ):
        if reason_code != 0:
            self.get_logger().error(
                f"[mqtt] connect failed: {reason_code}"
            )
            return

        self.get_logger().info(
            "[mqtt] connected — subscribing to "
            "cmd/task, cmd/velocity, cmd/goal, cmd/cancel_nav, "
            "cmd/set_pose, cmd/webrtc_offer"
        )

        client.subscribe(
            _topic("cmd/task"),
            qos=1,
        )

        client.subscribe(
            _topic("cmd/velocity"),
            qos=0,
        )

        client.subscribe(
            _topic("cmd/goal"),
            qos=1,
        )

        client.subscribe(
            _topic("cmd/cancel_nav"),
            qos=1,
        )

        client.subscribe(
            _topic("cmd/set_pose"),
            qos=1,
        )

        client.subscribe(
            _topic("cmd/webrtc_offer"),
            qos=1,
        )

    def _on_mqtt_disconnect(
        self,
        client,
        userdata,
        disconnect_flags,
        reason_code,
        properties=None,
    ):
        if self._shutting_down:
            self.get_logger().info(
                "[mqtt] disconnected during shutdown"
            )
        else:
            self.get_logger().warning(
                f"[mqtt] disconnected (reason={reason_code}) "
                "— paho will auto-reconnect"
            )

    def _on_mqtt_message(
        self,
        client,
        userdata,
        msg,
    ):
        """
        paho calls this on ITS OWN network thread, and an exception raised
        here kills that thread outright: the bridge then keeps publishing
        telemetry from its ROS timers (so /health still says the robot is
        alive) while silently ignoring every command, e-stop included. The
        blanket except below is the backstop that makes that failure mode
        impossible; the per-handler payload validation in _parse_command is
        what stops it being reached in the first place.
        """
        try:
            self._dispatch_mqtt_message(msg)

        except Exception:
            self.get_logger().error(
                f"[mqtt] handler for {msg.topic} raised — "
                "command dropped, link kept alive",
            )

    def _dispatch_mqtt_message(
        self,
        msg,
    ):
        if msg.topic == _topic("cmd/task"):

            threading.Thread(
                target=self._handle_cmd_task,
                args=(msg.payload,),
                daemon=True,
            ).start()

        elif msg.topic == _topic("cmd/velocity"):

            self._handle_cmd_velocity(
                msg.payload
            )

        elif msg.topic == _topic("cmd/goal"):

            threading.Thread(
                target=self._handle_cmd_goal,
                args=(msg.payload,),
                daemon=True,
            ).start()

        elif msg.topic == _topic("cmd/cancel_nav"):

            self._handle_cmd_cancel_nav(
                msg.payload
            )

        elif msg.topic == _topic("cmd/set_pose"):

            self._handle_cmd_set_pose(
                msg.payload
            )

        elif msg.topic == _topic("cmd/webrtc_offer"):

            threading.Thread(
                target=self._handle_cmd_webrtc_offer,
                args=(msg.payload,),
                daemon=True,
            ).start()

    def _mqtt_publish(
        self,
        suffix: str,
        payload: dict,
        qos: int = 0,
        retain: bool = False,
    ):
        try:
            self._mqtt.publish(
                _topic(suffix),
                json.dumps(payload),
                qos=qos,
                retain=retain,
            )

        except Exception as exc:
            self.get_logger().warning(
                f"[mqtt] publish {suffix} failed: {exc}"
            )

    # =========================================================================
    # cmd/task
    # =========================================================================

    def _handle_cmd_task(
        self,
        raw_payload: bytes,
    ):
        payload = _parse_command(
            raw_payload,
            "cmd/task",
            self.get_logger(),
        )

        if payload is None:
            return

        task_id = (
            payload.get("task_id")
            or str(uuid.uuid4())
        )

        try:
            bid = int(
                payload.get("id", 0)
            )
        except (ValueError, TypeError):
            bid = 0

        poses = payload.get(
            "poses",
            [],
        )

        if not isinstance(poses, list):
            poses = []

        self.get_logger().info(
            f'[cmd/task] id={bid} '
            f'behavior={payload.get("behavior_name", "")} '
            f'task={task_id} '
            f'poses={len(poses)}'
        )

        hive_available = self.client.wait_for_server(
            timeout_sec=3.0
        )

        if hive_available:

            goal = ExecuteBehavior.Goal()

            goal.id = bid
            goal.task_id = task_id
            goal.behavior_name = payload.get(
                "behavior_name",
                "",
            )

            goal.json_payload = _build_json_payload(
                payload,
                poses,
            )

            if bid == 21 and poses:
                goal.pose = _first_pose_stamped(
                    poses
                )

            send_goal_future = (
                self.client.send_goal_async(goal)
            )

            send_goal_future.add_done_callback(
                lambda fut: self._on_hive_goal_response(
                    fut,
                    task_id,
                    goal,
                    poses,
                    bid,
                )
            )

            return

        # =====================================================================
        # Nav2 fallback
        # =====================================================================

        self.get_logger().info(
            "[cmd/task] Hive unavailable — "
            "falling back to Nav2 NavigateThroughPoses"
        )

        if not poses:
            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": (
                        "Hive server unavailable and "
                        "no waypoints to navigate"
                    ),
                },
                qos=1,
            )
            return

        if not self.nav_through_client.wait_for_server(
            timeout_sec=3.0
        ):
            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": (
                        "Neither Hive nor Nav2 "
                        "NavigateThroughPoses is available"
                    ),
                },
                qos=1,
            )
            return

        nav_goal = NavigateThroughPoses.Goal()

        nav_goal.poses = [
            _dict_to_pose_stamped(p)
            for p in poses
        ]

        nav_goal.behavior_tree = ""

        send_goal_future = (
            self.nav_through_client.send_goal_async(
                nav_goal
            )
        )

        send_goal_future.add_done_callback(
            lambda fut: self._on_nav2_goal_response(
                fut,
                task_id,
                poses,
            )
        )

    def _on_hive_goal_response(
        self,
        fut,
        task_id,
        goal,
        poses,
        bid,
    ):
        try:
            gh = fut.result()
        except Exception as exc:
            self.get_logger().warning(
                f"[cmd/task] Hive goal response failed: {exc}"
            )

            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": str(exc),
                },
                qos=1,
            )
            return

        if gh is None or not gh.accepted:
            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": "Hive goal rejected",
                },
                qos=1,
            )
            return

        self.get_logger().info(
            f"[cmd/task] Hive goal accepted "
            f"(task={task_id})"
        )

        self._mqtt_publish(
            "task/ack",
            {
                "task_id": task_id,
                "accepted": True,
                "behavior": (
                    goal.behavior_name
                    or f"id_{goal.id}"
                ),
                "waypoint_count": (
                    len(poses)
                    if bid in (21, 22)
                    else None
                ),
                "nav_mode": "hive",
            },
            qos=1,
        )

        result_future = (
            gh.get_result_async()
        )

        result_future.add_done_callback(
            lambda rf: self._on_hive_result(
                task_id,
                rf,
            )
        )

    def _on_hive_result(
        self,
        task_id,
        result_future,
    ):
        try:
            result = (
                result_future
                .result()
                .result
            )

            self._mqtt_publish(
                "task/result",
                {
                    "task_id": task_id,
                    "success": bool(
                        result.success
                    ),
                    "outcome_text": (
                        result.outcome_text
                    ),
                },
                qos=1,
            )

        except Exception as exc:
            self.get_logger().warning(
                f"[task/result] could not fetch "
                f"result for {task_id}: {exc}"
            )

    def _on_nav2_goal_response(
        self,
        fut,
        task_id,
        poses,
    ):
        try:
            gh = fut.result()
        except Exception as exc:
            self.get_logger().warning(
                f"[cmd/task] Nav2 goal response failed: {exc}"
            )

            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": str(exc),
                },
                qos=1,
            )
            return

        if gh is None or not gh.accepted:
            self._mqtt_publish(
                "task/ack",
                {
                    "task_id": task_id,
                    "accepted": False,
                    "detail": "Nav2 goal rejected",
                },
                qos=1,
            )
            return

        self.get_logger().info(
            f"[cmd/task] Nav2 goal accepted "
            f"(task={task_id})"
        )

        self._mqtt_publish(
            "task/ack",
            {
                "task_id": task_id,
                "accepted": True,
                "behavior": "NavigateThroughPoses",
                "waypoint_count": len(poses),
                "nav_mode": "nav2_direct",
            },
            qos=1,
        )

        self._track_active_nav_goal(
            gh
        )

    # =========================================================================
    # Navigation goal tracking
    # =========================================================================

    def _track_active_nav_goal(
        self,
        goal_handle,
        on_result=None,
    ):
        with self._nav_goal_lock:
            self._active_nav_goal_handle = (
                goal_handle
            )

        def _on_done(result_future):

            with self._nav_goal_lock:
                if (
                    self._active_nav_goal_handle
                    is goal_handle
                ):
                    self._active_nav_goal_handle = None

            if on_result:
                on_result(result_future)

        goal_handle.get_result_async().add_done_callback(
            _on_done
        )

    # =========================================================================
    # cmd/velocity
    # =========================================================================

    def _handle_cmd_velocity(
        self,
        raw_payload: bytes,
    ):
        data = _parse_command(
            raw_payload,
            "cmd/velocity",
            self.get_logger(),
        )

        if data is None:
            return

        try:
            lin = float(
                data.get(
                    "linear",
                    0.0,
                )
            )

            ang = float(
                data.get(
                    "angular",
                    0.0,
                )
            )

        except (ValueError, TypeError):
            self.get_logger().warning(
                "[cmd/velocity] invalid velocity values"
            )
            return

        lin = max(
            -_TELEOP_MAX_LINEAR,
            min(
                _TELEOP_MAX_LINEAR,
                lin,
            ),
        )

        ang = max(
            -_TELEOP_MAX_ANGULAR,
            min(
                _TELEOP_MAX_ANGULAR,
                ang,
            ),
        )

        self.publish_cmd_vel(
            lin,
            ang,
        )

        with self._cmd_vel_lock:
            self._last_cmd_vel_time = (
                time.monotonic()
            )

            self._last_cmd_vel_nonzero = (
                lin != 0.0
                or ang != 0.0
            )

    def _cmd_vel_watchdog_tick(self):
        with self._cmd_vel_lock:

            if (
                not self._last_cmd_vel_nonzero
                or self._last_cmd_vel_time is None
            ):
                return

            stale = (
                time.monotonic()
                - self._last_cmd_vel_time
            ) > _CMD_VEL_WATCHDOG_S

        if stale:

            self.get_logger().warning(
                f"[cmd/velocity] no frame in "
                f"{_CMD_VEL_WATCHDOG_S * 1000:.0f}ms — "
                "zeroing /cmd_vel "
                "(bridge-side deadman)"
            )

            self.publish_cmd_vel(
                0.0,
                0.0,
            )

            with self._cmd_vel_lock:
                self._last_cmd_vel_nonzero = False

    def publish_cmd_vel(
        self,
        linear_x: float,
        angular_z: float,
    ):
        msg = Twist()

        msg.linear.x = float(
            linear_x
        )

        msg.angular.z = float(
            angular_z
        )

        self.cmd_vel_pub.publish(msg)

    # =========================================================================
    # cmd/goal
    # =========================================================================

    def _handle_cmd_goal(
        self,
        raw_payload: bytes,
    ):
        """
        Direct Nav2 dispatch, with a bounded wait and a /goal_pose fallback.

        NavigateThroughPoses stays the primary path — it is the only one
        that carries a whole route in a single call, and the only one that
        yields real accept/reject semantics plus a goal handle for
        cmd/cancel_nav.

        The fallback exists because that action's goal-request round trip
        can hang indefinitely while plain topics keep flowing: actions are
        built on services, which need unicast request/reply, whereas topic
        traffic and graph discovery do not. So wait_for_server can succeed
        and send_goal_async still never answer. send_goal_async carries no
        timeout of its own, so without a bound here the handler simply
        never acks and the gateway 504s.

        On timeout we publish the route's final pose to /goal_pose, which
        Nav2's NavigateToPose navigator picks up and relays into an action
        goal on itself, in-process — no cross-process handshake involved.
        Deliberately degraded, and the ack says so: that is NavigateToPose,
        so intermediate waypoints are dropped and there is no goal handle
        for cmd/cancel_nav to cancel.
        """
        payload = _parse_command(
            raw_payload,
            "cmd/goal",
            self.get_logger(),
        )

        if payload is None:
            return

        deadline = (
            time.monotonic()
            + _GOAL_ACK_BUDGET_S
        )

        goal_id = (
            payload.get("goal_id")
            or str(uuid.uuid4())
        )

        poses = payload.get(
            "poses",
            [],
        )

        if not isinstance(poses, list):
            poses = []

        if not poses:
            self._mqtt_publish(
                "goal/ack",
                {
                    "goal_id": goal_id,
                    "accepted": False,
                    "detail": "No poses provided",
                },
                qos=1,
            )
            return

        # Single-shot guard — whichever of this thread and the action
        # response callback gets here first is the one that acks. Without
        # it a late Nav2 response would publish a second goal/ack for the
        # same goal_id.
        ack_lock = threading.Lock()
        ack_claimed = [False]

        def _claim_ack():
            with ack_lock:
                if ack_claimed[0]:
                    return False

                ack_claimed[0] = True
                return True

        responded = threading.Event()

        server_wait = min(
            _NAV_SERVER_WAIT_S,
            max(
                0.0,
                deadline - time.monotonic(),
            ),
        )

        if not self.nav_through_client.wait_for_server(
            timeout_sec=server_wait
        ):
            # Deliberately NOT falling back here. If the action server never
            # showed up in the graph, Nav2 isn't running at all — and then
            # nothing is subscribed to /goal_pose either, so publishing there
            # would report success for a goal no one will ever act on. The
            # fallback is for the opposite case: server advertised, handshake
            # wedged.
            self.get_logger().warning(
                "[cmd/goal] NavigateThroughPoses not "
                f"advertised within {server_wait:.1f}s"
            )

            if _claim_ack():
                self._mqtt_publish(
                    "goal/ack",
                    {
                        "goal_id": goal_id,
                        "accepted": False,
                        "detail": (
                            "Nav2 NavigateThroughPoses "
                            "unavailable"
                        ),
                    },
                    qos=1,
                )
            return

        nav_goal = NavigateThroughPoses.Goal()

        nav_goal.poses = [
            _dict_to_pose_stamped(p)
            for p in poses
        ]

        nav_goal.behavior_tree = ""

        self.get_logger().info(
            f"[cmd/goal] dispatching "
            f"{len(poses)} waypoint(s), "
            f"goal={goal_id}"
        )

        send_goal_future = (
            self.nav_through_client.send_goal_async(
                nav_goal
            )
        )

        send_goal_future.add_done_callback(
            lambda fut: (
                self._on_direct_nav_goal_response(
                    fut,
                    goal_id,
                    len(poses),
                    _claim_ack,
                    responded,
                )
            )
        )

        if responded.wait(
            timeout=max(
                0.0,
                deadline - time.monotonic(),
            )
        ):
            # Callback ran and published goal/ack.
            return

        # Nav2 never answered. The future stays pending on purpose — if it
        # ever does resolve, the callback finds the ack already claimed and
        # only registers the handle so cmd/cancel_nav still works.
        self.get_logger().warning(
            "[cmd/goal] no goal response from Nav2 within "
            f"{_GOAL_ACK_BUDGET_S:.1f}s (goal={goal_id}) "
            "— falling back to /goal_pose"
        )

        if _claim_ack():
            self._dispatch_goal_pose(
                goal_id,
                poses,
                (
                    "Nav2 answered no goal request within "
                    f"{_GOAL_ACK_BUDGET_S:.1f}s"
                ),
            )

    def _dispatch_goal_pose(
        self,
        goal_id,
        poses,
        reason,
    ):
        """
        Degraded dispatch — publish the route's FINAL pose to /goal_pose.

        The last waypoint is the operator's actual destination; the ones
        before it are route shaping NavigateToPose cannot express, so they
        are dropped and the ack reports how many.
        """
        target = _dict_to_pose_stamped(
            poses[-1]
        )

        if not target.header.frame_id:
            target.header.frame_id = "map"

        # A topic publish is fire-and-forget, so nothing downstream can tell
        # us the goal was refused — the one thing we CAN check is whether
        # anybody is listening. With no subscriber this would drop on the
        # floor, and acking "accepted" for it would be a straight lie.
        if self.goal_pose_pub.get_subscription_count() < 1:
            self.get_logger().error(
                "[cmd/goal] /goal_pose fallback "
                "unavailable — no subscriber on "
                f"/goal_pose (goal={goal_id})"
            )

            self._mqtt_publish(
                "goal/ack",
                {
                    "goal_id": goal_id,
                    "accepted": False,
                    "detail": (
                        f"{reason}; /goal_pose fallback "
                        "also unavailable (nothing "
                        "subscribed to /goal_pose)"
                    ),
                },
                qos=1,
            )
            return

        # header.stamp deliberately left at zero — Nav2 then resolves the
        # pose against the latest available TF rather than an exact time
        # that, after an MQTT hop from AWS, is already stale.
        self.goal_pose_pub.publish(
            target
        )

        dropped = len(poses) - 1

        detail = (
            f"{reason}; published final waypoint to "
            "/goal_pose instead"
        )

        if dropped > 0:
            detail += (
                f" ({dropped} intermediate waypoint(s) "
                "dropped — /goal_pose carries a single "
                "pose)"
            )

        self.get_logger().info(
            "[cmd/goal] /goal_pose fallback "
            f"x={target.pose.position.x:.2f} "
            f"y={target.pose.position.y:.2f} "
            f"(goal={goal_id}) — {detail}"
        )

        self._mqtt_publish(
            "goal/ack",
            {
                "goal_id": goal_id,
                "accepted": True,
                "waypoint_count": 1,
                "nav_mode": "goal_pose_fallback",
                "cancellable": False,
                "detail": detail,
            },
            qos=1,
        )

    def _on_direct_nav_goal_response(
        self,
        fut,
        goal_id,
        waypoint_count,
        claim_ack,
        responded,
    ):
        try:
            try:
                gh = fut.result()

            except Exception as exc:
                self.get_logger().warning(
                    f"[cmd/goal] goal response failed: {exc}"
                )

                if claim_ack():
                    self._mqtt_publish(
                        "goal/ack",
                        {
                            "goal_id": goal_id,
                            "accepted": False,
                            "detail": str(exc),
                        },
                        qos=1,
                    )
                return

            if gh is None or not gh.accepted:
                if claim_ack():
                    self._mqtt_publish(
                        "goal/ack",
                        {
                            "goal_id": goal_id,
                            "accepted": False,
                            "detail": "Nav2 goal rejected",
                        },
                        qos=1,
                    )
                return

            self.get_logger().info(
                f"[cmd/goal] NavigateThroughPoses accepted "
                f"(goal={goal_id})"
            )

            if claim_ack():
                self._mqtt_publish(
                    "goal/ack",
                    {
                        "goal_id": goal_id,
                        "accepted": True,
                        "waypoint_count": waypoint_count,
                        "nav_mode": "navigate_through_poses",
                        "cancellable": True,
                    },
                    qos=1,
                )

            else:
                # Arrived after the /goal_pose fallback already acked. Nav2
                # preempts the NavigateToPose goal with this one, which is
                # the better outcome anyway — it carries the full route —
                # and tracking the handle is what lets cmd/cancel_nav stop
                # it.
                self.get_logger().info(
                    "[cmd/goal] late Nav2 acceptance "
                    f"(goal={goal_id}) — ack already sent via "
                    "/goal_pose fallback; tracking handle for "
                    "cmd/cancel_nav"
                )

            self._track_active_nav_goal(
                gh,
                on_result=lambda rf: (
                    self._on_direct_nav_result(
                        goal_id,
                        rf,
                    )
                ),
            )

        finally:
            responded.set()

    def _on_direct_nav_result(
        self,
        goal_id,
        result_future,
    ):
        try:
            result = result_future.result()

            self._mqtt_publish(
                "goal/result",
                {
                    "goal_id": goal_id,
                    "status": result.status,
                },
                qos=1,
            )

        except Exception as exc:
            self.get_logger().warning(
                f"[goal/result] could not fetch "
                f"result for {goal_id}: {exc}"
            )

    # =========================================================================
    # cmd/cancel_nav
    # =========================================================================

    def _handle_cmd_cancel_nav(
        self,
        raw_payload: bytes,
    ):
        payload = _parse_command(
            raw_payload,
            "cmd/cancel_nav",
            self.get_logger(),
        )

        # A cancel with an unreadable payload still means "stop" — fall back
        # to an empty payload rather than ignoring the operator.
        if payload is None:
            payload = {}

        request_id = payload.get(
            "request_id"
        )

        with self._nav_goal_lock:
            gh = self._active_nav_goal_handle

        if gh is None:
            self._mqtt_publish(
                "cancel_nav/ack",
                {
                    "request_id": request_id,
                    "cancelled": False,
                    "detail": (
                        "No active NavigateThroughPoses "
                        "goal to cancel"
                    ),
                },
                qos=1,
            )
            return

        self.get_logger().info(
            f"[cmd/cancel_nav] cancelling active "
            f"goal (request={request_id})"
        )

        try:
            cancel_future = (
                gh.cancel_goal_async()
            )
        except Exception as exc:
            self.get_logger().warning(
                f"[cmd/cancel_nav] cancel request failed: {exc}"
            )

            self._mqtt_publish(
                "cancel_nav/ack",
                {
                    "request_id": request_id,
                    "cancelled": False,
                    "detail": str(exc),
                },
                qos=1,
            )
            return

        def _on_cancel_done(fut):
            try:
                response = fut.result()

                cancelled = (
                    len(
                        response.goals_canceling
                    ) > 0
                )

            except Exception as exc:
                self.get_logger().warning(
                    "[cmd/cancel_nav] "
                    f"cancel request failed: {exc}"
                )

                cancelled = False

            self.get_logger().info(
                "[cmd/cancel_nav] "
                f"{'cancelled' if cancelled else 'not cancelled'}"
            )

            self._mqtt_publish(
                "cancel_nav/ack",
                {
                    "request_id": request_id,
                    "cancelled": cancelled,
                },
                qos=1,
            )

        cancel_future.add_done_callback(
            _on_cancel_done
        )

    # =========================================================================
    # cmd/set_pose
    # =========================================================================

    def _handle_cmd_set_pose(
        self,
        raw_payload: bytes,
    ):
        payload = _parse_command(
            raw_payload,
            "cmd/set_pose",
            self.get_logger(),
        )

        if payload is None:
            return

        pose_dict = payload.get(
            "pose"
        )

        if not pose_dict:
            self.get_logger().warning(
                '[cmd/set_pose] missing "pose", dropping'
            )
            return

        inner = pose_dict.get(
            "pose",
            {},
        )

        pos = inner.get(
            "position",
            {},
        )

        ori = inner.get(
            "orientation",
            {},
        )

        msg = PoseWithCovarianceStamped()

        msg.header.frame_id = (
            pose_dict
            .get("header", {})
            .get("frame_id", "map")
        )

        msg.header.stamp = (
            self.get_clock()
            .now()
            .to_msg()
        )

        msg.pose.pose.position.x = float(
            pos.get("x", 0.0)
        )

        msg.pose.pose.position.y = float(
            pos.get("y", 0.0)
        )

        msg.pose.pose.position.z = float(
            pos.get("z", 0.0)
        )

        msg.pose.pose.orientation.x = float(
            ori.get("x", 0.0)
        )

        msg.pose.pose.orientation.y = float(
            ori.get("y", 0.0)
        )

        msg.pose.pose.orientation.z = float(
            ori.get("z", 0.0)
        )

        msg.pose.pose.orientation.w = float(
            ori.get("w", 1.0)
        )

        covariance = payload.get(
            "covariance"
        )

        if (
            isinstance(covariance, (list, tuple))
            and len(covariance) == 36
        ):
            try:
                msg.pose.covariance = [
                    float(v)
                    for v in covariance
                ]
            except (ValueError, TypeError):
                msg.pose.covariance = list(
                    _DEFAULT_INITIAL_POSE_COVARIANCE
                )
        else:
            msg.pose.covariance = list(
                _DEFAULT_INITIAL_POSE_COVARIANCE
            )

        self.initial_pose_pub.publish(
            msg
        )

        self.get_logger().info(
            "[cmd/set_pose] published /initialpose "
            f"x={msg.pose.pose.position.x:.3f} "
            f"y={msg.pose.pose.position.y:.3f} "
            f"frame={msg.header.frame_id}"
        )

    # =========================================================================
    # cmd/webrtc_offer
    # =========================================================================

    def _handle_cmd_webrtc_offer(
        self,
        raw_payload: bytes,
    ):
        payload = _parse_command(
            raw_payload,
            "cmd/webrtc_offer",
            self.get_logger(),
        )

        if payload is None:
            return

        offer_id = payload.get(
            "offer_id"
        )

        sdp = payload.get(
            "sdp"
        )

        sdp_type = payload.get(
            "type",
            "offer",
        )

        if not offer_id or not sdp:
            self.get_logger().warning(
                "[cmd/webrtc_offer] "
                "missing offer_id/sdp, dropping"
            )
            return

        self.get_logger().info(
            "[cmd/webrtc_offer] relaying to "
            f"local camera bridge (offer={offer_id})"
        )

        body = json.dumps({
            "sdp": sdp,
            "type": sdp_type,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"http://localhost:{CAMERA_SIGNALING_PORT}/offer",
            data=body,
            headers={
                "Content-Type": "application/json"
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(
                req,
                timeout=_CAMERA_OFFER_TIMEOUT_S,
            ) as resp:

                answer = json.loads(
                    resp.read()
                )

            self._mqtt_publish(
                "webrtc/answer",
                {
                    "offer_id": offer_id,
                    "sdp": answer["sdp"],
                    "type": answer["type"],
                },
                qos=1,
            )

            self.get_logger().info(
                "[cmd/webrtc_offer] answered "
                f"(offer={offer_id})"
            )

        except (
            urllib.error.URLError,
            OSError,
            ValueError,
            KeyError,
        ) as exc:

            self.get_logger().warning(
                "[cmd/webrtc_offer] camera bridge "
                f"unreachable: {exc}"
            )

            self._mqtt_publish(
                "webrtc/answer",
                {
                    "offer_id": offer_id,
                    "error": (
                        "camera bridge unreachable "
                        f"on robot: {exc}"
                    ),
                },
                qos=1,
            )

    # =========================================================================
    # ROS subscriptions -> cached state
    # =========================================================================

    def _localization_cb(
        self,
        msg: PoseWithCovarianceStamped,
    ):
        pose_dict = {
            "frame_id": msg.header.frame_id,

            "position": {
                "x": msg.pose.pose.position.x,
                "y": msg.pose.pose.position.y,
                "z": msg.pose.pose.position.z,
            },

            "orientation": {
                "x": msg.pose.pose.orientation.x,
                "y": msg.pose.pose.orientation.y,
                "z": msg.pose.pose.orientation.z,
                "w": msg.pose.pose.orientation.w,
            },
        }

        with self._pose_lock:
            self._latest_pose = pose_dict
            self._latest_pose_time = (
                time.monotonic()
            )

    def get_localization(self):
        """
        AMCL only republishes on motion, so a stationary robot's last
        pose remains valid. age_s lets subscribers determine freshness.
        """

        with self._pose_lock:

            if self._latest_pose is None:
                return None

            age = (
                time.monotonic()
                - self._latest_pose_time
            )

            return {
                **self._latest_pose,
                "age_s": round(age, 2),
            }

    def _plan_cb(
        self,
        msg: NavPath,
    ):
        n = len(
            msg.poses
        )

        stride = max(
            1,
            n // 400,
        )

        points = [
            {
                "x": round(
                    p.pose.position.x,
                    3,
                ),
                "y": round(
                    p.pose.position.y,
                    3,
                ),
            }
            for p in msg.poses[::stride]
        ]

        if n > 0 and stride > 1:
            last = (
                msg.poses[-1]
                .pose
                .position
            )

            points.append({
                "x": round(last.x, 3),
                "y": round(last.y, 3),
            })

        with self._plan_lock:
            self._latest_plan = {
                "frame_id": msg.header.frame_id,
                "points": points,
            }

            self._plan_time = (
                time.monotonic()
            )

    def get_plan(self):
        with self._plan_lock:

            if self._latest_plan is None:
                return None

            age = (
                time.monotonic()
                - self._plan_time
            )

            if age > 15.0:
                return None

            return {
                **self._latest_plan,
                "age_s": round(age, 2),
            }

    # =========================================================================
    # Scan callback
    # =========================================================================

    def _scan_cb(
        self,
        msg: LaserScan,
    ):
        # IMPORTANT:
        # _scan_time was initialized in __init__.
        # This callback now only updates it.
        with self._alive_lock:
            self._scan_time = (
                time.monotonic()
            )

        with self._scan_data_lock:
            self._latest_scan_msg = msg
            self._scan_received = True

    def _cmd_vel_incoming_cb(
        self,
        msg: Twist,
    ):
        with self._alive_lock:
            self._cmd_vel_time = (
                time.monotonic()
            )

    def _camera_image_cb(
        self,
        msg: Image,
    ):
        with self._alive_lock:
            self._camera_image_time = (
                time.monotonic()
            )

    def get_scan(self):
        with self._scan_data_lock:

            if not self._scan_received:
                return None

            msg = self._latest_scan_msg

        ranges = [
            round(r, 3)
            if math.isfinite(r)
            else None
            for r in msg.ranges
        ]

        return {
            "frame_id": msg.header.frame_id,
            "angle_min": round(
                msg.angle_min,
                4,
            ),
            "angle_max": round(
                msg.angle_max,
                4,
            ),
            "angle_increment": round(
                msg.angle_increment,
                6,
            ),
            "range_min": round(
                msg.range_min,
                3,
            ),
            "range_max": round(
                msg.range_max,
                3,
            ),
            "ranges": ranges,
        }

    # =========================================================================
    # Robot liveness
    # =========================================================================

    def is_robot_alive(
        self,
        max_age: float = 5.0,
    ) -> dict:

        now = time.monotonic()

        # IMPORTANT:
        # These attributes are now guaranteed to exist even if none of
        # the corresponding ROS topics have produced a message yet.
        with self._alive_lock:

            cmd_vel_age = (
                now - self._cmd_vel_time
                if self._cmd_vel_time > 0
                else None
            )

            scan_age = (
                now - self._scan_time
                if self._scan_time > 0
                else None
            )

            camera_age = (
                now - self._camera_image_time
                if self._camera_image_time > 0
                else None
            )

        cmd_vel_ok = (
            cmd_vel_age is not None
            and cmd_vel_age < max_age
        )

        scan_ok = (
            scan_age is not None
            and scan_age < max_age
        )

        camera_ok = (
            camera_age is not None
            and camera_age < max_age
        )

        return {
            "alive": (
                cmd_vel_ok
                or scan_ok
                or camera_ok
            ),

            "cmd_vel_age_s": (
                round(cmd_vel_age, 2)
                if cmd_vel_age is not None
                else None
            ),

            "scan_age_s": (
                round(scan_age, 2)
                if scan_age is not None
                else None
            ),

            "camera_image_age_s": (
                round(camera_age, 2)
                if camera_age is not None
                else None
            ),
        }

    # =========================================================================
    # Odometry
    # =========================================================================

    def _odom_cb(
        self,
        msg: Odometry,
    ):
        qz = (
            msg.pose.pose.orientation.z
        )

        qw = (
            msg.pose.pose.orientation.w
        )

        yaw = (
            2.0
            * math.atan2(
                qz,
                qw,
            )
        )

        with self._odom_lock:
            self._odom_x = (
                msg.pose.pose.position.x
            )

            self._odom_y = (
                msg.pose.pose.position.y
            )

            self._odom_yaw = yaw

            self._odom_received = True

    def get_odom(self):
        with self._odom_lock:

            if not self._odom_received:
                return None

            return {
                "x": round(
                    self._odom_x,
                    3,
                ),
                "y": round(
                    self._odom_y,
                    3,
                ),
                "yaw": round(
                    self._odom_yaw,
                    4,
                ),
            }

    # =========================================================================
    # Periodic MQTT publish ticks
    # =========================================================================

    def _telemetry_tick(self):
        odom = self.get_odom()

        if odom:
            self._mqtt_publish(
                "telemetry",
                {
                    "type": "telemetry",
                    "x": odom["x"],
                    "y": odom["y"],
                    "theta": odom["yaw"],
                },
            )

    def _localisation_tick(self):
        loc = self.get_localization()

        if not loc:
            return

        q = loc["orientation"]

        yaw = math.atan2(
            2.0 * (
                q["w"] * q["z"]
                + q["x"] * q["y"]
            ),
            1.0 - 2.0 * (
                q["y"] ** 2
                + q["z"] ** 2
            ),
        )

        self._mqtt_publish(
            "localisation",
            {
                "type": "localisation",
                "x": loc["position"]["x"],
                "y": loc["position"]["y"],
                "yaw": yaw,
                "frame_id": loc["frame_id"],
                "age_s": loc["age_s"],
            },
            retain=True,
        )

    def _plan_tick(self):
        plan = self.get_plan()

        if plan:
            self._mqtt_publish(
                "plan",
                {
                    "type": "plan",
                    **plan,
                },
            )

        else:
            self._mqtt_publish(
                "plan",
                {
                    "type": "plan",
                    "frame_id": "map",
                    "age_s": None,
                    "points": [],
                },
            )

    def _scan_tick(self):
        scan = self.get_scan()

        if scan:
            self._mqtt_publish(
                "scan",
                {
                    "type": "scan",
                    **scan,
                },
            )

    def _health_tick(self):
        status = self.is_robot_alive()

        self._mqtt_publish(
            "health",
            {
                "ros_ready": True,
                "robot_alive": status["alive"],

                "topics": {
                    "/cmd_vel": (
                        status["cmd_vel_age_s"]
                    ),

                    "/scan": (
                        status["scan_age_s"]
                    ),

                    "/camera/image_raw": (
                        status["camera_image_age_s"]
                    ),
                },
            },
            qos=1,
            retain=True,
        )

    # =========================================================================
    # Shutdown
    # =========================================================================

    def destroy_node(self):
        self.get_logger().info(
            "[bridge] shutting down"
        )

        self._shutting_down = True

        # Stop MQTT network loop first.
        try:
            self._mqtt.loop_stop()
        except Exception as exc:
            self.get_logger().warning(
                f"[mqtt] loop_stop failed: {exc}"
            )

        # Then disconnect cleanly.
        try:
            self._mqtt.disconnect()
        except Exception as exc:
            self.get_logger().warning(
                f"[mqtt] disconnect failed: {exc}"
            )

        super().destroy_node()


# =============================================================================
# Main
# =============================================================================

def main(args=None):

    rclpy.init(
        args=args
    )

    node = BridgeNode()

    try:
        rclpy.spin(
            node
        )

    except KeyboardInterrupt:
        pass

    finally:

        node.destroy_node()

        rclpy.shutdown()


if __name__ == "__main__":
    main()