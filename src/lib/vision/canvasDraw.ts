// src/lib/vision/canvasDraw.ts
/**
 * Small canvas-drawing helpers shared between CalibratePanel and
 * PipelineStages. DOM-canvas-dependent (jsdom's canvas support is
 * limited), so these are exercised via component smoke tests rather than
 * dedicated unit tests — same precedent as the sibling app's
 * canvas-heavy LidarPolarDial/DepthRgbDualView.
 */
import type { CameraFrame } from './types';

export function drawFrameToCanvas(ctx: CanvasRenderingContext2D, frame: CameraFrame): void {
  if (ctx.canvas.width !== frame.width) ctx.canvas.width = frame.width;
  if (ctx.canvas.height !== frame.height) ctx.canvas.height = frame.height;
  // TS's DOM lib pins ImageData's constructor to Uint8ClampedArray<ArrayBuffer>
  // specifically (excluding SharedArrayBuffer); every pixel buffer in this app
  // is a plain ArrayBuffer end to end (no threads/SharedArrayBuffer anywhere),
  // so this cast is safe, not a type-safety workaround.
  const imageData = new ImageData(frame.pixels as Uint8ClampedArray<ArrayBuffer>, frame.width, frame.height);
  ctx.putImageData(imageData, 0, 0);
}

export function drawMaskToCanvas(ctx: CanvasRenderingContext2D, mask: Uint8Array, width: number, height: number): void {
  if (ctx.canvas.width !== width) ctx.canvas.width = width;
  if (ctx.canvas.height !== height) ctx.canvas.height = height;

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = mask[i];
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  ctx.putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
}
