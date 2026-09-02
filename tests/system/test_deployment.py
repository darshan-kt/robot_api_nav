"""
Deployment-shape checks: the containers, the served frontend bundle, and the
configuration that has to line up between them.

These catch the class of problem that only appears once the stack is
assembled — a service not running, the frontend built against the wrong
gateway URL, ROBOT_ID differing between the two halves of the MQTT link.
"""
import json
import os
import re
import shutil
import socket
import subprocess

import pytest

pytestmark = pytest.mark.system

APPSTORE_PORT = int(os.environ.get("HIVE_TEST_APPSTORE_PORT", "5174"))


def _docker(*args) -> str:
    return subprocess.run(["docker", *args], capture_output=True, text=True, timeout=30).stdout


@pytest.fixture(scope="module")
def running_containers() -> str:
    if not shutil.which("docker"):
        pytest.skip("docker CLI not available")
    return _docker("ps", "--format", "{{.Names}}\t{{.Status}}")


# =============================================================================
# Services
# =============================================================================

@pytest.mark.parametrize("needle", ["hive_api", "mqtt_broker", "appstore", "robotstore"])
def test_expected_container_is_running(running_containers, needle):
    assert re.search(needle, running_containers), \
        f"no running container matching '{needle}':\n{running_containers}"


def test_no_container_is_restarting(running_containers):
    """A crash-looping service can still answer one probe between restarts."""
    looping = [line for line in running_containers.splitlines() if "Restarting" in line]
    assert looping == [], f"containers stuck restarting: {looping}"


def test_the_frontend_is_served(http):
    import httpx
    with httpx.Client(timeout=10.0) as c:
        r = c.get(f"http://localhost:{APPSTORE_PORT}/")
    assert r.status_code == 200
    assert "<div id=\"root\"" in r.text or "<script" in r.text


def test_the_broker_accepts_connections():
    with socket.create_connection(("localhost", 1883), timeout=5):
        pass


# =============================================================================
# Cross-service configuration
# =============================================================================

def test_the_ros_nodes_are_all_up():
    """
    The four processes the whole behaviour layer depends on. `docker ps`
    only proves the container is up, not that the launch file's nodes are.
    """
    if not shutil.which("docker"):
        pytest.skip("docker CLI not available")
    name = next((n for n in _docker("ps", "--format", "{{.Names}}").split()
                 if "robotstore" in n), None)
    if name is None:
        pytest.skip("robotstore container not running")

    procs = subprocess.run(["docker", "exec", name, "ps", "-eo", "args"],
                           capture_output=True, text=True, timeout=30).stdout
    for node in ("hive_bt_server", "bt_runner", "hive_mqtt_bridge", "hive_camera_bridge"):
        assert node in procs, f"{node} is not running inside {name}"


def test_the_gateway_and_the_bridge_share_a_robot_id():
    """
    Nothing fails loudly when these differ — the gateway just never sees the
    robot. Compare the env of both containers directly.
    """
    if not shutil.which("docker"):
        pytest.skip("docker CLI not available")

    def robot_id(match: str):
        name = next((n for n in _docker("ps", "--format", "{{.Names}}").split()
                     if match in n), None)
        if name is None:
            pytest.skip(f"{match} container not running")
        env = json.loads(_docker("inspect", name, "--format", "{{json .Config.Env}}"))
        for entry in env:
            if entry.startswith("ROBOT_ID="):
                return entry.split("=", 1)[1]
        return "robot-1"   # both sides default to this

    assert robot_id("hive_api") == robot_id("robotstore")


def test_the_gateway_serves_the_mounted_operational_map(http, repo_root):
    """
    ROBOT_MAP_DIR is a bind mount. If it points somewhere empty the UI shows
    no map at all, and /api/map 404s rather than erroring loudly.
    """
    body = http.get("/api/map/meta").json()
    assert body["pgm_exists"] is True

    local_maps = {p.name for p in (repo_root / "map").glob("*.pgm")}
    assert body["map_file"] in local_maps, \
        f"gateway serves {body['map_file']!r}, not one of the repo's maps {local_maps}"


def test_cors_is_not_left_wide_open_in_a_public_deployment(http):
    """
    '*' is the documented LAN default and fine here. This test states the
    rule so a public deployment (HIVE_TEST_EXPECT_STRICT_CORS=1) fails
    instead of shipping an open API.
    """
    r = http.get("/ping", headers={"Origin": "https://evil.example.com"})
    allowed = r.headers.get("access-control-allow-origin")
    if os.environ.get("HIVE_TEST_EXPECT_STRICT_CORS") == "1":
        assert allowed != "*", "CORS_ALLOWED_ORIGINS must be set for a public deployment"
    else:
        assert allowed is not None
