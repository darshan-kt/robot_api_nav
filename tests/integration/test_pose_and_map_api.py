"""
/set_pose, /localization, /map/meta, /map/preview and the map image endpoints.

These are what the Simple Route Planner draws on: if the map served and the
metadata used to convert clicks disagree, every waypoint is silently wrong.
"""
import io

import pytest
from PIL import Image

from app import geometry

pytestmark = pytest.mark.integration


# =============================================================================
# /set_pose
# =============================================================================

def test_set_pose_accepts_a_pixel_waypoint(client, fake_mqtt):
    r = client.post("/set_pose", json={"pixel_waypoint": {"col": 254, "row": 389, "yaw_deg": -3}})
    assert r.status_code == 200
    assert r.json()["source"] == "pixel_waypoint"

    pose, cov = fake_mqtt.published_poses[0]
    assert pose["pose"]["position"]["x"] == pytest.approx(geometry.pixel_to_map(254, 389)[0])
    assert cov is None


def test_set_pose_accepts_map_coords(client, fake_mqtt):
    pose_in = {"header": {"frame_id": "map"},
               "pose": {"position": {"x": 1.5, "y": -2.0, "z": 0.0},
                        "orientation": {"x": 0, "y": 0, "z": 0, "w": 1}}}
    r = client.post("/set_pose", json={"pose": pose_in})
    assert r.json()["source"] == "pose_map_coords"
    assert fake_mqtt.published_poses[0][0]["pose"]["position"]["x"] == 1.5


def test_set_pose_auto_converts_pixel_valued_pose(client, fake_mqtt):
    r = client.post("/set_pose", json={"pose": {
        "pose": {"position": {"x": 300, "y": 300}, "orientation": {"z": 0, "w": 1}}}})
    assert r.json()["source"] == "pose_auto_converted"


def test_set_pose_forwards_custom_covariance(client, fake_mqtt):
    cov = [0.1] * 36
    client.post("/set_pose", json={"pixel_waypoint": {"col": 1, "row": 1}, "covariance": cov})
    assert fake_mqtt.published_poses[0][1] == cov


def test_set_pose_requires_a_pose(client, fake_mqtt):
    assert client.post("/set_pose", json={}).status_code == 422
    assert fake_mqtt.published_poses == []


def test_set_pose_response_echoes_the_converted_pose(client):
    """The UI redraws the marker from this — it must be the map-frame value."""
    body = client.post("/set_pose", json={"pixel_waypoint": {"col": 100, "row": 100}}).json()
    assert body["topic"] == "/initialpose"
    assert body["pose"]["pose"]["position"]["x"] == pytest.approx(geometry.pixel_to_map(100, 100)[0])


# =============================================================================
# /localization
# =============================================================================

def test_localization_reports_unavailable_before_the_first_amcl_message(client):
    body = client.get("/localization").json()
    assert body["available"] is False
    assert "reason" in body


def test_localization_converts_map_metres_back_to_pixels(client, fake_mqtt):
    import math
    map_x, map_y = geometry.pixel_to_map(200, 150)
    fake_mqtt.latest_localisation = {"x": map_x, "y": map_y, "yaw": math.radians(45)}

    body = client.get("/localization").json()
    assert body["col"] == pytest.approx(200, abs=0.1)
    assert body["row"] == pytest.approx(150, abs=0.1)
    assert body["yaw_deg"] == pytest.approx(45.0, abs=0.01)
    assert body["map_x"] == pytest.approx(map_x)


def test_localization_yaw_is_degrees_not_radians(client, fake_mqtt):
    """The bridge publishes radians; the UI draws degrees. Pin the unit hop."""
    import math
    fake_mqtt.latest_localisation = {"x": 0.0, "y": 0.0, "yaw": math.pi}
    assert client.get("/localization").json()["yaw_deg"] == pytest.approx(180.0)


def test_localization_stamps_a_timestamp(client, fake_mqtt):
    import time
    fake_mqtt.latest_localisation = {"x": 0.0, "y": 0.0, "yaw": 0.0}
    ts = client.get("/localization").json()["timestamp"]
    assert abs(ts - int(time.time() * 1000)) < 5000


# =============================================================================
# /map/meta and /map/preview
# =============================================================================

def test_map_meta_exposes_conversion_params_and_bounds(client):
    body = client.get("/map/meta").json()
    for key in ("resolution", "origin_x", "origin_y", "img_w_px", "img_h_px", "frame_id"):
        assert key in body
    assert body["bounds"]["x"] == [geometry.MAP_X_MIN, geometry.MAP_X_MAX]
    assert body["bounds"]["y"] == [geometry.MAP_Y_MIN, geometry.MAP_Y_MAX]


def test_map_preview_is_a_dry_run_that_dispatches_nothing(client, fake_mqtt):
    body = client.post("/map/preview", json={
        "pixel_waypoints": [{"col": 254, "row": 389, "yaw_deg": -3}]}).json()
    assert body["source"] == "pixel_waypoints"
    assert len(body["poses"]) == 1
    assert fake_mqtt.published_tasks == [] and fake_mqtt.published_goals == []


def test_map_preview_matches_what_tasks_would_actually_send(client, fake_mqtt):
    """A preview that disagrees with dispatch is worse than no preview."""
    wps = [{"col": 254, "row": 389, "yaw_deg": -3}, {"col": 100, "row": 20, "yaw_deg": 90}]
    preview = client.post("/map/preview", json={"pixel_waypoints": wps}).json()["poses"]
    client.post("/tasks", json={"id": 22, "pixel_waypoints": wps})
    assert fake_mqtt.published_tasks[0]["poses"] == preview


def test_map_preview_requires_input(client):
    assert client.post("/map/preview", json={}).status_code == 422


# =============================================================================
# /api/map + /api/map/meta — the operational map served to the browser
# =============================================================================

def test_api_map_serves_the_active_pgm_as_png(client, map_dir):
    r = client.get("/api/map")
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    img = Image.open(io.BytesIO(r.content))
    assert img.format == "PNG" and img.size == (4, 4)


def test_api_map_is_served_uncached(client, map_dir):
    """A cached map is a stale map — the operator would plan on the old floor plan."""
    assert "no-cache" in client.get("/api/map").headers.get("cache-control", "")


def test_api_map_404s_with_actionable_detail_when_no_map_is_mounted(client, tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(tmp_path / "empty"))
    r = client.get("/api/map")
    assert r.status_code == 404
    assert "ROBOT_MAP_DIR" in r.json()["detail"]


def test_api_map_meta_reads_the_active_yaml(client, map_dir):
    body = client.get("/api/map/meta").json()
    assert body["resolution"] == 0.07
    assert body["origin_x"] == -1.5 and body["origin_y"] == -2.5
    assert body["map_file"] == "unit_map.pgm"
    assert body["pgm_exists"] is True


def test_api_map_meta_falls_back_to_defaults_without_a_yaml(client, tmp_path, monkeypatch):
    from app import config
    (tmp_path / "bare.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(tmp_path))

    body = client.get("/api/map/meta").json()
    assert body["resolution"] == 0.05
    assert body["map_file"] == "bare.pgm" and body["pgm_exists"] is True


def test_api_map_meta_reports_absence_rather_than_failing(client, tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(tmp_path / "gone"))
    body = client.get("/api/map/meta").json()
    assert body["pgm_exists"] is False and body["map_file"] is None


def test_served_map_and_conversion_metadata_agree(client, repo_root, monkeypatch):
    """
    DRIFT DETECTOR. /api/map/meta reads the live map.yaml; /map/meta returns
    geometry.MAP_META, which is hardcoded in geometry.py. Waypoint conversion
    uses the hardcoded copy. If someone drops in a map with a different
    resolution/origin, the two disagree and every dispatched waypoint lands
    somewhere else — with nothing else in the system noticing.
    """
    from app import config
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(repo_root / "map"))

    live = client.get("/api/map/meta").json()
    hardcoded = client.get("/map/meta").json()

    assert live["resolution"] == pytest.approx(hardcoded["resolution"]), \
        "map.yaml resolution differs from geometry.MAP_META — waypoints will be misplaced"
    assert live["origin_x"] == pytest.approx(hardcoded["origin_x"])
    assert live["origin_y"] == pytest.approx(hardcoded["origin_y"])


def test_served_map_pixel_dimensions_match_conversion_metadata(client, repo_root, monkeypatch):
    """Same drift risk, for image size: MAP_META's img_h_px drives the Y flip."""
    from app import config
    monkeypatch.setattr(config, "ROBOT_MAP_DIR", str(repo_root / "map"))

    img = Image.open(io.BytesIO(client.get("/api/map").content))
    meta = client.get("/map/meta").json()
    assert img.size == (meta["img_w_px"], meta["img_h_px"]), \
        "served map size differs from geometry.MAP_META — the Y flip will be off"


# =============================================================================
# /map_image — bundled resource maps
# =============================================================================

def test_map_image_list_reports_bundled_maps(client):
    body = client.get("/map_image/list").json()
    assert isinstance(body["maps"], list)
    assert body["count"] == len(body["maps"])


@pytest.mark.parametrize("bad", [
    "../../../etc/passwd", "..%2F..%2Fetc%2Fpasswd", "sub/dir/map.pgm",
    "..\\windows\\system32", "map.png", "map.yaml", "map",
])
def test_map_image_rejects_traversal_and_non_pgm_names(client, bad):
    """This endpoint takes a filename straight off the query string."""
    r = client.get("/map_image", params={"file": bad})
    assert r.status_code in (400, 404)
    assert b"root:" not in r.content


def test_map_image_404s_for_an_unknown_pgm(client):
    r = client.get("/map_image", params={"file": "definitely_not_here.pgm"})
    assert r.status_code == 404
