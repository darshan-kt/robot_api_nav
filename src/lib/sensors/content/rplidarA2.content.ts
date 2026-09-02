// src/lib/sensors/content/rplidarA2.content.ts
/**
 * SOURCE OF TRUTH — copied, not paraphrased, from a SEPARATE repo:
 *   /home/darshan/best_nextJS/docs/hardware/STAGE_4_RPLIDAR_A2_PROFILE.md
 *     §4 "Verified Jazzy Setup Path"     -> setupSteps + expectedOutput
 *     §6 "Ten Most Likely Failure Modes" -> failureModes[]
 *   Cross-checked against:
 *   /home/darshan/best_nextJS/docs/hardware/JAZZY_DEVICE_VERIFICATION.md §1.3a
 *
 * That doc lives in a different repo and cannot be imported at build time —
 * this file is a manual, verbatim copy with no automated sync. If the
 * course doc changes, update this file by hand and re-diff against the
 * cited sections; do not add new hardware facts here without a matching
 * citation. This exists specifically so the app and the course never say
 * something different about the same command.
 */
import type { DeviceContent } from '../types';

export const RPLIDAR_A2_CONTENT: DeviceContent = {
  deviceId: 'rplidar_a2',
  displayName: 'RPLIDAR A2',
  provenance: 'STAGE_4_RPLIDAR_A2_PROFILE.md §4/§6, cross-checked against JAZZY_DEVICE_VERIFICATION.md §1.3a',

  setupSteps: [
    {
      title: '1. Install the officially released Jazzy package',
      commands: ['sudo apt install ros-jazzy-rplidar-ros'],
      note: 'No source build needed.',
    },
    {
      title: '2. Install the udev rule',
      commands: [
        'echo \'KERNEL=="ttyUSB*", ATTRS{idVendor}=="10c4", ATTRS{idProduct}=="ea60", MODE:="0777", SYMLINK+="rplidar"\' | sudo tee /etc/udev/rules.d/rplidar.rules',
        'sudo udevadm control --reload-rules && sudo udevadm trigger',
      ],
      note:
        'Gives the device a stable /dev/rplidar symlink instead of a shifting /dev/ttyUSBn. Do this once, not as a build step. Vendor 10c4 / product ea60 = the CP2102 USB-UART bridge on the A-series adapter cable.',
    },
    {
      title: '3. Confirm the A2 submodel before launching',
      commands: ['dmesg | grep -i "cp210\\|ttyUSB"'],
      note:
        'This determines which launch file and baud rate are correct. Check the label on the unit itself (A2M7 / A2M8 / A2M12), or use dmesg after plugging in.',
    },
    {
      title: '4. Launch with RViz2, using the correct SKU',
      commands: ['ros2 launch rplidar_ros view_rplidar_a2m8_launch.py'],
      note: 'Shown for A2M8 — swap a2m8 for a2m7 or a2m12 to match the actual unit.',
    },
  ],

  expectedOutput:
    '/scan (sensor_msgs/msg/LaserScan) publishing at the driver\'s scan rate; RViz2 opens with the bundled rviz/rplidar_ros.rviz config and subscribes without any QoS changes (RELIABLE matches RELIABLE). If scan data looks garbled rather than absent, re-check the launch file against the unit\'s actual SKU — the baud-rate mismatch is the most likely cause.',

  failureModes: [
    {
      title: 'The Baud Rate Trap',
      diagnosticSignature: 'Error, operation time out. SL_RESULT_OPERATION_TIMEOUT!',
      explanation:
        'Wrong SKU launch file for the physical unit, or running the node directly/via a custom launch setup that never overrides serial_baudrate. The node\'s own compiled-in default (1,000,000 bps) matches no A2 submodel. The device appears in lsusb/dmesg and the udev symlink exists, but the node logs this error at startup — the initial device-info/health handshake fails because the bytes are framed at the wrong rate. A sharper, more precise signature than "garbled scan data": it surfaces as a logged startup error, before any scan data would even begin.',
    },
    {
      title: 'channel_type left at a non-serial value',
      diagnosticSignature: 'Error, cannot connect to the ip addr %s with the tcp port %s.',
      explanation:
        'A realistic mistake given the same package also supports TCP/UDP-connected models (e.g. the S1\'s TCP variant) — copying parameters from the wrong example. This exact logged string immediately points at the actual misconfigured field.',
    },
    {
      title: 'Serial port permission denied',
      diagnosticSignature: 'Error, cannot bind to the specified serial port %s.',
      explanation:
        'The upstream README\'s own recommended workaround (sudo chmod 777 /dev/ttyUSB0) is documented as not universally sufficient — a real user report was closed without confirming a fix worked. The udev-rule path (step 2 above) is "a better way" than the chmod workaround, and this course\'s setup sequence already uses it as primary, not as a fallback.',
    },
    {
      title: 'udev rule not installed or not reloaded',
      diagnosticSignature: 'No such file or directory',
      explanation:
        'The device is fully functional at /dev/ttyUSB0, but the expected /dev/rplidar symlink never appears. Any command referencing /dev/rplidar fails plainly, while the same command against /dev/ttyUSB0 directly may succeed — teaches the distinction between "the device exists" and "the path this course\'s instructions expect exists."',
    },
    {
      title: "The official README's own typo",
      diagnosticSignature: 'No such file or directory (cd src/rpldiar_ros/)',
      explanation:
        '"rpldiar_ros" is misspelled in the upstream README (should be "rplidar_ros", the actual cloned directory name from its own earlier git clone step). A learner following the upstream README directly (not this course\'s already-correct sequence) hits this — a genuinely good "official docs aren\'t infallible, read the error before assuming you did something wrong" moment.',
    },
    {
      title: 'Insufficient USB port power',
      diagnosticSignature: 'Failed to start motor: %08x',
      explanation:
        'Reuses the motor\'s continuous 450-600 mA draw — a real cause of USB power-budget exhaustion. A distinct logged warning (RCLCPP_WARN), not a symptom the learner has to infer from silence.',
    },
    {
      title: 'Device-side internal fault',
      diagnosticSignature: 'Error, RPLidar internal error detected. Please reboot the device to retry.',
      explanation:
        "Unrelated to any setup step — the SDK's own health-check reports an internal error. The fix (power-cycle) is explicit in the error text itself, worth teaching as \"read the whole error message, sometimes it already tells you the fix.\"",
    },
    {
      title: 'Physical/cable disconnect mid-operation',
      diagnosticSignature: 'lost connection',
      explanation:
        'A learner may assume a successful launch means the connection is stable indefinitely. A real, live-demonstrable failure mode (unplug the cable mid-scan) with zero risk to the hardware.',
    },
    {
      title: 'Invalid custom scan_mode override',
      diagnosticSignature: "scan mode '%s' is not supported by lidar, supported modes:",
      explanation:
        "If a learner manually sets scan_mode to something the specific unit doesn't support, the driver prints the actual valid list — a rare case where the error message itself is the complete answer, worth calling out as a model of what a good error message does.",
    },
    {
      title: 'An unlisted/older submodel (e.g. A2M6)',
      diagnosticSignature: 'no error at all — just no matching launch file to run',
      explanation:
        "No view_rplidar_a2m6_*_launch.py exists in the current package, and a real user hit exactly this. This course does not have verified confirmation of the A2M6's exact baud rate and states that honestly rather than guessing; a learner with this submodel needs to adapt an existing launch file's parameters by hand, starting from the closest documented variant and confirming with dmesg/serial testing rather than assuming coverage exists.",
    },
  ],
};
