#!/bin/bash
set -e

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."

# === 2. Setup ===
source /opt/ros/humble/setup.bash
[ -f install/setup.bash ] && source install/setup.bash
export TURTLEBOT3_MODEL=burger

# Default map path (Looks in workspace root by default)
MAP_FILE=${1:-$(pwd)/my_map.yaml}

if [ ! -f "$MAP_FILE" ]; then
    echo "[ERROR] Map file '$MAP_FILE' not found! Run 3_save_map.sh first."
    exit 1
fi

# === 3. Launch Gazebo (Background) ===
echo "[INFO] Launching Gazebo..."
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &
GAZEBO_PID=$!
sleep 5

# === 4. Launch Localization ===
echo "[INFO] Launching AMCL with map: $MAP_FILE"
ros2 launch nav2_bringup localization_launch.py map:=$MAP_FILE use_sim_time:=true &
AMCL_PID=$!

# === 5. Launch RViz2 ===
echo "[INFO] Launching RViz2..."
ros2 run rviz2 rviz2 -d /opt/ros/humble/share/nav2_bringup/rviz/nav2_default_view.rviz &
RVIZ_PID=$!

wait $GAZEBO_PID $AMCL_PID $RVIZ_PID