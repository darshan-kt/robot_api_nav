#!/bin/bash
set -e

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."

# === 2. Setup ===
source /opt/ros/humble/setup.bash
[ -f install/setup.bash ] && source install/setup.bash

# Map name (defaults to 'my_map' if not provided)
MAP_NAME=${1:-my_map}

echo "[INFO] Saving map to $(pwd)/${MAP_NAME}..."

# Run the map saver CLI
ros2 run nav2_map_server map_saver_cli -f $MAP_NAME

echo "[SUCCESS] Saved ${MAP_NAME}.yaml and ${MAP_NAME}.pgm in workspace root."