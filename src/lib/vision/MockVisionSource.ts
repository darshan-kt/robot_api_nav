// src/lib/vision/MockVisionSource.ts
/**
 * The default, always-available, zero-permission source: a procedurally
 * animated colored target drifting against a neutral background, rendered
 * fresh each tick and emitted through the exact same CameraFrame contract
 * WebcamVisionSource uses — so visionMath.ts and every component built on
 * it never need to branch on sourceKind.
 */
import { BaseVisionSource } from './BaseVisionSource';
import type { CameraFrame } from './types';

const MOCK_FPS = 15;
export const MOCK_SCENE_WIDTH = 320;
export const MOCK_SCENE_HEIGHT = 240;

// Tuned to plausibly fall inside the real course default's placeholder
// range ([0,120,70]-[10,255,255], see parameterSchemas.ts) — HSV works out
// to roughly [0, 232, 220], so the mock's default target is genuinely
// capturable by the real default calibration, not just a random color.
const TARGET_COLOR: [number, number, number] = [220, 20, 20];
const BG_COLOR: [number, number, number] = [40, 60, 70];
const TARGET_RADIUS_FRACTION = 0.12;

export class MockVisionSource extends BaseVisionSource {
  readonly kind = 'mock' as const;

  private listeners = new Set<(frame: CameraFrame) => void>();
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private tick = 0;
  private targetVisible = true;

  subscribeCamera(onFrame: (frame: CameraFrame) => void): () => void {
    this.listeners.add(onFrame);
    if (this.listeners.size === 1) this.start();

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.listeners.delete(onFrame);
      if (this.listeners.size === 0) this.stop();
    };
  }

  async requestAccess(): Promise<{ ok: boolean; errorMessage?: string }> {
    return { ok: true }; // the mock has no permission concept — always "available"
  }

  /**
   * Mock-only — deliberately NOT part of the shared VisionDataSource
   * interface, since a real webcam has no way to programmatically hide its
   * own subject. Used exclusively by TargetLostDemo, which imports this
   * class directly and only renders the corresponding control when
   * sourceKind === 'mock' (webcam users are told to cover the lens instead).
   */
  setTargetVisible(visible: boolean): void {
    this.targetVisible = visible;
  }

  dispose(): void {
    this.stop();
    this.listeners.clear();
  }

  private start(): void {
    this.online = true;
    this.intervalId = setInterval(() => this.emit(), 1000 / MOCK_FPS);
  }

  private stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.online = false;
  }

  private emit(): void {
    this.tick++;
    const frame = this.renderFrame();
    this.recordTick();
    for (const listener of this.listeners) listener(frame);
  }

  private renderFrame(): CameraFrame {
    const width = MOCK_SCENE_WIDTH;
    const height = MOCK_SCENE_HEIGHT;
    const pixels = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const base = i * 4;
      pixels[base] = BG_COLOR[0];
      pixels[base + 1] = BG_COLOR[1];
      pixels[base + 2] = BG_COLOR[2];
      pixels[base + 3] = 255;
    }

    if (this.targetVisible) {
      // Deterministic drift (no Math.random) — a smooth left-right sweep,
      // reproducible in tests.
      const targetXFraction = 0.5 + 0.32 * Math.sin(this.tick / 40);
      const cx = Math.round(targetXFraction * width);
      const cy = Math.round(height / 2);
      const radius = Math.round(Math.min(width, height) * TARGET_RADIUS_FRACTION);

      for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y++) {
        for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            const base = (y * width + x) * 4;
            pixels[base] = TARGET_COLOR[0];
            pixels[base + 1] = TARGET_COLOR[1];
            pixels[base + 2] = TARGET_COLOR[2];
            pixels[base + 3] = 255;
          }
        }
      }
    }

    return {
      sourceKind: 'mock',
      receivedAt: Date.now(),
      topic: '/camera/color/image_raw',
      msgType: 'sensor_msgs/Image',
      width,
      height,
      pixels,
    };
  }
}
