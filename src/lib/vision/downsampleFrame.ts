// src/lib/vision/downsampleFrame.ts
import type { CameraFrame } from './types';

/**
 * Nearest-neighbor downsample of a CameraFrame's pixels to a fixed small
 * working size, before running the flood-fill-based vision pipeline —
 * decided at the CALL SITE (CalibratePanel/PipelineStages), not inside
 * visionMath.ts, precisely so the pure algorithm functions there stay
 * resolution-agnostic and cheap to unit-test at tiny sizes. See
 * visionMath.ts's detectTarget() performance note.
 */
export function downsampleFrame(frame: CameraFrame, targetWidth: number, targetHeight: number): CameraFrame {
  if (frame.width === targetWidth && frame.height === targetHeight) return frame;

  const out = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y++) {
    const srcY = Math.min(frame.height - 1, Math.floor((y * frame.height) / targetHeight));
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.min(frame.width - 1, Math.floor((x * frame.width) / targetWidth));
      const srcIdx = (srcY * frame.width + srcX) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      out[dstIdx] = frame.pixels[srcIdx];
      out[dstIdx + 1] = frame.pixels[srcIdx + 1];
      out[dstIdx + 2] = frame.pixels[srcIdx + 2];
      out[dstIdx + 3] = frame.pixels[srcIdx + 3];
    }
  }

  return { ...frame, width: targetWidth, height: targetHeight, pixels: out };
}
