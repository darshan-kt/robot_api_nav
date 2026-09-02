// src/lib/sensors/SensorDataSource.ts
import type { DeviceId, DeviceStatus, FrameForDevice, ParamValue, SourceKind } from './types';

/**
 * THE seam. Every component under src/components/sensors/ and the page
 * itself consume this interface via useSensorSource() — never a concrete
 * implementation directly. MockSensorSource is the only implementation
 * today; a future LiveSensorSource (WebSocket-backed, per
 * docs/SensorsApp.md Part 3.1's multiplexed /api/sensors design) can slot
 * in by satisfying this contract alone.
 *
 * See docs/HardwareSensorsLab.md's "backend implementer checklist" for the
 * literal list of behaviours a LiveSensorSource must uphold beyond just
 * type-checking against this interface.
 */
export interface SensorDataSource {
  readonly kind: SourceKind;

  /**
   * Starts streaming only once the first subscriber for a device appears
   * (opt-in cost model, matching useScan's convention — nothing runs until
   * something asks for it). Returns an unsubscribe function; the last
   * unsubscribe for a device stops that device's stream.
   */
  subscribe<D extends DeviceId>(
    deviceId: D,
    onFrame: (frame: FrameForDevice<D>) => void
  ): () => void;

  getParameterValue(deviceId: DeviceId, key: string): ParamValue | undefined;

  /**
   * 'live'/'investigate'-tagged params (per parameterSchemas.ts) apply on
   * the next tick. 'restart'-tagged params are STAGED and only take effect
   * after restartDevice() resolves — the honest way to represent a
   * parameter a real driver only ever reads once, at startup.
   */
  setParameterValue(deviceId: DeviceId, key: string, value: ParamValue): void;

  getStatus(deviceId: DeviceId): DeviceStatus;

  /**
   * Applies any staged restart-required parameter changes. A real
   * implementation's actual mechanism — relaunch a `ros2 launch` process?
   * call a reconfigure service? — is explicitly undecided here; this
   * method signature is the seam, not the answer.
   */
  restartDevice(deviceId: DeviceId): Promise<{ ok: boolean; errorMessage?: string }>;

  /** Clears every interval/listener for every device. Must leave nothing
   *  scheduled — see MockSensorSource.test.ts's dispose() coverage. */
  dispose(): void;
}
