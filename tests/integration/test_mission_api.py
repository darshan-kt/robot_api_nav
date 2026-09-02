"""
POST /tasks and POST /nav_goal — the two mission-dispatch paths.

/tasks goes through the Hive behavior-tree layer; /nav_goal bypasses it
straight to Nav2. Both accept three coordinate formats and both must fail
loudly and distinguishably (503 broker down vs 504 robot silent vs 500
rejected) — an operator has to be able to tell those apart.
"""
import pytest

from app import geometry

pytestmark = pytest.mark.integration


def _pose(x, y, qz=0.0, qw=1.0):
    return {
        "header": {"frame_id": "map"},
        "pose": {"position": {"x": x, "y": y, "z": 0.0},
                 "orientation": {"x": 0.0, "y": 0.0, "z": qz, "w": qw}},
    }


# =============================================================================
# /tasks — input formats
# =============================================================================

def test_pixel_waypoints_are_converted_before_leaving_the_gateway(client, fake_mqtt):
    r = client.post("/tasks", json={
        "id": 22, "behavior_name": "FollowRoute",
        "pixel_waypoints": [{"col": 254, "row": 389, "yaw_deg": -3}],
    })
    assert r.status_code == 200
    assert r.json()["source"] == "pixel_waypoints"

    sent = fake_mqtt.published_tasks[0]
    expected_x, expected_y = geometry.pixel_to_map(254, 389)
    assert sent["poses"][0]["pose"]["position"]["x"] == pytest.approx(expected_x)
    assert sent["poses"][0]["pose"]["position"]["y"] == pytest.approx(expected_y)


def test_poses_in_pixel_space_are_auto_detected(client, fake_mqtt):
    r = client.post("/tasks", json={"id": 22, "poses": [_pose(247, 387)]})
    assert r.json()["source"] == "poses_auto_converted"
    assert fake_mqtt.published_tasks[0]["poses"][0]["pose"]["position"]["x"] < 10


def test_poses_in_map_coords_pass_through_unconverted(client, fake_mqtt):
    r = client.post("/tasks", json={"id": 22, "poses": [_pose(2.8, 0.95)]})
    assert r.json()["source"] == "poses_map_coords"
    assert fake_mqtt.published_tasks[0]["poses"][0]["pose"]["position"]["x"] == 2.8


def test_multi_waypoint_route_keeps_its_order(client, fake_mqtt):
    cols = [100, 200, 300]
    client.post("/tasks", json={
        "id": 22, "behavior_name": "FollowRoute",
        "pixel_waypoints": [{"col": c, "row": 50} for c in cols],
    })
    sent = fake_mqtt.published_tasks[0]["poses"]
    assert [p["pose"]["position"]["x"] for p in sent] == \
           [geometry.pixel_to_map(c, 50)[0] for c in cols]


def test_a_task_with_no_waypoints_is_still_dispatched(client, fake_mqtt):
    """Behaviours like Dock/ReturnHome legitimately carry zero waypoints."""
    r = client.post("/tasks", json={"id": 5, "behavior_name": "ReturnHome"})
    assert r.status_code == 200
    assert r.json()["source"] == "none"
    assert fake_mqtt.published_tasks[0]["poses"] == []


# =============================================================================
# /tasks — payload contract onto the bus
# =============================================================================

def test_task_id_is_generated_when_the_client_omits_it(client, fake_mqtt):
    r = client.post("/tasks", json={"id": 22})
    task_id = r.json()["task_id"]
    assert task_id and fake_mqtt.published_tasks[0]["task_id"] == task_id


def test_client_supplied_task_id_is_preserved(client, fake_mqtt):
    r = client.post("/tasks", json={"id": 22, "task_id": "operator-supplied-id"})
    assert r.json()["task_id"] == "operator-supplied-id"
    assert fake_mqtt.published_tasks[0]["task_id"] == "operator-supplied-id"


@pytest.mark.parametrize("key,value", [
    ("speed", 0.4), ("priority", "high"), ("pause_ms", 1500),
    ("json_payload", '{"custom": 1}'),
])
def test_optional_behaviour_params_are_forwarded(client, fake_mqtt, key, value):
    client.post("/tasks", json={"id": 22, key: value})
    assert fake_mqtt.published_tasks[0][key] == value


def test_unknown_keys_are_not_forwarded(client, fake_mqtt):
    """The bus payload is an allow-list — junk from a client must not ride along."""
    client.post("/tasks", json={"id": 22, "totally_unknown": "junk"})
    assert "totally_unknown" not in fake_mqtt.published_tasks[0]


def test_response_echoes_the_bridge_ack_fields(client, fake_mqtt):
    fake_mqtt.task_ack = {"accepted": True, "behavior": "GoToPose",
                          "waypoint_count": 3, "nav_mode": "nav2_fallback"}
    body = client.post("/tasks", json={"id": 21}).json()
    assert body["behavior"] == "GoToPose"
    assert body["waypoint_count"] == 3
    assert body["nav_mode"] == "nav2_fallback"


# =============================================================================
# /tasks — validation and failure mapping
# =============================================================================

@pytest.mark.parametrize("bad_wp", [{"row": 10}, {"col": 10}, {}])
def test_incomplete_pixel_waypoints_are_rejected_with_422(client, fake_mqtt, bad_wp):
    r = client.post("/tasks", json={"id": 22, "pixel_waypoints": [bad_wp]})
    assert r.status_code == 422
    assert fake_mqtt.published_tasks == [], "invalid input must never reach the bus"


def test_validation_error_names_the_offending_index(client):
    r = client.post("/tasks", json={"id": 22, "pixel_waypoints": [
        {"col": 1, "row": 1}, {"col": 2}]})
    assert r.status_code == 422
    assert "[1]" in r.json()["detail"]


def test_broker_down_is_503(client, offline_mqtt):
    assert client.post("/tasks", json={"id": 22}).status_code == 503


def test_robot_silent_is_504(client, silent_robot):
    assert client.post("/tasks", json={"id": 22}).status_code == 504


def test_bridge_rejection_is_500_with_the_bridge_detail(client, fake_mqtt):
    fake_mqtt.task_ack = {"accepted": False, "detail": "Hive action server unavailable"}
    r = client.post("/tasks", json={"id": 22})
    assert r.status_code == 500
    assert r.json()["detail"] == "Hive action server unavailable"


def test_non_integer_id_is_rejected_with_422(client, fake_mqtt):
    """
    Regression: int(payload["id"]) used to raise straight out of the handler,
    giving the operator a bare 500 + a traceback in the gateway log instead of
    a message naming the bad field.
    """
    r = client.post("/tasks", json={"id": "not-a-number"})
    assert r.status_code == 422
    assert "id" in r.json()["detail"]
    assert fake_mqtt.published_tasks == []


def test_missing_id_defaults_to_zero(client, fake_mqtt):
    client.post("/tasks", json={"behavior_name": "FollowRoute"})
    assert fake_mqtt.published_tasks[0]["id"] == 0


# =============================================================================
# /nav_goal
# =============================================================================

def test_nav_goal_dispatches_the_whole_route_as_one_goal(client, fake_mqtt):
    r = client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0), _pose(2.0, 0.0)]})
    assert r.status_code == 200
    assert len(fake_mqtt.published_goals) == 1
    assert len(fake_mqtt.published_goals[0]) == 2


def test_nav_goal_accepts_pixel_waypoints(client, fake_mqtt):
    r = client.post("/nav_goal", json={"pixel_waypoints": [{"col": 254, "row": 389}]})
    assert r.json()["source"] == "pixel_waypoints"
    assert fake_mqtt.published_goals[0][0]["pose"]["position"]["x"] == \
           pytest.approx(geometry.pixel_to_map(254, 389)[0])


def test_nav_goal_requires_some_waypoints(client, fake_mqtt):
    r = client.post("/nav_goal", json={})
    assert r.status_code == 422
    assert fake_mqtt.published_goals == []


def test_nav_goal_surfaces_the_goal_pose_fallback_to_the_ui(client, fake_mqtt):
    """
    When the action handshake fails the bridge falls back to /goal_pose:
    ONE pose, not cancellable. The UI must be told, or the operator believes
    a multi-waypoint route is running and that Cancel will work.
    """
    fake_mqtt.goal_ack = {
        "accepted": True, "waypoint_count": 1, "nav_mode": "goal_pose_fallback",
        "cancellable": False, "detail": "action server did not answer",
    }
    body = client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0), _pose(2.0, 2.0)]}).json()
    assert body["nav_mode"] == "goal_pose_fallback"
    assert body["cancellable"] is False
    assert body["detail"] == "action server did not answer"


def test_nav_goal_defaults_cancellable_true_when_bridge_omits_it(client, fake_mqtt):
    fake_mqtt.goal_ack = {"accepted": True}
    body = client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0)]}).json()
    assert body["cancellable"] is True
    assert body["nav_mode"] == "navigate_through_poses"
    assert body["waypoint_count"] == 1


def test_nav_goal_returns_the_goal_id_for_later_cancellation(client):
    assert client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0)]}).json()["goal_id"] \
        == "fake-goal-id"


@pytest.mark.parametrize("fixture_name,expected", [("offline_mqtt", 503), ("silent_robot", 504)])
def test_nav_goal_failure_mapping(client, request, fixture_name, expected):
    request.getfixturevalue(fixture_name)
    assert client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0)]}).status_code == expected


def test_nav_goal_rejection_is_500(client, fake_mqtt):
    fake_mqtt.goal_ack = {"accepted": False, "detail": "Nav2 rejected the goal"}
    r = client.post("/nav_goal", json={"poses": [_pose(1.0, 1.0)]})
    assert r.status_code == 500 and r.json()["detail"] == "Nav2 rejected the goal"


# =============================================================================
# /cancel_nav — the stop path
# =============================================================================

def test_cancel_nav_reports_cancelled(client, fake_mqtt):
    body = client.post("/cancel_nav").json()
    assert body["cancelled"] is True
    assert fake_mqtt.cancel_calls == 1


def test_cancel_nav_with_nothing_running_is_200_not_an_error(client, fake_mqtt):
    fake_mqtt.cancel_ack = {"cancelled": False, "detail": "no active goal"}
    r = client.post("/cancel_nav")
    assert r.status_code == 200 and r.json()["cancelled"] is False


def test_cancel_nav_is_idempotent(client, fake_mqtt):
    """The e-stop UI fires this repeatedly; repeats must stay clean 200s."""
    for _ in range(3):
        assert client.post("/cancel_nav").status_code == 200
    assert fake_mqtt.cancel_calls == 3


@pytest.mark.parametrize("fixture_name,expected", [("offline_mqtt", 503), ("silent_robot", 504)])
def test_cancel_nav_failure_mapping(client, request, fixture_name, expected):
    request.getfixturevalue(fixture_name)
    assert client.post("/cancel_nav").status_code == expected
