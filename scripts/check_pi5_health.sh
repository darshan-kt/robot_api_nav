#!/bin/bash
# ============================================================================
# check_pi5_health.sh — Raspberry Pi 5 thermal/power health check
#
# Run this ON THE PI5 ITSELF — not in a container, not over a remote shell
# to a different machine, and not in a dev sandbox. vcgencmd talks directly
# to the SoC firmware, so it isn't reachable any other way.
#
# Sustained ROS 2 + CycloneDDS + Docker load with no active cooling is a
# classic way to hit thermal/under-voltage throttling on a Pi5, and it can
# look exactly like an intermittent hang rather than an obvious crash.
#
# Usage:
#   ./scripts/check_pi5_health.sh            one-shot check
#   ./scripts/check_pi5_health.sh --watch    repeat every 5s (Ctrl+C to stop)
# ============================================================================
set -e

if ! command -v vcgencmd >/dev/null 2>&1; then
    echo "[ERROR] vcgencmd not found."
    echo "        This must run on the Pi5's own OS, not in a container or"
    echo "        over SSH to a different host. On Raspberry Pi OS:"
    echo "          sudo apt install libraspberrypi-bin"
    exit 1
fi

check_bit() {
    local throttled_dec=$1 bit=$2 msg=$3
    if (( (throttled_dec >> bit) & 1 )); then
        echo "  [!] $msg"
        FLAG_HIT=1
    fi
}

check_once() {
    local temp throttled_hex throttled_dec clock_hz clock_mhz
    FLAG_HIT=0

    temp=$(vcgencmd measure_temp | sed -E 's/temp=([0-9.]+).*/\1/')
    throttled_hex=$(vcgencmd get_throttled | sed -E 's/throttled=//')
    throttled_dec=$((throttled_hex))
    clock_hz=$(vcgencmd measure_clock arm | sed -E 's/frequency\([0-9]+\)=([0-9]+)/\1/')
    clock_mhz=$(( clock_hz / 1000000 ))

    echo "[$(date '+%H:%M:%S')] temp=${temp}C  arm_clock=${clock_mhz}MHz  throttled=${throttled_hex}"

    check_bit "$throttled_dec" 0  "Under-voltage detected RIGHT NOW — use the official Pi5 5V/5A USB-C supply, check the cable"
    check_bit "$throttled_dec" 1  "ARM frequency capped RIGHT NOW"
    check_bit "$throttled_dec" 2  "Currently throttled — CPU is being slowed down RIGHT NOW"
    check_bit "$throttled_dec" 3  "Soft temperature limit active RIGHT NOW (throttling to stay under ~80C)"
    check_bit "$throttled_dec" 16 "Under-voltage has occurred since boot"
    check_bit "$throttled_dec" 17 "ARM frequency capping has occurred since boot"
    check_bit "$throttled_dec" 18 "Throttling has occurred since boot"
    check_bit "$throttled_dec" 19 "Soft temperature limit has occurred since boot"

    if [ "$FLAG_HIT" -eq 0 ]; then
        echo "  [OK] No throttling, no under-voltage."
    fi

    if awk "BEGIN { exit !($temp >= 80) }"; then
        echo "  [!] Temp >= 80C — expect throttling soon if not already. A Pi5 under sustained ROS2/Docker load needs active cooling (official Active Cooler or equivalent fan)."
    fi
}

if [ "${1:-}" = "--watch" ]; then
    echo "Watching every 5s — Ctrl+C to stop."
    while true; do check_once; sleep 5; done
else
    check_once
fi
