#!/usr/bin/env bash
set -euo pipefail

WS=${WS:-/home/ros2_ws}
API_CMD=${API_CMD:-"ros2 launch hive_api_gateway hive_api.launch.py"}
MODE=${1:-just}
BUILD_BASE=${BUILD_BASE:-$WS/build_api}
INSTALL_BASE=${INSTALL_BASE:-$WS/install_api}
LOG_BASE=${LOG_BASE:-$WS/log_api}

if [ "$MODE" = "build" ] || [ "$MODE" = "just" ]; then
  shift || true
fi

echo "[API] Sourcing ROS 2 (Humble) and existing overlay (if any)"
set +u
source /opt/ros/humble/setup.bash || true
[ -f "$INSTALL_BASE/setup.bash" ] && source "$INSTALL_BASE/setup.bash"
set -u

cd "$WS"
if [ "$MODE" = "build" ]; then
  echo "[API] Building workspace at: $WS"

  # Remove stale non-symlink directory that blocks --symlink-install on re-builds
  CONFLICT_PATH="$BUILD_BASE/hive_interfaces/ament_cmake_python/hive_interfaces/hive_interfaces"
  if [ -d "$CONFLICT_PATH" ] && [ ! -L "$CONFLICT_PATH" ]; then
    echo "[API] Removing stale directory blocking symlink-install: $CONFLICT_PATH"
    rm -rf "$CONFLICT_PATH"
  fi

  colcon --log-base "$LOG_BASE" build \
    --symlink-install \
    --build-base "$BUILD_BASE" \
    --install-base "$INSTALL_BASE"
  echo "[API] Build complete."
  exit 0
fi

if [ -f "$INSTALL_BASE/setup.bash" ]; then
  echo "[API] Sourcing workspace overlay"
  set +u
  source "$INSTALL_BASE/setup.bash"
  set -u
else
  echo "[API] WARNING: $INSTALL_BASE/setup.bash not found. Build first with 'build' mode."
fi

if [ $# -gt 0 ]; then
  exec "$@"
fi

echo "[API] Starting: $API_CMD"
exec bash -lc "$API_CMD"
