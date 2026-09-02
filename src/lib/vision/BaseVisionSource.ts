// src/lib/vision/BaseVisionSource.ts
import { COLOR_TRACKER_PARAMETERS } from './parameterSchemas';
import type { CameraFrame, DeviceStatus, ParamValue } from './types';
import type { VisionDataSource } from './VisionDataSource';

const MAX_TICK_HISTORY = 20;

function seedParams(): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const def of COLOR_TRACKER_PARAMETERS) out[def.key] = def.default;
  return out;
}

/**
 * Internal shared implementation — deliberately NOT exported from
 * VisionDataSource.ts (the public seam). Holds the parameter/restart-
 * staging state machine common to MockVisionSource and WebcamVisionSource
 * so it isn't duplicated between them; each still implements
 * subscribeCamera/requestAccess/dispose itself, since those are the parts
 * that are genuinely different between a synthetic scene and a real
 * camera stream.
 */
export abstract class BaseVisionSource implements VisionDataSource {
  abstract readonly kind: VisionDataSource['kind'];

  protected params: Record<string, ParamValue> = seedParams();
  protected pendingParams: Record<string, ParamValue> = {};
  protected tickTimestamps: number[] = [];
  protected lastError: string | null = null;
  protected online = false;

  abstract subscribeCamera(onFrame: (frame: CameraFrame) => void): () => void;
  abstract requestAccess(): Promise<{ ok: boolean; errorMessage?: string }>;
  abstract dispose(): void;

  getParameterValue(key: string): ParamValue | undefined {
    return this.params[key];
  }

  getPendingValue(key: string): ParamValue | undefined {
    return this.pendingParams[key];
  }

  setParameterValue(key: string, value: ParamValue): void {
    const schema = COLOR_TRACKER_PARAMETERS.find((p) => p.key === key);
    if (!schema) return;

    // Every parameter in this app is restart-tagged (confirmed from the
    // real color_tracker_node.py source — see parameterSchemas.ts) — this
    // reads the tag generically rather than hardcoding 'restart', so a
    // future correction to one row's tag is honored automatically.
    if (schema.reconfigure === 'restart') {
      this.pendingParams[key] = value;
    } else {
      this.params[key] = value;
    }
  }

  async restartDevice(): Promise<{ ok: boolean; errorMessage?: string }> {
    Object.assign(this.params, this.pendingParams);
    this.pendingParams = {};
    this.tickTimestamps = [];
    return { ok: true };
  }

  getStatus(): DeviceStatus {
    let measuredHz: number | null = null;
    if (this.tickTimestamps.length >= 2) {
      const spanMs = this.tickTimestamps[this.tickTimestamps.length - 1] - this.tickTimestamps[0];
      measuredHz = spanMs > 0 ? Math.round(((this.tickTimestamps.length - 1) / (spanMs / 1000)) * 100) / 100 : null;
    }
    return { online: this.online, measuredHz, lastError: this.lastError };
  }

  protected recordTick(): void {
    this.tickTimestamps.push(Date.now());
    if (this.tickTimestamps.length > MAX_TICK_HISTORY) this.tickTimestamps.shift();
  }
}
