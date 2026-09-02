// src/lib/sensors/MockSensorSource.ts
/**
 * The only SensorDataSource implementation today. Generates synthetic but
 * physically-plausible frames for both devices, and — critically — those
 * frames actually respond to the tunable parameters: changing scan
 * frequency changes real tick timing, changing depth_registration visibly
 * shifts the depth-vs-RGB overlay, changing a 'restart'-tagged parameter
 * only takes effect after restartDevice() resolves.
 *
 * The generator maths below are exported as small pure functions
 * specifically so they're unit-testable without spinning up timers or a
 * whole MockSensorSource instance — see __tests__/MockSensorSource.test.ts.
 */
import type { SensorDataSource } from './SensorDataSource';
import { PARAMETER_SCHEMAS } from './parameterSchemas';
import type {
  AstraFramePair,
  DeviceId,
  DeviceStatus,
  FrameForDevice,
  LidarScanFrame,
  ParamValue,
  RgbFrame,
  DepthFrame,
} from './types';

// =============================================================================
// Deterministic PRNG — seeded jitter, not Math.random(), so generator output
// is reproducible in tests.
// =============================================================================

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// =============================================================================
// RPLIDAR A2 — synthetic room scan
// =============================================================================

/**
 * A2M7/A2M12 run 256000 baud at 0.225° angular resolution; A2M8 runs
 * 115200 baud at 0.45°. Any other value (including the node's own
 * mismatched 1,000,000 bps default) falls back to the finer resolution —
 * this is a rendering default for the GENERAL live view, not a
 * reproduction of the baud-mismatch failure itself, which is a deliberately
 * separate, self-contained demo (see LidarBaudMismatchDemo.tsx).
 */
export function angularResolutionDegForBaud(baud: ParamValue): number {
  return String(baud) === '115200' ? 0.45 : 0.225;
}

export function computeRayCount(angularResolutionDeg: number): number {
  return Math.max(8, Math.round(360 / angularResolutionDeg));
}

interface RoomObstacle {
  angleDeg: number;
  distM: number;
  radiusM: number;
  widthDeg: number;
}

const ROOM_HALF_WIDTH_M = 3.0;
const ROOM_HALF_DEPTH_M = 2.5;
const ROOM_OBSTACLES: RoomObstacle[] = [
  { angleDeg: 40, distM: 1.2, radiusM: 0.3, widthDeg: 6 },
  { angleDeg: 200, distM: 1.8, radiusM: 0.4, widthDeg: 6 },
];

function angularDiffDeg(a: number, b: number): number {
  let diff = ((a - b + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return diff;
}

/**
 * Pure, deterministic (given rayIndex + tick) room-range generator: a
 * rectangular-room raycast with a couple of fixed circular obstacles and
 * small bounded jitter, so the dial visibly "breathes" without being pure
 * noise. Exported directly so its shape (not just MockSensorSource's
 * output) is unit-testable.
 */
export function computeRoomRangeM(angleRad: number, rayIndex: number, tick: number): number {
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const rectRange = Math.min(
    Math.abs(cosA) > 1e-6 ? ROOM_HALF_DEPTH_M / Math.abs(cosA) : Infinity,
    Math.abs(sinA) > 1e-6 ? ROOM_HALF_WIDTH_M / Math.abs(sinA) : Infinity
  );

  let range = rectRange;
  const angleDeg = (angleRad * 180) / Math.PI;
  for (const obs of ROOM_OBSTACLES) {
    const diff = Math.abs(angularDiffDeg(angleDeg, obs.angleDeg));
    if (diff < obs.widthDeg) {
      const candidate = obs.distM - obs.radiusM * (1 - diff / obs.widthDeg);
      if (candidate > 0 && candidate < range) range = candidate;
    }
  }

  const rand = mulberry32(rayIndex * 7919 + tick * 104729 + 1);
  const jitterM = (rand() - 0.5) * 0.04; // +-2cm
  return Math.max(0.05, range + jitterM);
}

// =============================================================================
// Astra Pro — synthetic depth + RGB pair
// =============================================================================

interface SceneShape {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  r: number; // normalized radius
  hue: number;
}

const ASTRA_SCENE_SHAPES: SceneShape[] = [
  { x: 0.3, y: 0.4, r: 0.08, hue: 200 },
  { x: 0.6, y: 0.55, r: 0.12, hue: 30 },
  { x: 0.75, y: 0.25, r: 0.06, hue: 320 },
];

const DEPTH_GRID_COLS = 16;
const DEPTH_GRID_ROWS = 12;
const DEPTH_BACKGROUND_NEAR_M = 3.0;
const DEPTH_BACKGROUND_FAR_M = 4.5;
const DEPTH_BLOB_M = 0.8;

/**
 * THE teaching mechanism. When depth_registration is false (the real
 * driver's actual default per the Astra Pro profile), the depth grid is
 * shifted relative to the RGB scene by a fixed, clearly-visible offset;
 * true zeroes it. Exported as a pure function so the offset itself — not
 * just its downstream rendering — is directly unit-testable.
 */
export function computeRegistrationOffset(registered: boolean): { dxCells: number; dyCells: number } {
  return registered ? { dxCells: 0, dyCells: 0 } : { dxCells: 3, dyCells: -2 };
}

/**
 * Builds a coarse [row][col] depth grid (metres) from the scene shapes: a
 * background gradient plus a near-depth blob per shape, projected into grid
 * cells and shifted by `offset` — the same offset computeRegistrationOffset
 * produces.
 */
export function buildDepthGrid(
  shapes: SceneShape[],
  cols: number,
  rows: number,
  offset: { dxCells: number; dyCells: number }
): number[][] {
  const grid: number[][] = [];
  for (let row = 0; row < rows; row++) {
    const rowArr: number[] = [];
    for (let col = 0; col < cols; col++) {
      rowArr.push(DEPTH_BACKGROUND_NEAR_M + (row / Math.max(1, rows - 1)) * (DEPTH_BACKGROUND_FAR_M - DEPTH_BACKGROUND_NEAR_M));
    }
    grid.push(rowArr);
  }

  for (const shape of shapes) {
    const baseCol = Math.round(shape.x * (cols - 1));
    const baseRow = Math.round(shape.y * (rows - 1));
    const col = clamp(baseCol + offset.dxCells, 0, cols - 1);
    const row = clamp(baseRow + offset.dyCells, 0, rows - 1);
    grid[row][col] = DEPTH_BLOB_M;
    const neighbors: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of neighbors) {
      const r2 = clamp(row + dr, 0, rows - 1);
      const c2 = clamp(col + dc, 0, cols - 1);
      grid[r2][c2] = Math.min(grid[r2][c2], DEPTH_BLOB_M + 0.3);
    }
  }
  return grid;
}

// =============================================================================
// MockSensorSource
// =============================================================================

const DEVICE_IDS: DeviceId[] = ['rplidar_a2', 'astra_pro'];
const MAX_TICK_HISTORY = 20;

type AnyFrameListener = (frame: unknown) => void;

function seedParams(deviceId: DeviceId): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const def of PARAMETER_SCHEMAS[deviceId]) out[def.key] = def.default;
  return out;
}

export class MockSensorSource implements SensorDataSource {
  readonly kind = 'mock' as const;

  private listeners: Record<DeviceId, Set<AnyFrameListener>> = {
    rplidar_a2: new Set(),
    astra_pro: new Set(),
  };

  private intervalIds: Partial<Record<DeviceId, ReturnType<typeof setInterval>>> = {};

  private params: Record<DeviceId, Record<string, ParamValue>> = {
    rplidar_a2: seedParams('rplidar_a2'),
    astra_pro: seedParams('astra_pro'),
  };

  private pendingParams: Record<DeviceId, Record<string, ParamValue>> = {
    rplidar_a2: {},
    astra_pro: {},
  };

  private tickTimestamps: Record<DeviceId, number[]> = { rplidar_a2: [], astra_pro: [] };
  private tickCounters: Record<DeviceId, number> = { rplidar_a2: 0, astra_pro: 0 };
  private lastError: Record<DeviceId, string | null> = { rplidar_a2: null, astra_pro: null };

  // ---------------------------------------------------------------------
  // SensorDataSource
  // ---------------------------------------------------------------------

  subscribe<D extends DeviceId>(deviceId: D, onFrame: (frame: FrameForDevice<D>) => void): () => void {
    const set = this.listeners[deviceId];
    const listener = onFrame as unknown as AnyFrameListener;
    set.add(listener);
    if (set.size === 1) this.startInterval(deviceId);

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      set.delete(listener);
      if (set.size === 0) this.stopInterval(deviceId);
    };
  }

  getParameterValue(deviceId: DeviceId, key: string): ParamValue | undefined {
    return this.params[deviceId][key];
  }

  setParameterValue(deviceId: DeviceId, key: string, value: ParamValue): void {
    const schema = PARAMETER_SCHEMAS[deviceId].find((p) => p.key === key);
    if (!schema) return;

    if (schema.reconfigure === 'restart') {
      this.pendingParams[deviceId][key] = value;
      return;
    }

    this.params[deviceId][key] = value;

    // Timing-affecting live params take effect immediately, not just "next
    // tick" — otherwise a scan_frequency change would silently wait for the
    // OLD interval to fire once more before the new rate is visible.
    if (key === 'scan_frequency' && this.intervalIds[deviceId]) {
      this.stopInterval(deviceId, /* keepListeners */ true);
      this.startInterval(deviceId);
    }
  }

  getStatus(deviceId: DeviceId): DeviceStatus {
    const timestamps = this.tickTimestamps[deviceId];
    let measuredHz: number | null = null;
    if (timestamps.length >= 2) {
      const spanMs = timestamps[timestamps.length - 1] - timestamps[0];
      measuredHz = spanMs > 0 ? Math.round(((timestamps.length - 1) / (spanMs / 1000)) * 100) / 100 : null;
    }
    return {
      online: this.listeners[deviceId].size > 0,
      measuredHz,
      lastError: this.lastError[deviceId],
    };
  }

  async restartDevice(deviceId: DeviceId): Promise<{ ok: boolean; errorMessage?: string }> {
    Object.assign(this.params[deviceId], this.pendingParams[deviceId]);
    this.pendingParams[deviceId] = {};
    this.tickCounters[deviceId] = 0;
    this.tickTimestamps[deviceId] = [];

    const wasRunning = !!this.intervalIds[deviceId];
    if (wasRunning) {
      this.stopInterval(deviceId, /* keepListeners */ true);
      this.startInterval(deviceId);
    }
    return { ok: true };
  }

  dispose(): void {
    for (const deviceId of DEVICE_IDS) {
      this.stopInterval(deviceId, /* keepListeners */ true);
      this.listeners[deviceId].clear();
    }
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private intervalMsFor(deviceId: DeviceId): number {
    if (deviceId === 'rplidar_a2') {
      const hz = Number(this.params.rplidar_a2.scan_frequency) || 10;
      return 1000 / hz;
    }
    const fps = Number(this.params.astra_pro.color_fps) || 30;
    return 1000 / fps;
  }

  private startInterval(deviceId: DeviceId): void {
    const ms = this.intervalMsFor(deviceId);
    this.intervalIds[deviceId] = setInterval(() => {
      if (deviceId === 'rplidar_a2') this.emitLidarFrame();
      else this.emitAstraFrame();
    }, ms);
  }

  private stopInterval(deviceId: DeviceId, keepListeners = false): void {
    const id = this.intervalIds[deviceId];
    if (id) clearInterval(id);
    delete this.intervalIds[deviceId];
    if (!keepListeners) this.listeners[deviceId].clear();
  }

  private recordTick(deviceId: DeviceId): void {
    const arr = this.tickTimestamps[deviceId];
    arr.push(Date.now());
    if (arr.length > MAX_TICK_HISTORY) arr.shift();
  }

  private emitLidarFrame(): void {
    const params = this.params.rplidar_a2;
    const angularResDeg = angularResolutionDegForBaud(params.serial_baudrate);
    const rayCount = computeRayCount(angularResDeg);
    const angleIncrement = (2 * Math.PI) / rayCount;
    const tick = this.tickCounters.rplidar_a2++;

    const rangeMin = 0.15;
    const rangeMax = 12.0;
    const ranges: (number | null)[] = [];
    for (let i = 0; i < rayCount; i++) {
      const angle = -Math.PI + i * angleIncrement;
      const r = Math.min(rangeMax, computeRoomRangeM(angle, i, tick));
      ranges.push(r < rangeMin ? null : Math.round(r * 1000) / 1000);
    }

    const frame: LidarScanFrame = {
      sourceKind: 'mock',
      receivedAt: Date.now(),
      topic: '/scan',
      msgType: 'sensor_msgs/LaserScan',
      frame_id: String(params.frame_id),
      angle_min: -Math.PI,
      angle_max: -Math.PI + (rayCount - 1) * angleIncrement,
      angle_increment: angleIncrement,
      range_min: rangeMin,
      range_max: rangeMax,
      ranges,
    };

    this.recordTick('rplidar_a2');
    for (const listener of this.listeners.rplidar_a2) listener(frame);
  }

  private emitAstraFrame(): void {
    const params = this.params.astra_pro;
    const registered = Boolean(params.depth_registration);
    const width = Number(params.color_width) || 640;
    const height = Number(params.color_height) || 480;
    const tick = this.tickCounters.astra_pro++;

    const rgb: RgbFrame = {
      sourceKind: 'mock',
      receivedAt: Date.now(),
      topic: '/camera/color/image_raw',
      msgType: 'sensor_msgs/Image',
      camera_info: { width, height, frame_id: 'camera_optical_color_frame' },
      encoding: 'mjpeg',
      pattern: { seed: tick, shapes: ASTRA_SCENE_SHAPES },
    };

    const offset = computeRegistrationOffset(registered);
    const grid = buildDepthGrid(ASTRA_SCENE_SHAPES, DEPTH_GRID_COLS, DEPTH_GRID_ROWS, offset);
    const depth: DepthFrame = {
      sourceKind: 'mock',
      receivedAt: Date.now(),
      topic: '/camera/depth/image_raw',
      msgType: 'sensor_msgs/Image',
      camera_info: { width: DEPTH_GRID_COLS, height: DEPTH_GRID_ROWS, frame_id: 'camera_depth_optical_frame' },
      registered,
      depthGridM: grid,
    };

    this.recordTick('astra_pro');
    const pair: AstraFramePair = { depth, rgb };
    for (const listener of this.listeners.astra_pro) listener(pair);
  }
}
