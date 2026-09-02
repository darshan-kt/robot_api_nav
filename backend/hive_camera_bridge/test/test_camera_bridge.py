"""
Unit tests for hive_camera_bridge — the WebRTC boundary node.

Run inside the robotstore container (aiortc, av, cv_bridge and rclpy all
live there):

    docker exec robotstore_cont-run-arm bash -lc \
      'source /opt/ros/humble/setup.bash && source ~/ros2_ws/install/setup.bash && \
       cd ~/ros2_ws/src/hive_camera_bridge && python3 -m pytest test -q'

No ROS node, no real peer connection: what's covered is the cross-thread
frame handoff and the "camera not publishing yet" path, which is the one an
operator actually hits (Gazebo still booting, or a wrong CAMERA_TOPIC).
"""
import asyncio
import threading

import numpy as np
import pytest

from hive_camera_bridge import camera_node as cn


# =============================================================================
# RosFrameSource — rclpy callback thread -> asyncio loop handoff
# =============================================================================

def test_frame_source_starts_empty():
    assert cn.RosFrameSource().get() is None


def test_frame_source_returns_the_last_frame_set():
    src = cn.RosFrameSource()
    frame = np.ones((4, 4, 3), dtype=np.uint8)
    src.set(frame)
    assert np.array_equal(src.get(), frame)


def test_frame_source_keeps_only_the_latest_frame():
    """Latest-value-wins by design — a queue would only add latency to a live feed."""
    src = cn.RosFrameSource()
    src.set(np.zeros((2, 2, 3), dtype=np.uint8))
    src.set(np.full((2, 2, 3), 7, dtype=np.uint8))
    assert src.get()[0][0][0] == 7


def test_frame_source_is_safe_under_concurrent_access():
    """
    The real access pattern: one rclpy thread writing while N aiortc tracks
    read. A torn read here would surface as a garbled frame, not a crash, so
    it gets exercised explicitly.
    """
    src = cn.RosFrameSource()
    stop = threading.Event()
    errors = []

    def writer():
        i = 0
        while not stop.is_set():
            src.set(np.full((8, 8, 3), i % 256, dtype=np.uint8))
            i += 1

    def reader():
        try:
            while not stop.is_set():
                frame = src.get()
                if frame is not None:
                    assert frame.shape == (8, 8, 3)
                    assert len(np.unique(frame)) == 1   # never a half-written frame
        except Exception as exc:
            errors.append(exc)

    threads = [threading.Thread(target=writer)] + \
              [threading.Thread(target=reader) for _ in range(3)]
    for t in threads:
        t.start()
    threading.Event().wait(0.3)
    stop.set()
    for t in threads:
        t.join(timeout=2)

    assert errors == []


# =============================================================================
# CameraTrack — what the browser receives
# =============================================================================

def test_track_emits_a_black_placeholder_before_any_frame_arrives():
    """
    Deliberate: a browser that offers before Gazebo's camera plugin is up
    must see "connected, no signal" rather than a failed negotiation.
    """
    track = cn.CameraTrack(cn.RosFrameSource())
    frame = asyncio.get_event_loop_policy().new_event_loop().run_until_complete(track.recv())
    arr = frame.to_ndarray(format='bgr24')
    assert arr.shape == (240, 320, 3)
    assert arr.max() == 0


def test_track_forwards_a_real_frame():
    src = cn.RosFrameSource()
    src.set(np.full((16, 16, 3), 200, dtype=np.uint8))
    track = cn.CameraTrack(src)

    frame = asyncio.get_event_loop_policy().new_event_loop().run_until_complete(track.recv())
    arr = frame.to_ndarray(format='bgr24')
    assert arr.shape == (16, 16, 3)
    assert arr.max() == 200


def test_track_paces_itself_to_the_target_fps():
    """Nothing upstream throttles recv() — the track's own sleep is the pacing."""
    track = cn.CameraTrack(cn.RosFrameSource())
    assert track._frame_interval == pytest.approx(1.0 / cn.TARGET_FPS)


def test_multiple_viewers_share_one_frame_buffer():
    """N browsers must cost one ROS subscription, not N."""
    src = cn.RosFrameSource()
    tracks = [cn.CameraTrack(src) for _ in range(3)]
    assert all(t._source is src for t in tracks)


# =============================================================================
# Signaling defaults — these have to match the bridge's expectations
# =============================================================================

def test_signaling_port_matches_the_mqtt_bridge_default():
    """hive_mqtt_bridge POSTs the relayed offer to localhost:<this port>."""
    assert cn.SIGNALING_PORT == 8766


def test_camera_topic_default_matches_the_health_check_topic():
    """/health's robot_alive reads /camera/image_raw — same topic this subscribes to."""
    assert cn.CAMERA_TOPIC == '/camera/image_raw'
