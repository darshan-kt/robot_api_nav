"""
Unit tests for app/config.py — specifically resolve_map_files(), which decides
WHICH map the gateway serves. Picking the wrong .pgm means the operator plans
a route on one floor plan while the robot localises against another, so the
selection rules get pinned precisely.
"""
import pytest

from app import config

pytestmark = pytest.mark.unit


def _write_map_pair(d, stem, image_name=None, resolution=0.05):
    """Create a <stem>.yaml + <stem>.pgm pair; yaml's image: points at image_name."""
    pgm = d / f"{stem}.pgm"
    pgm.write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")
    yaml_path = d / f"{stem}.yaml"
    yaml_path.write_text(
        f"image: {image_name if image_name is not None else pgm.name}\n"
        f"resolution: {resolution}\n"
        "origin: [-10.0, -10.0, 0.0]\n"
    )
    return pgm, yaml_path


# =============================================================================
# Happy paths
# =============================================================================

def test_resolves_a_matching_pgm_yaml_pair(tmp_path):
    pgm, yml = _write_map_pair(tmp_path, "map")
    assert config.resolve_map_files(tmp_path) == (pgm.resolve(), yml)


def test_resolves_a_renamed_map_without_config_change(tmp_path):
    """The documented feature: drop home.pgm + home.yaml in and it just works."""
    pgm, yml = _write_map_pair(tmp_path, "home")
    got_pgm, got_yaml = config.resolve_map_files(tmp_path)
    assert got_pgm.name == "home.pgm" and got_yaml.name == "home.yaml"


def test_yaml_image_field_wins_over_filename_matching(tmp_path):
    """
    Standard map_server convention: the yaml's `image:` is authoritative.
    office.yaml declaring image: floor2.pgm must select floor2.pgm even
    though a same-stem office.pgm also exists.
    """
    (tmp_path / "floor2.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")
    (tmp_path / "office.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")
    (tmp_path / "office.yaml").write_text("image: floor2.pgm\nresolution: 0.05\n")

    pgm, _ = config.resolve_map_files(tmp_path)
    assert pgm.name == "floor2.pgm"


def test_newest_yaml_wins_when_several_are_valid(tmp_path):
    import os, time
    _write_map_pair(tmp_path, "old")
    time.sleep(0.01)
    new_pgm, new_yaml = _write_map_pair(tmp_path, "new")
    # Make the intent explicit rather than relying on filesystem timing.
    os.utime(tmp_path / "old.yaml", (1_000_000, 1_000_000))

    _, yaml_path = config.resolve_map_files(tmp_path)
    assert yaml_path.name == "new.yaml"


def test_subfolders_are_ignored(tmp_path):
    """map/backup_maps/ must not become an ambiguous candidate — the repo
    genuinely has one, holding retired maps."""
    backup = tmp_path / "backup_maps"
    backup.mkdir()
    _write_map_pair(backup, "retired")
    pgm, yml = _write_map_pair(tmp_path, "active")

    got_pgm, got_yaml = config.resolve_map_files(tmp_path)
    assert got_pgm.name == "active.pgm" and got_yaml.name == "active.yaml"


# =============================================================================
# Degraded / fallback paths
# =============================================================================

def test_bare_pgm_with_no_yaml_still_resolves(tmp_path):
    (tmp_path / "solo.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")
    pgm, yaml_path = config.resolve_map_files(tmp_path)
    assert pgm.name == "solo.pgm"
    assert yaml_path is None


def test_yaml_pointing_at_a_missing_pgm_falls_back_to_newest_pgm(tmp_path):
    (tmp_path / "orphan.yaml").write_text("image: does_not_exist.pgm\nresolution: 0.05\n")
    (tmp_path / "real.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")

    pgm, yaml_path = config.resolve_map_files(tmp_path)
    assert pgm.name == "real.pgm"
    assert yaml_path.name == "orphan.yaml"


def test_malformed_yaml_does_not_raise(tmp_path):
    (tmp_path / "broken.yaml").write_text("image: [unclosed\n\t\tbad: yaml:")
    (tmp_path / "fine.pgm").write_bytes(b"P5\n2 2\n255\n\x00\x00\x00\x00")

    pgm, _ = config.resolve_map_files(tmp_path)   # must not raise
    assert pgm.name == "fine.pgm"


def test_missing_directory_returns_none_none(tmp_path):
    assert config.resolve_map_files(tmp_path / "nope") == (None, None)


def test_empty_directory_returns_none_none(tmp_path):
    assert config.resolve_map_files(tmp_path) == (None, None)


# =============================================================================
# Topic naming — every MQTT assertion in the suite depends on this contract
# =============================================================================

def test_topic_prefix_is_derived_from_robot_id():
    assert config.TOPIC_PREFIX == f"hive/{config.ROBOT_ID}"


@pytest.mark.parametrize("suffix", [
    "telemetry", "localisation", "plan", "scan", "health",
    "cmd/task", "cmd/velocity", "cmd/goal", "cmd/cancel_nav",
    "cmd/set_pose", "cmd/webrtc_offer",
    "task/ack", "goal/ack", "cancel_nav/ack", "webrtc/answer",
])
def test_topic_builds_a_fully_qualified_name(suffix):
    assert config.topic(suffix) == f"hive/{config.ROBOT_ID}/{suffix}"


def test_ack_timeouts_leave_margin_over_the_bridge_side_budget():
    """
    The bridge spends up to 3s on wait_for_server per nav stack, and caps
    cmd/goal dispatch at 4.5s (_GOAL_ACK_BUDGET_S). The gateway's timeouts
    must sit ABOVE those or it returns 504 while the robot is still
    legitimately accepting the goal.
    """
    assert config.TASK_ACK_TIMEOUT_S >= 8.0
    assert config.GOAL_ACK_TIMEOUT_S > 4.5
    assert config.CANCEL_ACK_TIMEOUT_S > 0
    assert config.CAMERA_OFFER_TIMEOUT_S > 5.0   # bridge waits 5s on the camera


def test_cors_defaults_to_wildcard_and_is_overridable(monkeypatch):
    """
    Default '*' is documented as LAN-only-safe. This pins BOTH halves: the
    permissive default, and that CORS_ALLOWED_ORIGINS actually narrows it —
    the AWS deployment depends on the override working.
    """
    import importlib
    assert config.CORS_ALLOWED_ORIGINS == ["*"]

    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://a.example.com, https://b.example.com")
    reloaded = importlib.reload(config)
    try:
        assert reloaded.CORS_ALLOWED_ORIGINS == ["https://a.example.com", "https://b.example.com"]
    finally:
        monkeypatch.delenv("CORS_ALLOWED_ORIGINS")
        importlib.reload(config)
