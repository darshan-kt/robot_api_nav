#!/bin/bash
# ============================================================================
# entrypoint_sim.sh — TurtleBot3 Gazebo world + Nav2
#
# Modes:
#   (no arg) / gui   : Gazebo with GUI client + Nav2 with RViz  (needs X11)
#   headless         : gzserver only + Nav2 without RViz        (no X needed)
#   bash <cmd...>    : drop into a shell / run arbitrary command
#
# Startup sequence (all readiness-gated, no blind sleeps for critical steps):
#   1. Launch Gazebo world (WITHOUT the launch file's 30s-timeout spawner)
#   2. Wait until /spawn_entity service exists → world fully loaded
#   3. Spawn the robot at (SPAWN_X, SPAWN_Y, SPAWN_YAW)
#   4. Launch Nav2
#   5. Wait for AMCL → publish /initialpose with the SAME spawn coordinates,
#      so RViz/Nav2 localization starts exactly where Gazebo put the robot
# ============================================================================
set -e

source /opt/ros/humble/setup.bash

# Gazebo's own env (GAZEBO_MODEL_PATH → /usr/share/gazebo-11/models with
# ground_plane + sun, plugin/resource paths). Without this, the world's
# ground plane fails to load and the robot falls into the void.
source /usr/share/gazebo/setup.sh
export GAZEBO_MODEL_PATH=$GAZEBO_MODEL_PATH:/opt/ros/humble/share/turtlebot3_gazebo/models

# Don't contact the online model database — all needed models are local.
export GAZEBO_MODEL_DATABASE_URI=""

MODE=${1:-gui}

# Robot spawn pose (overridable via docker-compose environment)
SPAWN_X=${SPAWN_X:--2.0}
SPAWN_Y=${SPAWN_Y:--0.5}
SPAWN_YAW=${SPAWN_YAW:-0.0}

if [ "$MODE" = "bash" ]; then
    shift
    exec bash "$@"
fi

echo "====================================================="
echo "[SIM] TurtleBot3: $TURTLEBOT3_MODEL | RMW: $RMW_IMPLEMENTATION | DOMAIN: $ROS_DOMAIN_ID | mode: $MODE"
echo "[SIM] Spawn pose: x=$SPAWN_X y=$SPAWN_Y yaw=$SPAWN_YAW"
echo "====================================================="

# ── 1. Gazebo world (server + optional GUI + robot_state_publisher) ─────────
# NOTE: turtlebot3_world.launch.py includes its own spawner with a hard 30s
# timeout that dies on slow cold boots. We launch the pieces ourselves and
# spawn the robot only when Gazebo is confirmed ready.
WORLD=/opt/ros/humble/share/turtlebot3_gazebo/worlds/turtlebot3_world.world

echo "[SIM] Launching gzserver..."
ros2 launch gazebo_ros gzserver.launch.py world:=$WORLD \
    init:=true factory:=true force_system:=true &
GZSERVER_PID=$!

if [ "$MODE" != "headless" ]; then
    echo "[SIM] Launching gzclient (GUI)..."
    ros2 launch gazebo_ros gzclient.launch.py &
fi

echo "[SIM] Launching robot_state_publisher..."
ros2 launch turtlebot3_gazebo robot_state_publisher.launch.py use_sim_time:=true &

# ── 2. Wait until Gazebo is fully up (spawn service available) ──────────────
echo "[SIM] Waiting for Gazebo to finish loading..."
until timeout 3 ros2 service type /spawn_entity >/dev/null 2>&1; do
    sleep 2
done
# Give the world a moment to settle physics/ground plane
sleep 5
echo "[SIM] Gazebo is ready."

# ── 3. Spawn the robot (once, only if not already present) ──────────────────
if timeout 4 ros2 topic echo /odom --once >/dev/null 2>&1; then
    echo "[SIM] Robot already present (odom publishing) — skipping spawn."
else
    echo "[SIM] Spawning TurtleBot3 '$TURTLEBOT3_MODEL' at ($SPAWN_X, $SPAWN_Y)..."
    ros2 run gazebo_ros spawn_entity.py \
        -entity "$TURTLEBOT3_MODEL" \
        -file /opt/ros/humble/share/turtlebot3_gazebo/models/turtlebot3_${TURTLEBOT3_MODEL}/model.sdf \
        -x "$SPAWN_X" -y "$SPAWN_Y" -z 0.01 -Y "$SPAWN_YAW"
    echo "[SIM] Robot spawned."
fi

# ── 4. Navigation2 ────────────────────────────────────────────────────────────
if [ "$MODE" = "headless" ]; then
    echo "[SIM] Launching Nav2 (no RViz)..."
    ros2 launch turtlebot3_navigation2 navigation2.launch.py \
        use_sim_time:=true use_rviz:=false &
else
    echo "[SIM] Launching Nav2 (with RViz)..."
    ros2 launch turtlebot3_navigation2 navigation2.launch.py \
        use_sim_time:=true &
fi
NAV2_PID=$!

# ── 5. Auto-set AMCL initial pose to match the Gazebo spawn pose ────────────
(
    source /opt/ros/humble/setup.bash
    echo "[SIM] Waiting for AMCL before setting initial pose..."
    until timeout 3 ros2 service type /amcl/get_state >/dev/null 2>&1; do
        sleep 2
    done
    sleep 4   # let AMCL finish activating

    QZ=$(python3 -c "import math; print(math.sin($SPAWN_YAW/2))")
    QW=$(python3 -c "import math; print(math.cos($SPAWN_YAW/2))")

    for i in 1 2 3 4 5; do
        ros2 topic pub --once /initialpose geometry_msgs/msg/PoseWithCovarianceStamped \
"{header: {frame_id: map},
  pose: {pose: {position: {x: $SPAWN_X, y: $SPAWN_Y, z: 0.0},
                orientation: {z: $QZ, w: $QW}},
         covariance: [0.25,0,0,0,0,0,
                      0,0.25,0,0,0,0,
                      0,0,0,0,0,0,
                      0,0,0,0,0,0,
                      0,0,0,0,0,0,
                      0,0,0,0,0,0.0685]}}" >/dev/null 2>&1
        sleep 3
        if timeout 4 ros2 topic echo /amcl_pose --once >/dev/null 2>&1; then
            echo "[SIM] Initial pose set at ($SPAWN_X, $SPAWN_Y, yaw=$SPAWN_YAW) — AMCL localized."
            break
        fi
        echo "[SIM] Initial pose attempt $i — retrying..."
    done
) &

wait $GZSERVER_PID $NAV2_PID
