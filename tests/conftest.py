"""
Shared fixtures.

The gateway package (backend/hive_api_gateway/) is not pip-installed and is
not on sys.path by default — it's a plain directory that gets COPY'd into
its container. Put its parent on sys.path so `from app import ...` resolves
exactly the way it does inside the container, with no packaging changes
needed on the production side.
"""
import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
GATEWAY_ROOT = REPO_ROOT / "backend" / "hive_api_gateway"

# Pin config-relevant env BEFORE app.config is imported anywhere, so tests
# never inherit a developer's shell (a stray ROBOT_ID would change every
# MQTT topic assertion in the suite).
os.environ.setdefault("ROBOT_ID", "robot-1")
os.environ.setdefault("MQTT_HOST", "localhost")
os.environ.setdefault("MQTT_PORT", "1883")

if str(GATEWAY_ROOT) not in sys.path:
    sys.path.insert(0, str(GATEWAY_ROOT))


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return REPO_ROOT


@pytest.fixture(scope="session")
def gateway_root() -> Path:
    return GATEWAY_ROOT
