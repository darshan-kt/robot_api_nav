// src/lib/sensors/types.ts
/**
 * Shared type contract for the Hardware & Sensors Lab.
 *
 * These types ARE the seam between mock data (today) and a real backend
 * (later): every component under src/components/sensors/ consumes these
 * shapes and a SensorDataSource, never a concrete implementation directly.
 * See docs/SensorsApp.md Part 3.1 for the eventual real-backend contract
 * this is deliberately shaped to match.
 */

export type DeviceId = 'rplidar_a2' | 'astra_pro';

export type SourceKind = 'mock' | 'live';

/**
 * Whether changing a parameter takes effect immediately ('live'), only
 * after a driver restart ('restart' — e.g. anything read once at node
 * startup, like a serial baud rate or a USB stream format), or is
 * genuinely unconfirmed from reading the driver source ('investigate' —
 * never guessed; see parameterSchemas.ts for the real justification per
 * parameter).
 */
export type ReconfigureKind = 'live' | 'restart' | 'investigate';

interface FrameBase {
  /** Per-FRAME, not just a static source property — every payload
   *  self-declares where it came from, so the raw-frame inspector is
   *  honest by construction with no special-casing anywhere else. */
  sourceKind: SourceKind;
  /** ms epoch. age_s = (Date.now() - receivedAt) / 1000, matching the
   *  real bridge's age_s convention (see docs/SensorsApp.md). */
  receivedAt: number;
}

/**
 * Field names match sensor_msgs/msg/LaserScan exactly — this is the one
 * frame shape in this file that IS a real prediction of the eventual wire
 * format (see backend/hive_mqtt_bridge's get_scan() for the pattern this
 * mirrors).
 */
export interface LidarScanFrame extends FrameBase {
  topic: '/scan';
  msgType: 'sensor_msgs/LaserScan';
  frame_id: string;
  angle_min: number;
  angle_max: number;
  angle_increment: number;
  range_min: number;
  range_max: number;
  /** null = out of range / non-finite, same convention as the real
   *  bridge's `math.isfinite(r) else None`. */
  ranges: (number | null)[];
}

export interface CameraInfoLike {
  width: number;
  height: number;
  frame_id: string;
}

/**
 * MOCK-SCOPED, NOT a prediction of the real wire format.
 *
 * depthGridM is a coarse mock payload that exists so MockSensorSource has
 * something to generate and DepthRgbDualView has something to render. A
 * real Astra Pro backend will almost certainly deliver depth differently
 * (e.g. a downsampled real image, or nothing at all if depth stays
 * server-side and only a rendered preview crosses the wire) — see the
 * backend-implementer checklist in docs/HardwareSensorsLab.md before
 * building LiveSensorSource against this shape.
 */
export interface DepthFrame extends FrameBase {
  topic: '/camera/depth/image_raw';
  msgType: 'sensor_msgs/Image';
  camera_info: CameraInfoLike;
  /** Mirrors the real depth_registration parameter's effect — whether
   *  this depth data is aligned to the RGB frame. */
  registered: boolean;
  /** MOCK-ONLY payload — coarse [row][col] grid, metres. */
  depthGridM: number[][];
}

/**
 * MOCK-SCOPED, NOT a prediction of the real wire format.
 *
 * A real RGB stream would almost certainly arrive over WebRTC, exactly
 * like the robot's own camera in src/hooks/useCameraStream.ts (a JSON
 * frame carrying embedded pixel data would be bandwidth-hostile beyond a
 * toy resolution) — this `pattern` field only exists so the mock has
 * something deterministic to draw. camera_info is the one part of this
 * shape likely to survive into a real implementation.
 */
export interface RgbFrame extends FrameBase {
  topic: '/camera/color/image_raw';
  msgType: 'sensor_msgs/Image';
  camera_info: CameraInfoLike;
  encoding: 'mjpeg';
  /** MOCK-ONLY payload — a deterministic procedural scene description. */
  pattern: {
    seed: number;
    shapes: { x: number; y: number; r: number; hue: number }[];
  };
}

export interface AstraFramePair {
  depth: DepthFrame | null;
  rgb: RgbFrame | null;
}

export type FrameForDevice<D extends DeviceId> = D extends 'rplidar_a2'
  ? LidarScanFrame
  : D extends 'astra_pro'
    ? AstraFramePair
    : never;

export type ParamValue = number | string | boolean;

export interface ParameterOption {
  value: string;
  label: string;
}

export interface ParameterDef {
  /** Matches the real ROS 2 parameter name where one exists. */
  key: string;
  label: string;
  type: 'number' | 'enum' | 'boolean' | 'string';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: ParameterOption[];
  default: ParamValue;
  reconfigure: ReconfigureKind;
  /** One-line REAL justification — always present, never blank. See
   *  parameterSchemas.ts for the citation backing each one. */
  reconfigureNote: string;
  /** e.g. "RPLIDAR A2 profile §5 parameter table" — where this fact was
   *  read, so a drift check has somewhere concrete to look. */
  sourceRef: string;
}

export interface DeviceStatus {
  online: boolean;
  /** Measured client-side from frame arrival timestamps — NEVER an
   *  echoed/claimed config value. This is what lets a pending (not yet
   *  applied) restart-required parameter change visibly differ from the
   *  device's actual current behaviour. */
  measuredHz: number | null;
  lastError: string | null;
}

// =============================================================================
// Course content — setup instructions + failure modes, sourced from the
// hardware course profiles (see src/lib/sensors/content/ for provenance).
// =============================================================================

export interface SetupStep {
  /** A short label for the collapsed view, e.g. "1. Install the driver". */
  title: string;
  /** The literal shell command(s) for this step, verbatim from the source. */
  commands: string[];
  /** Explanatory prose accompanying the step, verbatim from the source. */
  note?: string;
}

export interface FailureMode {
  title: string;
  /** The exact diagnostic string/log line the course profile cites. */
  diagnosticSignature: string;
  explanation: string;
}

export interface DeviceContent {
  deviceId: DeviceId;
  displayName: string;
  setupSteps: SetupStep[];
  expectedOutput: string;
  failureModes: FailureMode[];
  /** Citation for the whole content block — file + section in the source repo. */
  provenance: string;
}
