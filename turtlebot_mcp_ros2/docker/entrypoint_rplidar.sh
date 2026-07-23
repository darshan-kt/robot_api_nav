#!/bin/bash
# ============================================================================
# entrypoint_rplidar.sh — launch the RPLIDAR ROS 2 driver node
#
# Env vars (all optional, matching rplidar_ros launch arg defaults):
#   RPLIDAR_MODEL     which launch file to use, e.g. a1 / a2m12 / a2m7 / a2m8
#                      / a3 / c1 / s1 / s1_tcp / s2 / s2e / s3 / t1  (default: a1)
#   RPLIDAR_PORT       serial device                    (default: /dev/ttyUSB0)
#   RPLIDAR_BAUDRATE   serial baudrate                  (default: 115200)
#   RPLIDAR_FRAME_ID   TF frame published on /scan       (default: laser)
#
# Usage:
#   (no arg) / run   : launch the driver node (default)
#   bash <cmd...>    : drop into a shell / run arbitrary command
# ============================================================================
set -e

source /opt/ros/humble/setup.bash
source /home/rplidar_ws/install/setup.bash

MODE=${1:-run}

if [ "$MODE" = "bash" ]; then
    shift
    exec bash "$@"
fi

RPLIDAR_MODEL=${RPLIDAR_MODEL:-a1}
RPLIDAR_PORT=${RPLIDAR_PORT:-/dev/ttyUSB0}
RPLIDAR_BAUDRATE=${RPLIDAR_BAUDRATE:-115200}
RPLIDAR_FRAME_ID=${RPLIDAR_FRAME_ID:-laser}

echo "====================================================="
echo "[RPLIDAR] model=$RPLIDAR_MODEL port=$RPLIDAR_PORT baud=$RPLIDAR_BAUDRATE frame_id=$RPLIDAR_FRAME_ID"
echo "====================================================="

exec ros2 launch rplidar_ros "rplidar_${RPLIDAR_MODEL}_launch.py" \
    serial_port:="$RPLIDAR_PORT" \
    serial_baudrate:="$RPLIDAR_BAUDRATE" \
    frame_id:="$RPLIDAR_FRAME_ID"
