#!/bin/bash
set -e

# Define Workspace (Matches your Makefile's WORKSPACE_ROBOTSTORE)
WS_DIR="/home/charlie/ros2_ws"
BUILD_BASE="${BUILD_BASE:-$WS_DIR/build}"
INSTALL_BASE="${INSTALL_BASE:-$WS_DIR/install}"
LOG_BASE="${LOG_BASE:-$WS_DIR/log}"

# 1. SOURCE BASE ROS 2
source /opt/ros/humble/setup.bash

cd "$WS_DIR"

# 2. BUILD STEP
# If the first argument passed is "build", trigger colcon
if [ "$1" == "build" ]; then
    echo "====================================================="
    echo "[ENTRYPOINT] Building RobotStore workspace..."
    echo "====================================================="

    # Recover from stale non-symlink path created by previous builds.
    CONFLICT_PATH="$BUILD_BASE/hive_interfaces/ament_cmake_python/hive_interfaces/hive_interfaces"
    if [ -d "$CONFLICT_PATH" ] && [ ! -L "$CONFLICT_PATH" ]; then
        echo "[ENTRYPOINT] Removing stale directory that blocks --symlink-install:"
        echo "             $CONFLICT_PATH"
        rm -rf "$CONFLICT_PATH"
    fi

    colcon --log-base "$LOG_BASE" build \
        --symlink-install \
        --build-base "$BUILD_BASE" \
        --install-base "$INSTALL_BASE"

    # Remove 'build' from the arguments list so it doesn't try to run a command named "build" later
    shift
fi

# 3. SOURCE LOCAL WORKSPACE
if [ -f "$INSTALL_BASE/setup.bash" ]; then
    source "$INSTALL_BASE/setup.bash"
    echo "[ENTRYPOINT] Sourced RobotStore workspace."
else
    echo "[WARNING] Workspace not built yet! Run 'make run-build-robotstore' first."
fi

# 4. EXECUTE COMMAND
# If there are still arguments left (e.g., you ran `make run-bash-robotstore`), execute them.
if [ $# -gt 0 ]; then
    exec "$@"
else
    # DEFAULT RUNTIME COMMAND
    # This runs when you execute `make run-robotstore` without the 'build' argument.
    echo "====================================================="
    echo "[ENTRYPOINT] Starting RobotStore System..."
    echo "====================================================="

    # TODO: Replace the line below with your actual RobotStore launch command
    exec ros2 launch bt_runner hive_server_runner.launch.py

    exec bash
fi
