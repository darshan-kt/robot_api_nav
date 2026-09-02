"""
Black-box checks against the running gateway — exactly the requests the
browser makes, over real HTTP.
"""
import io

import pytest
from PIL import Image

pytestmark = pytest.mark.system


def test_gateway_answers_ping(http):
    r = http.get("/ping")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


def test_gateway_is_connected_to_the_broker(http):
    """If this fails, every command path is down regardless of what else passes."""
    assert http.get("/health").json()["mqtt_connected"] is True


def test_health_reports_the_robot_alive(http):
    body = http.get("/health").json()
    assert body["robot_alive"] is True, \
        f"bridge reports the robot as not alive: {body}"


def test_health_names_the_three_liveness_topics(http):
    assert set(http.get("/health").json()["topics"]) == \
        {"/cmd_vel", "/scan", "/camera/image_raw"}


def test_localisation_is_available(http):
    """AMCL has to be publishing, or the map marker never moves."""
    body = http.get("/localization").json()
    assert body.get("available") is not False, body.get("reason")
    assert {"col", "row", "yaw_deg", "map_x", "map_y"} <= set(body)


def test_localisation_is_inside_the_map_bounds(http):
    loc = http.get("/localization").json()
    if loc.get("available") is False:
        pytest.skip("no localisation yet")
    meta = http.get("/map/meta").json()
    assert meta["bounds"]["x"][0] <= loc["map_x"] <= meta["bounds"]["x"][1]
    assert meta["bounds"]["y"][0] <= loc["map_y"] <= meta["bounds"]["y"][1]


def test_map_image_is_served_and_decodable(http):
    r = http.get("/api/map")
    assert r.status_code == 200
    img = Image.open(io.BytesIO(r.content))
    assert img.format == "PNG"
    assert img.size[0] > 0 and img.size[1] > 0


def test_served_map_matches_the_conversion_metadata(http):
    """The live version of the drift detector in the integration suite."""
    img = Image.open(io.BytesIO(http.get("/api/map").content))
    meta = http.get("/map/meta").json()
    assert img.size == (meta["img_w_px"], meta["img_h_px"])

    yaml_meta = http.get("/api/map/meta").json()
    assert yaml_meta["resolution"] == pytest.approx(meta["resolution"])
    assert yaml_meta["origin_x"] == pytest.approx(meta["origin_x"])
    assert yaml_meta["origin_y"] == pytest.approx(meta["origin_y"])


def test_map_meta_reports_a_mounted_map(http):
    body = http.get("/api/map/meta").json()
    assert body["pgm_exists"] is True and body["map_file"]


def test_preview_conversion_round_trips_through_the_live_service(http):
    """Click a pixel, convert to metres, convert back — must land on the pixel."""
    r = http.post("/map/preview", json={"pixel_waypoints": [{"col": 200, "row": 150, "yaw_deg": 0}]})
    pose = r.json()["poses"][0]["pose"]["position"]
    meta = http.get("/map/meta").json()

    col = (pose["x"] - meta["origin_x"]) / meta["resolution"]
    row = meta["img_h_px"] - 1 - (pose["y"] - meta["origin_y"]) / meta["resolution"]
    assert col == pytest.approx(200, abs=0.1)
    assert row == pytest.approx(150, abs=0.1)


def test_cancel_nav_is_accepted_by_the_live_robot(http):
    """
    Safe to run unconditionally: it can only STOP motion. Also proves the
    full command round trip (gateway -> broker -> bridge -> ROS -> ack).
    """
    r = http.post("/cancel_nav")
    assert r.status_code == 200
    assert "cancelled" in r.json()


def test_invalid_input_is_rejected_by_the_live_service(http):
    assert http.post("/tasks", json={"id": 22, "pixel_waypoints": [{"col": 1}]}).status_code == 422
    assert http.post("/nav_goal", json={}).status_code == 422
    assert http.post("/set_pose", json={}).status_code == 422


def test_map_image_traversal_is_blocked_on_the_live_service(http):
    r = http.get("/map_image", params={"file": "../../../etc/passwd"})
    assert r.status_code in (400, 404)
    assert b"root:" not in r.content


def test_openapi_schema_lists_the_expected_routes(http):
    paths = set(http.get("/openapi.json").json()["paths"])
    assert {"/tasks", "/nav_goal", "/cancel_nav", "/set_pose",
            "/localization", "/health", "/api/map", "/webrtc/offer"} <= paths
