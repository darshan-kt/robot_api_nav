// src/lib/sensors/content/astraPro.content.ts
/**
 * SOURCE OF TRUTH — copied, not paraphrased, from a SEPARATE repo:
 *   /home/darshan/best_nextJS/docs/hardware/STAGE_4_ASTRA_PRO_PROFILE.md
 *     §4 "Verified Jazzy Setup Path"     -> setupSteps + expectedOutput
 *     §6 "Ten Most Likely Failure Modes" -> failureModes[]
 *   Cross-checked against:
 *   /home/darshan/best_nextJS/docs/hardware/JAZZY_DEVICE_VERIFICATION.md §2.2a
 *
 * That doc lives in a different repo and cannot be imported at build time —
 * this file is a manual, verbatim copy with no automated sync. If the
 * course doc changes, update this file by hand and re-diff against the
 * cited sections; do not add new hardware facts here without a matching
 * citation. This exists specifically so the app and the course never say
 * something different about the same command.
 */
import type { DeviceContent } from '../types';

export const ASTRA_PRO_CONTENT: DeviceContent = {
  deviceId: 'astra_pro',
  displayName: 'Orbbec Astra Pro',
  provenance: 'STAGE_4_ASTRA_PRO_PROFILE.md §4/§6, cross-checked against JAZZY_DEVICE_VERIFICATION.md §2.2a',

  setupSteps: [
    {
      title: '1. Clone the fork, jazzy branch specifically',
      commands: [
        'cd ~/ros2_ws/src',
        'git clone -b jazzy https://github.com/yosefl20/ros2_astra_camera.git',
      ],
      note: "The upstream repo's master branch is the unfixed original and will not build.",
    },
    {
      title: '2. Native dependencies',
      commands: [
        'sudo apt install libgflags-dev ros-jazzy-image-geometry ros-jazzy-camera-info-manager \\',
        '  ros-jazzy-image-transport ros-jazzy-image-publisher libgoogle-glog-dev libusb-1.0-0-dev libeigen3-dev',
        'git clone https://github.com/libuvc/libuvc.git',
        'cd libuvc && mkdir build && cd build',
        'cmake .. && make -j4',
        'sudo make install && sudo ldconfig',
      ],
      note:
        'libuvc built from source (git clone + cmake + make install) — it has no ROS/apt package.',
    },
    {
      title: '3. ROS 2 dependencies + build',
      commands: [
        'cd ~/ros2_ws',
        'rosdep install --from-paths src --ignore-src -y',
        'colcon build --event-handlers console_direct+ --cmake-args -DCMAKE_BUILD_TYPE=Release',
      ],
      note:
        "The fork's package.xml correctly declares cv_bridge and image_geometry — rosdep pulls them from Jazzy's own official release.",
    },
    {
      title: '4. udev rules — two USB identities in one file',
      commands: [
        'cd ~/ros2_ws/src/ros2_astra_camera/astra_camera/scripts',
        'sudo bash install.sh',
        'sudo udevadm control --reload-rules && sudo udevadm trigger',
      ],
      note: 'Product 0403 (depth/OpenNI2) and product 0501 (RGB/UVC), both vendor 2bc5.',
    },
    {
      title: '5. Confirm both USB identities are visible',
      commands: ['lsusb | grep 2bc5'],
      note:
        'Expect TWO lines at vendor 2bc5 — product 0403 (depth/OpenNI2) and product 0501 (RGB/UVC). One line means a cable or hub problem, not a driver problem — check that first.',
    },
    {
      title: '6. Grant real-time priority before first launch',
      commands: [
        'echo "$USER    -   rtprio   99" | sudo tee /etc/security/limits.d/99-ros2-rt.conf',
        '# Log out and back in (or reboot) for the limit to take effect.',
      ],
      note:
        'Stock Ubuntu 24.04 blocks rtprio for non-root processes by default, and the launch fails without this. Real-user-confirmed, not source-line-confirmed: this requirement lives in the closed/vendored OpenNI2/libuvc driver internals, not this fork\'s own C++ source.',
    },
    {
      title: '7. Clear the semaphore hang, if relaunching after an unclean kill',
      commands: ['ros2 run astra_camera clean_shm_node'],
      note:
        'This is silent and produces no error, only a hang, if skipped. The registered executable is clean_shm_node, not cleanup_shm_node.',
    },
    {
      title: "8. Launch, using the plain Astra Pro's own launch file",
      commands: ['ros2 launch astra_camera astra_pro.launch.xml'],
      note: 'Not astra_pro_plus.launch.xml, which targets a different, newer product.',
    },
  ],

  expectedOutput:
    'One ROS 2 node (astra_camera_node, package astra_camera, namespace /camera) publishing both surfaces: /camera/depth/image_raw + /camera/depth/camera_info (and /camera/depth_registered/points when enable_point_cloud), and /camera/color/image_raw + /camera/color/camera_info. depth_registration defaults to false even though the point-cloud topic is named depth_registered/points — the name alone does not confirm alignment is active.',

  failureModes: [
    {
      title: 'Cloned master instead of jazzy branch',
      diagnosticSignature: 'cv_bridge.h / pinhole_camera_model.h not found',
      explanation:
        'The upstream, unfixed original branch will not build — confirmed from a real user build log.',
    },
    {
      title: 'RGB/UVC device not found or permission-denied',
      diagnosticSignature: 'Find device error <reason> — OR — Permission denied opening /dev/bus/usb/%03d/%03d',
      explanation:
        'Two distinct, exact logged strings for two different root causes. "Find device error" (thrown as a C++ exception — the node visibly crashes) means the device never enumerates. "Permission denied" means it enumerates but the udev rule has not been applied/reloaded yet. A learner can tell which one they hit without guessing.',
    },
    {
      title: 'Depth/OpenNI2 path fails to enumerate',
      diagnosticSignature: 'lsusb | grep 2bc5 shows one line instead of two',
      explanation:
        "The udev rule's 0403 entry not applied, or a cable/hub issue leaving only one of the two USB identities visible — the direct, real-hardware confirmation this course's setup already builds in as a checkpoint before proceeding.",
    },
    {
      title: 'rtprio not granted before first launch',
      diagnosticSignature: 'launch fails (no matching source-line-confirmed log string)',
      explanation:
        "Stock Ubuntu 24.04 blocks real-time priority for non-root users. This behavior lives in the closed/vendored OpenNI2 binary, not this fork's own code — stated as a real-user-confirmed fact, not a source-line-confirmed one, rather than implying a precision this profile doesn't actually have.",
    },
    {
      title: "RViz2 Fixed Frame left on its own default instead of camera_link",
      diagnosticSignature: 'blank RViz2 display, no error',
      explanation:
        "A genuine mismatch against the node's own compiled-in base frame default.",
    },
    {
      title: 'Relaunching after an unclean kill without clearing the semaphore',
      diagnosticSignature: 'silent hang, no error — directly checkable via: ls /dev/shm | grep astra',
      explanation:
        "The semaphore's real name is astra_device_sem — a learner can directly verify a hang's cause rather than taking the diagnosis on faith.",
    },
    {
      title: "depth_registration left at its actual default (false) while assuming the point cloud is pixel-aligned RGB-D",
      diagnosticSignature: 'no error at all',
      explanation:
        'The point cloud publishes, but color and depth are not truly aligned, because the topic is named depth_registered/points. A subtle, name-implies-behavior mismatch rather than a crash — arguably the most instructive "read the parameter, not just the topic name" failure mode either device profile has produced. This is the finding the app\'s own interactive depth_registration toggle demonstrates directly.',
    },
    {
      title: 'Wrong launch file for the exact SKU',
      diagnosticSignature: 'wrong parameter defaults — different UVC VID:PID, different default resolutions',
      explanation:
        'astra_pro_plus.launch.xml against a plain Astra Pro unit, or vice versa. Likely no data, or data on unexpected topic names — directly parallels the RPLIDAR\'s SKU-mismatch failure mode.',
    },
    {
      title: 'Insufficient USB port power under a hub',
      diagnosticSignature:
        'intermittent enumeration — one of the two lsusb lines dropping out under load, or a stream stuttering specifically when both devices run together',
      explanation:
        'This device alone presents two simultaneous USB identities drawing power; adding the RPLIDAR on the same unpowered hub/port is a real, citable way to exceed a bus power budget — the same "power problems mimic driver problems" lesson, now demonstrated on this exact device.',
    },
    {
      title: "Following the fork's own README literally",
      diagnosticSignature: 'galactic not installed — OR — unnecessary, confusing setup friction',
      explanation:
        'Sourcing /opt/ros/galactic/setup.bash on a Jazzy system, or attempting to extract a separate OpenNI SDK tarball the repository no longer requires. Neither is a real device or driver failure — both are documentation debt a learner following the upstream README directly (not this course) would hit and might misattribute to their own environment.',
    },
  ],
};
