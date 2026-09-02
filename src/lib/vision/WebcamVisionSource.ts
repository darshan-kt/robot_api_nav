// src/lib/vision/WebcamVisionSource.ts
/**
 * A genuinely real (not simulated) data source: the student's own browser
 * webcam, via getUserMedia. Unlike the sibling Hardware & Sensors Lab's
 * devices (a LIDAR's serial protocol, a depth camera's USB stack — neither
 * reachable from a browser at all), a plain 2D camera is directly
 * accessible client-side with zero backend. Frames flow through the exact
 * same CameraFrame contract MockVisionSource uses, so visionMath.ts never
 * needs to know which source produced them — but every frame still
 * self-declares sourceKind: 'webcam', never 'mock', so the UI stays honest
 * that this is real pixels from the STUDENT's camera, not the robot's.
 *
 * Holds its <video>/<canvas> as plain class fields (document.createElement,
 * not useRef) — this class has no render tree of its own, so React's hook
 * rules simply don't apply here, the same "plain class with state" shape
 * MockSensorSource/MockVisionSource already use for timers.
 */
import { BaseVisionSource } from './BaseVisionSource';
import type { CameraFrame } from './types';

const CAPTURE_FPS = 15;

export class WebcamVisionSource extends BaseVisionSource {
  readonly kind = 'webcam' as const;

  private listeners = new Set<(frame: CameraFrame) => void>();
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async requestAccess(): Promise<{ ok: boolean; errorMessage?: string }> {
    // Checked BEFORE calling getUserMedia at all: some browsers throw a
    // generic, unhelpful TypeError for the insecure-context case rather
    // than a named DOMException, so this is the only reliable way to
    // surface a specific, actionable message for it.
    if (!window.isSecureContext) {
      const msg =
        'Camera access requires HTTPS or localhost — this page is served over plain HTTP, so the browser blocks camera access here.';
      this.lastError = msg;
      return { ok: false, errorMessage: msg };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'This browser does not support camera access (getUserMedia unavailable).';
      this.lastError = msg;
      return { ok: false, errorMessage: msg };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.stream = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      if (video.videoWidth === 0) {
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const msg = 'Could not acquire a 2D canvas context to sample webcam frames.';
        this.lastError = msg;
        return { ok: false, errorMessage: msg };
      }

      this.video = video;
      this.canvas = canvas;
      this.ctx = ctx;
      this.lastError = null;
      return { ok: true };
    } catch (err) {
      const message = this.describeError(err);
      this.lastError = message;
      return { ok: false, errorMessage: message };
    }
  }

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

  dispose(): void {
    this.stop();
    this.listeners.clear();
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    this.video = null;
    this.canvas = null;
    this.ctx = null;
  }

  private describeError(err: unknown): string {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError') {
      return "Camera access denied. Grant permission in your browser's site settings and try again.";
    }
    if (name === 'NotFoundError') {
      return 'No camera found on this device.';
    }
    return `Could not access the camera (${err instanceof Error ? err.message : 'unknown error'}).`;
  }

  private start(): void {
    if (!this.video || !this.canvas || !this.ctx) {
      this.lastError = 'requestAccess() must succeed before streaming can start.';
      return;
    }
    this.online = true;
    this.intervalId = setInterval(() => this.emit(), 1000 / CAPTURE_FPS);
  }

  private stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.online = false;
  }

  private emit(): void {
    if (!this.video || !this.canvas || !this.ctx) return;

    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    const frame: CameraFrame = {
      sourceKind: 'webcam',
      receivedAt: Date.now(),
      topic: '/camera/color/image_raw',
      msgType: 'sensor_msgs/Image',
      width: this.canvas.width,
      height: this.canvas.height,
      pixels: imageData.data,
    };

    this.recordTick();
    for (const listener of this.listeners) listener(frame);
  }
}
