// src/lib/vision/content/colorTracker.content.ts
/**
 * SOURCE OF TRUTH — copied, not paraphrased, from a SEPARATE repo:
 *   /home/darshan/best_nextJS/docs/robotics-projects/PHASE_5_LMS_CONTENT_PROJECT_2.md
 *     §5  Implementation — Path B: Build Step-by-Step  -> setupSteps (Steps 1-12)
 *     §8  Expected Results                              -> expectedOutput
 *     §3  Lab Safety Check                               -> safetyChecklist (full text, verbatim)
 *     §9  Verification Checkpoints                        -> checkpoints[] (6 checkpoints, verbatim)
 *     §10 Visual and Video Assets, Quizzes, Practical Assessment
 *                                                          -> quizSections[] (4 sections) + practicalAssessment
 *   Cross-checked against:
 *   /home/darshan/best_nextJS/docs/robotics-projects/PHASE_4_DETAILED_PROJECT_DESIGN.md
 *     section "PROJECT 2 — VISUAL OBJECT TRACKING (`visual_tracking_bot`)"
 *     local §6  Parameters       -> the hsv_lower/hsv_upper "placeholder, not a
 *                                    real default" framing (see parameterSchemas.ts)
 *     local §10 Lab Safety Check -> cross-checked against PHASE_5 §3
 *
 * That doc lives in a different repo and cannot be imported at build time —
 * this file is a manual, verbatim copy with no automated sync. If the
 * course doc changes, update this file by hand and re-diff against the
 * cited sections; do not add new course facts here without a matching
 * citation. This exists specifically so the app and the course never say
 * something different about the same command.
 */
import type { TrackingLabContent } from '../types';

export const COLOR_TRACKER_CONTENT: TrackingLabContent = {
  deviceId: 'color_tracker',
  displayName: 'Visual Object Tracking — color_tracker_node',
  provenance: 'PHASE_5_LMS_CONTENT_PROJECT_2.md §5/§8/§9/§10, cross-checked against PHASE_4_DETAILED_PROJECT_DESIGN.md "PROJECT 2" local §6/§10',

  setupSteps: [
    {
      title: '1. Create the package',
      commands: [
        'cd ~/robot_projects_ws/src',
        'ros2 pkg create visual_tracking_bot --build-type ament_python \\',
        '  --dependencies rclpy sensor_msgs geometry_msgs cv_bridge',
        'mkdir -p visual_tracking_bot/config visual_tracking_bot/launch',
      ],
      note: 'What success looks like: package directory exists with the four dependencies listed in package.xml.',
    },
    {
      title: '2. Minimal node, verify it runs',
      commands: [
        'cd ~/robot_projects_ws',
        'colcon build --packages-select visual_tracking_bot',
        'source install/setup.bash',
        'ros2 run visual_tracking_bot color_tracker_node',
      ],
      note: "What success looks like: the log message 'color_tracker_node is alive' appears, and /color_tracker_node shows up in ros2 node list.",
    },
    {
      title: "3. Subscribe to /camera/color/image_raw, verify data arrives",
      commands: [
        '# Apply Module 0\'s two-step hardware-then-ROS checkpoint for the D435i',
        '# first (lsusb / realsense-viewer, THEN the ROS driver check) — reused,',
        '# not repeated here. Then run with robot_bringup active in another terminal.',
      ],
      note: "What success looks like: log lines showing the image's actual height/width/encoding, read from the message fields — never a fixed resolution assumed in code, since it's configured in robot_bringup/config/realsense.yaml. If it fails: no log output means /camera/color/image_raw isn't publishing — go back to Module 0's D435i checkpoints, not this node.",
    },
    {
      title: '4. cv_bridge conversion',
      commands: [
        '# frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding=\'bgr8\')',
        '# self.get_logger().info(f\'Converted frame shape: {frame.shape}\')',
      ],
      note: "What success looks like: frame.shape logs as (height, width, 3), matching Step 3's reported dimensions, with no exception raised. TROUBLESHOOTING — cv_bridge/OpenCV version mismatch: if imgmsg_to_cv2 raises an error mentioning OpenCV, Python's cv2 module and the OpenCV build ros-jazzy-cv-bridge was compiled against don't match. The fix is prevention, not patching: install OpenCV only via 'apt install python3-opencv', and never run 'pip install opencv-python' alongside it on the same system.",
    },
    {
      title: '5. Calibrate HSV thresholds (standalone tool, run once per lighting setup)',
      commands: ['ros2 run visual_tracking_bot hsv_calibrator'],
      note: 'What this does: shows a live camera feed, a live binary mask, and six trackbars — adjust them until the mask shows your target object as a clean white blob and everything else as black, under your CURRENT, ACTUAL lab lighting. What success looks like: pressing "p" logs a line like "hsv_lower: [0, 120, 70]   hsv_upper: [10, 255, 255]" — copy those exact numbers into config/color_tracker.yaml. If it fails: if no window appears at all, you\'re likely running this over SSH without X11 forwarding. Re-run this any time lighting changes materially — this is a documented re-calibration trigger, not a one-time setup step.',
    },
    {
      title: '6. Apply the mask, publish a debug view',
      commands: [
        'ros2 run rqt_image_view rqt_image_view',
        '# Select /color_tracker/debug_image',
      ],
      note: 'What success looks like: a clean white blob where your target object is, black everywhere else — visually confirming the calibration before any motion logic is added.',
    },
    {
      title: '7. Contour detection and centroid (observation only)',
      commands: [
        '# contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)',
        '# valid = [c for c in contours if cv2.contourArea(c) >= self.min_contour_area]',
        '# largest -> centroid via image moments -> self.get_logger().info(f\'Centroid at ({cx}, {cy})\')',
      ],
      note: 'What success looks like: the logged centroid tracks the object smoothly as you move it by hand in front of the camera, and disappears (no log line) when the object is removed.',
    },
    {
      title: '8. Steering decision (still observation only)',
      commands: [
        '# frame_center_x = frame.shape[1] / 2.0   # read from the actual frame width, never hardcoded',
        '# offset = cx - frame_center_x',
        '# CENTERED / Would TURN RIGHT / Would TURN LEFT, logged only — no /cmd_vel yet',
      ],
      note: undefined,
    },
    {
      title: '9. Lost-target tracking',
      commands: [
        '# on a valid detection: self.last_detection_time = self.get_clock().now()',
        '# when no valid contour is found this frame, simply don\'t update',
        '# last_detection_time — the safety_check timer (Step 10) owns the STOP decision',
      ],
      note: undefined,
    },
    {
      title: '10. Publish /cmd_vel — full node with parameters and safety timer',
      commands: [
        'cd ~/robot_projects_ws',
        'colcon build --packages-select visual_tracking_bot',
        'source install/setup.bash',
      ],
      note: 'The full node: declares all 9 parameters (see the Parameters panel below), subscribes /camera/color/image_raw, publishes /cmd_vel and (if publish_debug_image) /color_tracker/debug_image, and runs a SEPARATE 0.1s safety_check timer — independent of camera frame rate, "same watchdog pattern as Project 1\'s scan_timeout_sec" — that publishes an all-zero Twist once target_lost_timeout_sec elapses since the last valid detection.',
    },
    {
      title: '11. Test with wheels lifted',
      commands: [
        'ros2 launch visual_tracking_bot visual_tracking.launch.py',
        '# second terminal:',
        'ros2 topic echo /cmd_vel',
      ],
      note: "What success looks like: angular.z's sign matches the direction the object needs the robot to turn, magnitude never exceeds max_angular_speed, and it returns to 0.0 when the object sits within centroid_deadzone_px of centre. Remove the object entirely and confirm /cmd_vel goes to all-zero within target_lost_timeout_sec.",
    },
    {
      title: '12. First floor test',
      commands: ['# Low speed, fully cleared path in every direction (per the Lab Safety Check), supervised.'],
      note: undefined,
    },
  ],

  expectedOutput:
    'ros2 node list shows /color_tracker_node alongside the robot_bringup nodes. /color_tracker/debug_image shows a clean, isolated mask/annotated frame under current lighting (re-run calibration if it doesn\'t). Presenting the object left/right produces correctly-signed angular.z on /cmd_vel, capped at max_angular_speed. Centering the object returns angular.z to 0.0 with linear.x at max_linear_speed. Removing the object produces a WARN log and a zeroed /cmd_vel within target_lost_timeout_sec.',

  checkpoints: [
    {
      title: 'Checkpoint 1 — Hardware',
      verificationSteps: ["Does lsusb / realsense-viewer show the D435i's RGB stream live, BEFORE any ROS node is started? (Module 0's pattern, reused here without re-deriving it.)"],
      expectedResult: "The D435i's RGB stream is visible at the hardware/USB level before any ROS process runs — isolates a camera/USB problem from a ROS/driver problem.",
    },
    {
      title: 'Checkpoint 2 — ROS 2',
      verificationSteps: ['Does realsense2_camera_node start cleanly, and does /camera/color/image_raw appear in `ros2 topic list`?'],
      expectedResult: 'realsense2_camera_node starts without error and /camera/color/image_raw is listed.',
    },
    {
      title: 'Checkpoint 3 — Data',
      verificationSteps: [
        'Does `ros2 topic hz /camera/color/image_raw` show a steady rate?',
        'Does the cv_bridge conversion in the node complete without throwing across a sustained run (not just once)?',
      ],
      expectedResult: 'A steady publish rate, and zero cv_bridge exceptions over a sustained (≥2 minute) run.',
    },
    {
      title: 'Checkpoint 4 — Algorithm',
      verificationSteps: [
        "Under the lab's ACTUAL current lighting, does the calibrated HSV mask isolate the target with minimal noise (checked visually via /color_tracker/debug_image)?",
        'Does the computed centroid stay stable — not jumping erratically frame-to-frame — when the object is held still?',
      ],
      expectedResult: 'A clean, isolated mask under current lighting, and a centroid that stays put when the object doesn\'t move.',
    },
    {
      title: 'Checkpoint 5 — Control',
      verificationSteps: [
        'With wheels lifted, moving the object left/right by hand: does `ros2 topic echo /cmd_vel` show angular.z with the correct sign and a magnitude that respects max_angular_speed?',
        'Does it return to zero when the object sits inside centroid_deadzone_px?',
      ],
      expectedResult: 'Correctly-signed, correctly-capped angular.z that returns to exactly zero inside the deadzone.',
    },
    {
      title: 'Checkpoint 6 — Physical Robot',
      verificationSteps: [
        'On the floor at low speed, in a fully cleared area: does the robot smoothly follow a slowly-moved object without oscillating side to side?',
        'Does it correctly stop (not spin) within target_lost_timeout_sec when the object is removed or occluded?',
      ],
      expectedResult: 'Smooth following with no oscillation, and a clean STOP (never a spin/search) within the configured timeout when the target is lost.',
    },
  ],

  safetyChecklist: {
    title: 'Lab Safety Check (Project 2-specific) — this project has NO obstacle sensing at all',
    items: [
      "The floor-test area must be COMPLETELY clear in EVERY direction the robot could possibly turn toward — not just along the target object's path — because this project cannot detect or react to any obstacle that isn't the specific tracked color.",
      'Lost-target behavior is a deliberate design decision: on losing the target, the robot STOPS after target_lost_timeout_sec. It does NOT spin or search. A blind spin-search would be a real collision risk specifically because this project has no obstacle sensing to catch a bad guess.',
      "Wheels lifted for all of Step 11 and Checkpoint 5 — verify turning direction before any floor test, exactly as in Project 1.",
      'linear_speed capped at ≤ 0.15 m/s for every floor test, same as Project 1 — with the added note that this project\'s proportional steering can produce continuously varying turn rates, so watch that max_angular_speed is actually being respected, not just angular_gain trusted blindly.',
      'Camera and any debug-viewing laptop/cable kept clear of the wheels.',
      "A person available to physically intervene throughout every floor test, positioned to step into the robot's path if it turns toward an unexpected direction — no sensor will catch that before it happens.",
      "Re-run the HSV calibration procedure (Step 5) if the test session's lighting differs from when hsv_lower/hsv_upper were last set — a stale calibration is a software-correctness issue that manifests as physically unpredictable turning, not just a vision bug.",
      'Battery charge sufficient for the full test session.',
    ],
  },

  quizSections: [
    {
      sectionTitle: 'Project Understanding Quiz',
      items: [
        {
          question: 'Why is the HSV calibration tool a separate script from the tracking node, rather than one combined program?',
          answer:
            'Calibration and tracking are different tasks with different lifetimes — calibration is run once (or occasionally, when lighting changes) by a human adjusting sliders interactively, while tracking runs continuously and autonomously with no human input. Combining them would force the tracking node to carry GUI/trackbar code it never needs while actually running the robot.',
        },
      ],
    },
    {
      sectionTitle: 'Concept Quiz',
      items: [
        {
          question: "Why does the mask isolation step use HSV color space instead of the camera's native BGR/RGB?",
          answer:
            'HSV separates a color\'s hue from its brightness and saturation, so a threshold range can be built around "what color is this" largely independent of lighting intensity — a BGR/RGB threshold would need to account for brightness changes directly in every channel, which is far harder to tune robustly.',
        },
        {
          question: 'What does min_contour_area protect against?',
          answer:
            'Small, noisy blobs in the mask (stray pixels matching the color range by coincidence, or small reflections) being mistaken for the actual target — filtering by a minimum area ensures only a plausibly object-sized region is tracked.',
        },
      ],
    },
    {
      sectionTitle: 'Data Flow Quiz',
      items: [
        {
          question: "If the D435i's resolution is changed in robot_bringup/config/realsense.yaml, does color_tracker_node's code need to change?",
          answer:
            "No — the node reads frame.shape from the actual incoming frame at runtime rather than hardcoding a resolution, so it adapts automatically. This is the same discipline as Module 0's FOV index-math fix, applied to image dimensions instead of scan angles.",
        },
      ],
    },
    {
      sectionTitle: 'Debugging Quiz',
      items: [
        {
          question: "The /color_tracker/debug_image mask preview shows the target object cleanly isolated as a white blob, but the robot doesn't move at all. Which layer do you check first: image processing, centroid math, or the publisher — and why?",
          answer:
            "Check the publisher layer first, specifically whether /cmd_vel is actually being published at all (ros2 topic hz /cmd_vel) and whether anything is subscribed to it (ros2 topic info /cmd_vel). A clean mask already proves image processing is working; the next thing downstream — and the cheapest to check — is whether a Twist message is leaving the node at all, before assuming a subtler bug in the centroid or steering math.",
        },
        {
          question: 'The robot tracks correctly indoors near a window during the day, but loses the target entirely in the evening under artificial light. What\'s the most likely cause, and what\'s the fix?',
          answer:
            'The HSV calibration was performed under different lighting than the current test — natural daylight and artificial lighting produce different color casts. The fix is re-running hsv_calibrator under the current lighting, exactly as the Lab Safety Check names as a required trigger, not re-tuning the tracking node\'s logic.',
        },
      ],
    },
  ],

  practicalAssessment: {
    title: 'Practical Assessment — Can You Build It Yourself?',
    prompt: 'CHALLENGE: Re-calibrate and re-verify the tracker for a NEW colored object, without following the course document\'s steps verbatim.',
    successCriteria: [
      'Choose a different-colored object than the one you calibrated first.',
      "Run hsv_calibrator and determine new hsv_lower/hsv_upper values using only its own on-screen instructions.",
      'Update config/color_tracker.yaml and relaunch.',
      'Confirm Checkpoint 4 (mask isolation, centroid stability) passes for the new object before attempting Checkpoint 5 or any floor test.',
      'Test safely: wheels lifted first, low speed on a fully cleared floor second.',
    ],
  },
};
