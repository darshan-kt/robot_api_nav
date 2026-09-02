// src/lib/vision/VisionDataSource.ts
import type { CameraFrame, DeviceStatus, ParamValue, SourceKind } from './types';

/**
 * THE seam for this app. Every component under src/components/vision/ and
 * the page itself consume this via useVisionSource() — never a concrete
 * implementation directly. Two real implementations exist today
 * (MockVisionSource, WebcamVisionSource — both genuinely functional, not
 * stubs); 'live' (a real ROS backend) is reserved and unbuilt, matching
 * the sibling Hardware & Sensors Lab's deferred LiveSensorSource.
 *
 * Deliberately the SAME shape as that sibling app's SensorDataSource
 * (subscribe / getParameterValue / setParameterValue / getStatus /
 * restartDevice / dispose) plus exactly one addition, requestAccess(), for
 * the webcam permission flow. There is NO separate calibration-state pair
 * on this interface — Calibrate mode's HSV trackbars are pure local UI
 * state that never touches the seam at all, exactly mirroring how the real
 * hsv_calibrator.py never touches the tracker's ROS parameters; the only
 * bridge between the two tools is a human (or, here, a button) copying six
 * numbers across, via the ordinary setParameterValue() every other
 * parameter already uses. See CalibratePanel.tsx / VisionParameterPanel.tsx.
 */
export interface VisionDataSource {
  readonly kind: SourceKind;

  /** Opt-in — nothing captures/streams until the first subscriber appears,
   *  matching useScan's convention. */
  subscribeCamera(onFrame: (frame: CameraFrame) => void): () => void;

  /**
   * hsv_lower/hsv_upper plus the other 7 color_tracker_node.py parameters —
   * ALL restart-staged. Confirmed, not guessed: the real node reads every
   * one exactly once inside __init__ via self.get_parameter(x).value and
   * stores it as a plain instance attribute, with no
   * add_on_set_parameters_callback registered anywhere in the shown
   * source, so a running node never observes ros2 param set.
   */
  getParameterValue(key: string): ParamValue | undefined;
  /** The value staged for the next restartDevice() call, if any —
   *  undefined when nothing is pending for this key. This is what lets two
   *  different UI surfaces (CalibratePanel's "Copy to Track Config" button
   *  and VisionParameterPanel's own controls) both stage the SAME
   *  parameter and stay consistent: VisionParameterPanel re-derives its
   *  displayed value from getPendingValue() ?? getParameterValue()
   *  whenever the Track tab becomes active, rather than trusting stale
   *  local state that only its own edits would have updated. */
  getPendingValue(key: string): ParamValue | undefined;
  setParameterValue(key: string, value: ParamValue): void;
  restartDevice(): Promise<{ ok: boolean; errorMessage?: string }>;

  getStatus(): DeviceStatus;

  /**
   * Webcam-only meaning: requests getUserMedia permission/access.
   * MockVisionSource implements this as an immediate no-op success, so
   * callers above the seam (SourceKindSwitch) never need an instanceof
   * check to know whether "requesting access" makes sense for the current
   * source.
   */
  requestAccess(): Promise<{ ok: boolean; errorMessage?: string }>;

  /** Clears every interval/stream/DOM resource. Must leave nothing
   *  scheduled and no camera stream held open. */
  dispose(): void;
}
