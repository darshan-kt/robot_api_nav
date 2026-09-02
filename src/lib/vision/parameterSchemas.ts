// src/lib/vision/parameterSchemas.ts
/**
 * The 9 real color_tracker_node.py parameters. Every row's justification is
 * the SAME confirmed fact — not a guess, unlike some of the sibling app's
 * 'investigate' rows: the real node calls self.get_parameter(x).value
 * exactly once inside __init__ and stores it as a plain instance
 * attribute; no add_on_set_parameters_callback is registered anywhere in
 * the shown source, so a running node never observes a live
 * `ros2 param set`. All 9 are tagged 'restart' — none 'live', none
 * 'investigate' — see parameterSchemas.test.ts for the test that protects
 * this literal claim.
 *
 * Source (a separate repo):
 *   /home/darshan/best_nextJS/docs/robotics-projects/PHASE_5_LMS_CONTENT_PROJECT_2.md
 *     §5 Step 10 — color_tracker_node.py, full listing
 *   /home/darshan/best_nextJS/docs/robotics-projects/PHASE_4_DETAILED_PROJECT_DESIGN.md
 *     "PROJECT 2 — VISUAL OBJECT TRACKING" local §6 — Parameters table
 *     (also the source of the hsv_lower/hsv_upper "placeholder, not a real
 *     default" framing — lab lighting varies day to day)
 */
import type { ParameterDef } from './types';

const SOURCE = 'PHASE_5_LMS_CONTENT_PROJECT_2.md §5 Step 10 (color_tracker_node.py) / PHASE_4_DETAILED_PROJECT_DESIGN.md "PROJECT 2" §6 (Parameters)';

const RESTART_NOTE =
  "Read exactly once inside color_tracker_node.py's __init__ via self.get_parameter(x).value and stored as a plain instance attribute — no add_on_set_parameters_callback is registered anywhere in the shown source, so a running node never observes a live ros2 param set. Changing this requires editing color_tracker.yaml and relaunching.";

export const COLOR_TRACKER_PARAMETERS: ParameterDef[] = [
  {
    key: 'hsv_lower',
    label: 'HSV Lower Bound',
    type: 'hsvTriplet',
    default: [0, 120, 70],
    reconfigure: 'restart',
    reconfigureNote:
      RESTART_NOTE +
      ' This exact value is also a documented PLACEHOLDER, not a working general default — lab lighting varies day to day, which is why the course teaches a full recalibration procedure instead of shipping a fixed number.',
    sourceRef: SOURCE,
  },
  {
    key: 'hsv_upper',
    label: 'HSV Upper Bound',
    type: 'hsvTriplet',
    default: [10, 255, 255],
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE + ' Same placeholder caveat as hsv_lower.',
    sourceRef: SOURCE,
  },
  {
    key: 'min_contour_area',
    label: 'Min Contour Area',
    type: 'number',
    unit: 'px²',
    min: 0,
    max: 5000,
    step: 50,
    default: 500,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE,
    sourceRef: SOURCE,
  },
  {
    key: 'centroid_deadzone_px',
    label: 'Centroid Deadzone',
    type: 'number',
    unit: 'px',
    min: 0,
    max: 200,
    step: 5,
    default: 40,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE,
    sourceRef: SOURCE,
  },
  {
    key: 'angular_gain',
    label: 'Angular Gain',
    type: 'number',
    unit: 'rad/s per px',
    min: 0,
    max: 0.05,
    step: 0.001,
    default: 0.005,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE,
    sourceRef: SOURCE,
  },
  {
    key: 'max_linear_speed',
    label: 'Max Linear Speed',
    type: 'number',
    unit: 'm/s',
    min: 0,
    max: 0.5,
    step: 0.01,
    default: 0.12,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE + ' This is the ALWAYS-applied forward speed while tracking — the steering law never scales it down for a large offset.',
    sourceRef: SOURCE,
  },
  {
    key: 'max_angular_speed',
    label: 'Max Angular Speed',
    type: 'number',
    unit: 'rad/s',
    min: 0,
    max: 1.5,
    step: 0.05,
    default: 0.4,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE + " Caps the steering law's proportional term, regardless of how far off-centre the target is.",
    sourceRef: SOURCE,
  },
  {
    key: 'target_lost_timeout_sec',
    label: 'Target Lost Timeout',
    type: 'number',
    unit: 's',
    min: 0.1,
    max: 5,
    step: 0.1,
    default: 1.0,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE + ' Consumed by a SEPARATE 0.1s safety timer, independent of camera frame rate — not the image callback itself.',
    sourceRef: SOURCE,
  },
  {
    key: 'publish_debug_image',
    label: 'Publish Debug Image',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: RESTART_NOTE + ' Gates whether the annotated /color_tracker/debug_image is published.',
    sourceRef: SOURCE,
  },
];
