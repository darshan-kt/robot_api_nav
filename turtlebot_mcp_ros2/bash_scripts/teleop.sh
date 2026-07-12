#!/bin/bash
set -e

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."

# === 2. Setup ===
source /opt/ros/humble/setup.bash
[ -f install/setup.bash ] && source install/setup.bash

echo "[INFO] Starting Teleop from: $(pwd)"
echo "-------------------------------------------------"
echo "  Arrow Keys : Move"
echo "  Space      : Emergency Stop"
echo "  q          : Quit"
echo "-------------------------------------------------"

ros2 run key_teleop key_teleop \
    --ros-args \
    --remap key_vel:=/cmd_vel \
    -p forward_rate:=0.22 \
    -p backward_rate:=0.22 \
    -p turn_rate:=1.5 \
    -p key_timeout:=0.3