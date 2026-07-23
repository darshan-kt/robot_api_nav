#!/bin/bash
set -e

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."

# === 2. Setup ===
source /opt/ros/humble/setup.bash
[ -f install/setup.bash ] && source install/setup.bash

# === 3. Args ===
# Usage: ./bash_scripts/rplidar.sh [model] [serial_port] [baudrate]
#   model: a1 (default) | a2m12 | a2m7 | a2m8 | a3 | c1 | s1 | s1_tcp | s2 | s2e | s3 | t1
RPLIDAR_MODEL=${1:-a1}
RPLIDAR_PORT=${2:-/dev/ttyUSB0}
RPLIDAR_BAUDRATE=${3:-115200}

if [ ! -e "$RPLIDAR_PORT" ]; then
    echo "[WARN] $RPLIDAR_PORT not found. Is the RPLIDAR plugged in?"
    echo "       Check with: ls -l /dev | grep -E 'ttyUSB|rplidar'"
fi

echo "[INFO] Starting RPLIDAR ($RPLIDAR_MODEL) on $RPLIDAR_PORT @ ${RPLIDAR_BAUDRATE}baud ..."
ros2 launch rplidar_ros "rplidar_${RPLIDAR_MODEL}_launch.py" \
    serial_port:="$RPLIDAR_PORT" \
    serial_baudrate:="$RPLIDAR_BAUDRATE"
