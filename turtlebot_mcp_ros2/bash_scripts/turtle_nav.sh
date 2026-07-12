#!/bin/bash
set -e

# === Go to workspace ===
# cd ~/turtle_ws

# === Source the workspace ===
source install/setup.bash

# === Export TurtleBot3 model (used by both Gazebo and Nav2) ===
export TURTLEBOT3_MODEL=burger

# === Match the DDS vendor used by the hive containers (CycloneDDS) ===
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_DOMAIN_ID=0

# === Launch Gazebo simulation ===
echo "Launching TurtleBot3 Gazebo world..."
ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py &
GAZEBO_PID=$!

# Wait for Gazebo to load (adjust delay if needed)
sleep 4

# === Launch Navigation2 ===
echo "Launching TurtleBot3 Navigation2..."
ros2 launch turtlebot3_navigation2 navigation2.launch.py use_sim_time:=true &
NAV2_PID=$!

# Wait for both processes to finish
wait $GAZEBO_PID $NAV2_PID
