"""
Unit tests for app/geometry.py — the pixel <-> map-frame conversion that
every waypoint the operator clicks passes through before it becomes a Nav2
goal. A silent error here doesn't crash anything; it drives the robot to
the wrong place, so these tests pin the exact numeric contract.
"""
import math

import pytest

from app import geometry

pytestmark = pytest.mark.unit


# =============================================================================
# pixel_to_map / map_to_pixel
# =============================================================================

def test_pixel_origin_is_top_left_and_maps_to_max_y():
    """row=0 is the TOP of the image, which is MAXIMUM map Y (Y is flipped)."""
    x, y = geometry.pixel_to_map(0, 0)
    assert x == pytest.approx(geometry.MAP_META["origin_x"])
    assert y == pytest.approx(
        geometry.MAP_META["origin_y"]
        + (geometry.MAP_META["img_h_px"] - 1) * geometry.MAP_META["resolution"]
    )


def test_pixel_bottom_left_maps_to_origin():
    """The bottom-left pixel is the map origin — the ROS map_server convention."""
    x, y = geometry.pixel_to_map(0, geometry.MAP_META["img_h_px"] - 1)
    assert (x, y) == pytest.approx(
        (geometry.MAP_META["origin_x"], geometry.MAP_META["origin_y"])
    )


def test_one_pixel_step_is_exactly_one_resolution_step():
    x0, y0 = geometry.pixel_to_map(100, 100)
    x1, y1 = geometry.pixel_to_map(101, 101)
    res = geometry.MAP_META["resolution"]
    assert x1 - x0 == pytest.approx(res)
    assert y0 - y1 == pytest.approx(res)   # row grows downward => y shrinks


@pytest.mark.parametrize("col,row", [(0, 0), (12, 7), (200, 350), (383, 383), (254, 389)])
def test_pixel_map_roundtrip_is_stable(col, row):
    """pixel -> map -> pixel must land back on the same pixel.

    Both directions round (3dp / 1dp), so this is the test that catches a
    rounding change that would otherwise drift waypoints by a pixel.
    """
    mx, my = geometry.pixel_to_map(col, row)
    back_col, back_row = geometry.map_to_pixel(mx, my)
    assert back_col == pytest.approx(col, abs=0.05)
    assert back_row == pytest.approx(row, abs=0.05)


def test_pixel_to_map_rounds_to_millimetres():
    x, y = geometry.pixel_to_map(1, 1)
    assert x == round(x, 3) and y == round(y, 3)


# =============================================================================
# Orientation
# =============================================================================

@pytest.mark.parametrize("yaw_deg,expected_z,expected_w", [
    (0,    0.0,      1.0),
    (90,   0.707107, 0.707107),
    (180,  1.0,      0.0),
    (-90, -0.707107, 0.707107),
])
def test_yaw_deg_to_quat_known_values(yaw_deg, expected_z, expected_w):
    q = geometry.yaw_deg_to_quat(yaw_deg)
    assert q["x"] == 0.0 and q["y"] == 0.0
    assert q["z"] == pytest.approx(expected_z, abs=1e-5)
    assert q["w"] == pytest.approx(expected_w, abs=1e-5)


def test_quaternion_is_unit_length():
    for yaw in (-179, -3, 0, 45, 179):
        q = geometry.yaw_deg_to_quat(yaw)
        assert math.hypot(q["z"], q["w"]) == pytest.approx(1.0, abs=1e-5)


@pytest.mark.parametrize("yaw_deg", [-179.0, -90.0, -3.0, 0.0, 45.0, 90.0, 179.0])
def test_yaw_quat_roundtrip(yaw_deg):
    q = geometry.yaw_deg_to_quat(yaw_deg)
    assert geometry.quat_to_yaw_deg(q["z"], q["w"]) == pytest.approx(yaw_deg, abs=0.01)


# =============================================================================
# looks_like_pixels — the auto-detection heuristic
# =============================================================================

def test_map_coords_inside_bounds_are_not_pixels():
    assert geometry.looks_like_pixels(0.0, 0.0) is False
    assert geometry.looks_like_pixels(geometry.MAP_X_MIN, geometry.MAP_Y_MIN) is False
    assert geometry.looks_like_pixels(geometry.MAP_X_MAX, geometry.MAP_Y_MAX) is False


def test_typical_pixel_values_are_detected_as_pixels():
    """Real waypoint clicks land in the hundreds — far outside metre bounds."""
    assert geometry.looks_like_pixels(254, 389) is True
    assert geometry.looks_like_pixels(383, 12) is True


def test_heuristic_blind_spot_is_documented_not_accidental():
    """
    A pixel that happens to fall inside the metre bounds is INDISTINGUISHABLE
    from map coords, and is (correctly, per the heuristic's design) treated as
    metres. For the current 384x384 / origin(-10,-10) / 0.05 map that means
    pixel columns 0..9 and rows 0..9 are ambiguous.

    This is a real operational limit, not a bug in the maths: a waypoint
    clicked in the top-left ~10x10 pixel corner is sent through unconverted.
    The test exists so the limit is visible and so a future map change that
    widens the ambiguous window fails loudly here.
    """
    assert geometry.looks_like_pixels(5, 5) is False       # ambiguous corner
    assert geometry.looks_like_pixels(10.1, 10.1) is True  # just outside


# =============================================================================
# pixels_to_poses
# =============================================================================

def test_pixels_to_poses_shapes_a_posestamped_dict():
    poses = geometry.pixels_to_poses([{"col": 254, "row": 389, "yaw_deg": -3}])
    assert len(poses) == 1
    p = poses[0]
    assert p["header"]["frame_id"] == "map"
    assert set(p["pose"]["position"]) == {"x", "y", "z"}
    assert set(p["pose"]["orientation"]) == {"x", "y", "z", "w"}
    assert p["pose"]["position"]["z"] == 0.0


def test_pixels_to_poses_accepts_x_y_aliases():
    """The frontend has historically sent both {col,row} and {x,y}."""
    a = geometry.pixels_to_poses([{"col": 100, "row": 200, "yaw_deg": 0}])
    b = geometry.pixels_to_poses([{"x": 100, "y": 200, "yaw_deg": 0}])
    assert a == b


def test_pixels_to_poses_defaults_missing_fields():
    poses = geometry.pixels_to_poses([{}])
    assert poses[0]["pose"]["position"]["x"] == pytest.approx(geometry.MAP_META["origin_x"])
    assert poses[0]["pose"]["orientation"] == {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}


def test_pixels_to_poses_preserves_custom_frame_id():
    poses = geometry.pixels_to_poses([{"col": 1, "row": 1, "frame_id": "odom"}])
    assert poses[0]["header"]["frame_id"] == "odom"


def test_pixels_to_poses_preserves_waypoint_order():
    """Route order is the mission — poses must come back in the order clicked."""
    cols = [10, 300, 50, 200]
    poses = geometry.pixels_to_poses([{"col": c, "row": 0} for c in cols])
    assert [p["pose"]["position"]["x"] for p in poses] == [
        geometry.pixel_to_map(c, 0)[0] for c in cols
    ]


# =============================================================================
# auto_convert_poses — the "did the client send pixels?" gate
# =============================================================================

def _pose(x, y, qz=0.0, qw=1.0):
    return {
        "header": {"frame_id": "map"},
        "pose": {
            "position": {"x": x, "y": y, "z": 0.0},
            "orientation": {"x": 0.0, "y": 0.0, "z": qz, "w": qw},
        },
    }


def test_auto_convert_passes_map_coords_through_untouched():
    poses = [_pose(2.8, 0.95), _pose(-3.0, 4.0)]
    out, converted = geometry.auto_convert_poses(poses)
    assert converted is False
    assert out is poses            # same object, not a rebuilt copy


def test_auto_convert_converts_pixel_poses():
    out, converted = geometry.auto_convert_poses([_pose(247, 387)])
    assert converted is True
    expected_x, expected_y = geometry.pixel_to_map(247, 387)
    assert out[0]["pose"]["position"]["x"] == pytest.approx(expected_x)
    assert out[0]["pose"]["position"]["y"] == pytest.approx(expected_y)


def test_auto_convert_decides_on_the_first_pose_for_the_whole_batch():
    """
    Documented behaviour: the FIRST pose decides, and ALL poses convert.
    A mixed batch (pixel first, metres after) therefore mangles the later
    poses — worth pinning, because it means the frontend must never mix
    units within one dispatch.
    """
    mixed = [_pose(300, 300), _pose(1.0, 1.0)]
    out, converted = geometry.auto_convert_poses(mixed)
    assert converted is True
    # The second pose was ALSO treated as pixels (1,1) -> near map origin.
    assert out[1]["pose"]["position"]["x"] == pytest.approx(geometry.pixel_to_map(1, 1)[0])


def test_auto_convert_empty_list_is_a_noop():
    out, converted = geometry.auto_convert_poses([])
    assert out == [] and converted is False


def test_auto_convert_preserves_orientation_through_the_conversion():
    """Yaw must survive quat -> deg -> quat; a 90 deg waypoint stays 90 deg."""
    q = geometry.yaw_deg_to_quat(90)
    out, converted = geometry.auto_convert_poses([_pose(300, 300, q["z"], q["w"])])
    assert converted is True
    assert out[0]["pose"]["orientation"]["z"] == pytest.approx(q["z"], abs=1e-4)
    assert out[0]["pose"]["orientation"]["w"] == pytest.approx(q["w"], abs=1e-4)


def test_auto_convert_tolerates_malformed_poses():
    """A pose missing position/orientation must not raise — it defaults."""
    out, converted = geometry.auto_convert_poses([{"pose": {"position": {"x": 300, "y": 300}}}])
    assert converted is True
    assert out[0]["pose"]["orientation"]["w"] == pytest.approx(1.0)


# =============================================================================
# Map metadata consistency (drift detector)
# =============================================================================

def test_map_bounds_derive_from_map_meta():
    m = geometry.MAP_META
    assert geometry.MAP_X_MAX == pytest.approx(m["origin_x"] + m["img_w_px"] * m["resolution"])
    assert geometry.MAP_Y_MAX == pytest.approx(m["origin_y"] + m["img_h_px"] * m["resolution"])
