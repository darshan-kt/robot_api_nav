// src/lib/vision/types.ts
/**
 * Shared type contract for the Visual Tracking Lab.
 *
 * Deliberately NOT importing from src/lib/sensors/types.ts even where a
 * shape is identical (SetupStep, ReconfigureKind) — each Lab app's seam is
 * meant to stay independently deletable. If Hardware & Sensors Lab were
 * ever removed, this app must not break. See VisionDataSource.ts's header
 * comment for the seam itself.
 */

export type SourceKind = 'mock' | 'webcam' | 'live';

interface FrameBase {
  /** Per-FRAME, not just a static source property — mirrors the sibling
   *  app's FrameBase exactly, for the same reason: the raw-frame inspector
   *  must be honest by construction with zero special-casing. */
  sourceKind: SourceKind;
  receivedAt: number;
}

/**
 * The one payload shape every VisionDataSource must produce identically.
 * Mock and webcam frames are pixel-format-identical (RGBA, row-major, from
 * canvas getImageData()) so visionMath.ts never branches on sourceKind.
 */
export interface CameraFrame extends FrameBase {
  topic: '/camera/color/image_raw';
  msgType: 'sensor_msgs/Image';
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

/** OpenCV's own HSV ranges: H 0-179 (not 0-360), S/V 0-255 (not 0-100) —
 *  matches cv2.inRange's expectations directly, since hsv_lower/hsv_upper
 *  in the real node are compared against cv2.cvtColor(..., BGR2HSV) output
 *  in exactly this range. */
export type HsvTriplet = [number, number, number];

export interface DetectionResult {
  /** width*height, 0|255 — same shape as cv2.inRange's output. */
  mask: Uint8Array;
  contourFound: boolean;
  centroid: { cx: number; cy: number } | null;
  areaPx2: number | null;
  /** cx - frameWidth/2 — signed, positive means the target is right of centre. */
  offsetPx: number | null;
}

export interface TwistCommand {
  linearX: number;
  angularZ: number;
}

export type ParamValue = number | string | boolean | HsvTriplet;

/**
 * Whether a parameter takes effect live, only after a restart, or is
 * genuinely unconfirmed. Every one of this app's 9 parameters is tagged
 * 'restart' — CONFIRMED from the real color_tracker_node.py source (each
 * is read once in __init__ via self.get_parameter(x).value with no
 * add_on_set_parameters_callback registered anywhere), not guessed the way
 * some of the sibling app's 'investigate' rows are.
 */
export type ReconfigureKind = 'live' | 'restart' | 'investigate';

export interface ParameterDef {
  /** Matches the real ROS 2 parameter name declared in color_tracker_node.py. */
  key: string;
  label: string;
  type: 'number' | 'enum' | 'boolean' | 'hsvTriplet';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  default: ParamValue;
  reconfigure: ReconfigureKind;
  reconfigureNote: string;
  sourceRef: string;
}

export interface DeviceStatus {
  online: boolean;
  measuredHz: number | null;
  lastError: string | null;
}

// =============================================================================
// Course content — setup instructions, safety checklist, verification
// checkpoints, quizzes. Shape-identical to (not imported from)
// src/lib/sensors/types.ts's SetupStep — see src/lib/vision/content/ for
// the provenance convention.
// =============================================================================

export interface SetupStep {
  title: string;
  commands: string[];
  note?: string;
}

export interface Checkpoint {
  title: string;
  verificationSteps: string[];
  expectedResult: string;
}

export interface QuizQA {
  question: string;
  answer: string;
}

export interface QuizSection {
  sectionTitle: string;
  items: QuizQA[];
}

export interface TrackingLabContent {
  deviceId: 'color_tracker';
  displayName: string;
  setupSteps: SetupStep[];
  expectedOutput: string;
  checkpoints: Checkpoint[];
  safetyChecklist: { title: string; items: string[] };
  quizSections: QuizSection[];
  practicalAssessment: { title: string; prompt: string; successCriteria: string[] };
  provenance: string;
}
