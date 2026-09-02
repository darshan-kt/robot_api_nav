"""
End-to-end mission dispatch: HTTP request -> gateway -> MQTT -> bridge ->
hive_bt_server -> bt_runner -> Nav2, and the ack all the way back.

This is the one path no amount of unit testing can stand in for — it is the
only test that proves the four layers are wired to each other and that the
behaviour name the frontend sends resolves to a tree the runner can load.

Every test here MOVES THE ROBOT and is gated behind HIVE_ALLOW_MOTION=1:

    HIVE_ALLOW_MOTION=1 .venv-test/bin/python -m pytest tests/system -q

Each dispatch is cancelled immediately afterwards, and the waypoint used is
the robot's own current position, so travel is minimal even against real
hardware. Run it against the simulator first regardless.
"""
import time

import pytest

pytestmark = pytest.mark.system


@pytest.fixture
def here(http):
    """The robot's current pixel position — a target it barely has to move to."""
    loc = http.get("/localization").json()
    if loc.get("available") is False:
        pytest.skip("no localisation available")
    return {"col": round(loc["col"]), "row": round(loc["row"]), "yaw_deg": loc["yaw_deg"]}


@pytest.fixture(autouse=True)
def always_stop_afterwards(http, motion):
    """Whatever a test does, the robot is left stopped."""
    yield
    http.post("/cancel_nav")


def test_the_route_planners_own_dispatch_is_accepted(http, here, mqtt_recorder):
    """
    The exact payload SimpleRoutePlannerPage sends: id=22 with
    behavior_name='FollowRoute'. That name only reaches a real tree via
    hive_bt_server's alias table — this is the live proof it still does.
    """
    r = http.post("/tasks", json={
        "id": 22, "behavior_name": "FollowRoute", "pixel_waypoints": [here],
    })
    assert r.status_code == 200, r.text

    body = r.json()
    assert body["accepted"] is True
    assert body["source"] == "pixel_waypoints"

    ack = mqtt_recorder.wait_for(
        "task/ack", timeout=15.0,
        match=lambda p: isinstance(p, dict) and p.get("task_id") == body["task_id"])
    assert ack["accepted"] is True


def test_the_dispatched_task_carries_map_frame_poses_onto_the_bus(http, here, mqtt_recorder):
    """
    The layering contract: pixels are converted in the gateway, so the ROS
    side only ever sees metres. A pixel value leaking through here would
    drive the robot far off the map.
    """
    r = http.post("/tasks", json={"id": 22, "behavior_name": "FollowRoute",
                                  "pixel_waypoints": [here]})
    task_id = r.json()["task_id"]

    cmd = mqtt_recorder.wait_for(
        "cmd/task", timeout=15.0,
        match=lambda p: isinstance(p, dict) and p.get("task_id") == task_id)

    meta = http.get("/map/meta").json()
    pos = cmd["poses"][0]["pose"]["position"]
    assert meta["bounds"]["x"][0] <= pos["x"] <= meta["bounds"]["x"][1]
    assert meta["bounds"]["y"][0] <= pos["y"] <= meta["bounds"]["y"][1]


def test_direct_nav2_dispatch_is_accepted(http, here):
    """The /nav_goal path, which bypasses the behaviour-tree layer entirely."""
    r = http.post("/nav_goal", json={"pixel_waypoints": [here]})
    assert r.status_code == 200, r.text

    body = r.json()
    assert body["accepted"] is True
    assert body["goal_id"]
    assert body["nav_mode"] in ("navigate_through_poses", "goal_pose_fallback")


def test_a_dispatched_goal_can_be_cancelled(http, here):
    """
    Dispatch, then stop — the operator's abort path, end to end.

    The target is deliberately ~2 m away (40 px at 0.05 m/px): a goal at the
    robot's own position completes within the second and there is then
    nothing left to cancel, which reports cancelled:false for entirely
    legitimate reasons and would make this test meaningless.
    """
    far = {**here, "col": here["col"] + 40, "row": here["row"] + 40}
    dispatch = http.post("/nav_goal", json={"pixel_waypoints": [far]})
    assert dispatch.status_code == 200, dispatch.text
    if dispatch.json().get("nav_mode") == "goal_pose_fallback":
        pytest.skip("robot took the /goal_pose fallback — not cancellable by design")

    time.sleep(1.5)

    r = http.post("/cancel_nav")
    assert r.status_code == 200
    assert r.json()["cancelled"] is True, \
        "an active NavigateThroughPoses goal reported as not cancelled"


def test_a_multi_waypoint_route_is_accepted(http, here):
    """Routes are the product's headline feature; single-waypoint success
    doesn't prove the iteration path works."""
    second = {**here, "col": here["col"] + 2, "row": here["row"] + 2}
    r = http.post("/tasks", json={"id": 22, "behavior_name": "FollowRoute",
                                  "pixel_waypoints": [here, second]})
    assert r.status_code == 200, r.text
    assert r.json()["accepted"] is True


def test_the_robot_reports_a_plan_after_dispatch(http, here, mqtt_recorder):
    """
    Nav2 actually planned: a non-empty /plan is the first observable sign
    the goal reached the planner rather than just being acknowledged.
    """
    http.post("/nav_goal", json={"pixel_waypoints": [
        {**here, "col": here["col"] + 10, "row": here["row"] + 10}]})

    plan = mqtt_recorder.wait_for(
        "plan", timeout=20.0,
        match=lambda p: isinstance(p, dict) and len(p.get("points", [])) > 0)
    assert len(plan["points"]) > 0
