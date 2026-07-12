#!/bin/bash

# === 1. Navigate to Workspace Root ===
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../.."


# Keywords to hunt down
# We include 'ros2' and 'python3' because they are often the parents launching the others.
# We include 'gzserver' and 'gzclient' to ensure Gazebo is fully dead.
KEYWORDS="lifecycle_manag|component_conta|ros2|gzserver|gzclient"

echo "[INFO] Searching for stuck processes ($KEYWORDS)..."

# 1. Get PIDs of matching processes (excluding grep and the script itself)
PIDS=$(ps aux | grep -E "$KEYWORDS" | grep -v grep | grep -v "kill_process.sh" | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "[INFO] System is clean. No processes found."
else
    # 2. Force kill them one by one
    for pid in $PIDS; do
        # Check if process still exists before killing
        if ps -p $pid > /dev/null; then
            PNAME=$(ps -p $pid -o comm=)
            echo "[KILL] Force killing PID $pid ($PNAME)..."
            kill -9 $pid
        fi
    done
    
    # 3. Double check
    sleep 1
    REMAINING=$(ps aux | grep -E "$KEYWORDS" | grep -v grep | grep -v "kill_process.sh" | awk '{print $2}')
    
    if [ -z "$REMAINING" ]; then
        echo "[SUCCESS] All targets annihilated."
    else
        echo "[WARN] Some processes are persistent:"
        ps -p $REMAINING
    fi
fi