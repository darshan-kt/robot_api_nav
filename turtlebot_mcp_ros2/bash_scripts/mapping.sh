#!/bin/bash
set -e

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."
echo "[INFO] Running from Workspace Root: $(pwd)"

# === 2. Setup ===
source /opt/ros/humble/setup.bash
[ -f install/setup.bash ] && source install/setup.bash
export TURTLEBOT3_MODEL=burger

# === 3. Launch Gazebo (Background) ===
echo "[INFO] Launching Gazebo..."
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &
GAZEBO_PID=$!
sleep 5

# === 4. Launch SLAM Toolbox (Background) ===
echo "[INFO] Launching SLAM Toolbox..."
ros2 launch slam_toolbox online_async_launch.py &
SLAM_PID=$!
sleep 2

# === 5. Launch RViz2 (Background) ===
echo "[INFO] Launching RViz2..."
ros2 run rviz2 rviz2 -d /opt/ros/humble/share/nav2_bringup/rviz/nav2_default_view.rviz &
RVIZ_PID=$!

echo "[INFO] Mapping Started!"
wait $GAZEBO_PID $SLAM_PID $RVIZ_PID