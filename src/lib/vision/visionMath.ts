// src/lib/vision/visionMath.ts
/**
 * The real vision pipeline, hand-rolled in TypeScript — not a black box.
 * Every function here is pure (plain data in, plain data out; no class, no
 * DOM, no VisionDataSource dependency), so each stage is independently
 * unit-testable with a tiny hand-built pixel buffer. detectTarget() chains
 * them into the one call PipelineStages/TrackPanel/CalibratePanel actually
 * make each tick.
 *
 * Resolution is the CALLER's decision (see the downsample note on
 * detectTarget) — these functions themselves are resolution-agnostic,
 * which is what keeps them cheap to test at 4x4.
 */
import type { CameraFrame, DetectionResult, HsvTriplet, TwistCommand } from './types';

// =============================================================================
// rgbToHsv — OpenCV's own ranges (H 0-179, S/V 0-255), not the web-standard
// H 0-360 / S,V 0-100. Browser pixels are RGBA and never touch a BGR
// representation, so this is the direct equivalent of
// cv2.cvtColor(frame, cv2.COLOR_BGR2HSV) for this pipeline's purposes.
// =============================================================================

export function rgbToHsv(r: number, g: number, b: number): HsvTriplet {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const cmax = Math.max(rf, gf, bf);
  const cmin = Math.min(rf, gf, bf);
  const delta = cmax - cmin;

  let h360 = 0;
  if (delta !== 0) {
    if (cmax === rf) {
      h360 = 60 * (((gf - bf) / delta) % 6);
    } else if (cmax === gf) {
      h360 = 60 * ((bf - rf) / delta + 2);
    } else {
      h360 = 60 * ((rf - gf) / delta + 4);
    }
    if (h360 < 0) h360 += 360;
  }

  const s01 = cmax === 0 ? 0 : delta / cmax;
  const v01 = cmax;

  const hCv = Math.round(h360 / 2); // 0-179
  const sCv = Math.round(s01 * 255);
  const vCv = Math.round(v01 * 255);

  return [hCv, sCv, vCv];
}

// =============================================================================
// inRangeMask — cv2.inRange equivalent. 255 where all 3 HSV channels fall
// within [lower, upper] inclusive, 0 otherwise. Deliberately does NOT
// auto-wrap the hue boundary near 0/179 — cv2.inRange doesn't either; the
// two-mask-OR technique for a wraparound color is the course's own Path C
// stretch exercise, not baked in here.
// =============================================================================

export function inRangeMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  lower: HsvTriplet,
  upper: HsvTriplet
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const pixelCount = width * height;

  for (let i = 0; i < pixelCount; i++) {
    const base = i * 4;
    const [h, s, v] = rgbToHsv(pixels[base], pixels[base + 1], pixels[base + 2]);
    if (h >= lower[0] && h <= upper[0] && s >= lower[1] && s <= upper[1] && v >= lower[2] && v <= upper[2]) {
      mask[i] = 255;
    }
  }

  return mask;
}

// =============================================================================
// findBlobs — connected-components via an iterative (non-recursive, so a
// full-size mask can't blow the call stack) 4-connectivity flood fill.
// Centroid = raw pixel-position average, the exact reduction of
// cv2.moments' m10/m00, m01/m00 for a binary mask. Exact polygon-contour
// extraction (cv2.findContours' literal output) is NOT reproduced — nothing
// downstream needs a polygon, only area + centroid.
// =============================================================================

export function findBlobs(
  mask: Uint8Array,
  width: number,
  height: number
): { areaPx2: number; cx: number; cy: number }[] {
  const visited = new Uint8Array(width * height);
  const blobs: { areaPx2: number; cx: number; cy: number }[] = [];
  const stack: number[] = [];

  for (let start = 0; start < mask.length; start++) {
    if (mask[start] === 0 || visited[start]) continue;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const idx = stack.pop() as number;
      const x = idx % width;
      const y = (idx - x) / width;

      count++;
      sumX += x;
      sumY += y;

      // 4-connectivity: up, down, left, right.
      if (x > 0) {
        const n = idx - 1;
        if (mask[n] !== 0 && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (x < width - 1) {
        const n = idx + 1;
        if (mask[n] !== 0 && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (y > 0) {
        const n = idx - width;
        if (mask[n] !== 0 && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
      if (y < height - 1) {
        const n = idx + width;
        if (mask[n] !== 0 && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    blobs.push({ areaPx2: count, cx: sumX / count, cy: sumY / count });
  }

  return blobs;
}

// =============================================================================
// largestBlobAboveThreshold — cv2.contourArea(c) >= min_contour_area filter
// + "take the largest," in one step.
// =============================================================================

export function largestBlobAboveThreshold(
  blobs: { areaPx2: number; cx: number; cy: number }[],
  minAreaPx2: number
): { areaPx2: number; cx: number; cy: number } | null {
  let best: { areaPx2: number; cx: number; cy: number } | null = null;
  for (const blob of blobs) {
    if (blob.areaPx2 < minAreaPx2) continue;
    if (!best || blob.areaPx2 > best.areaPx2) best = blob;
  }
  return best;
}

// =============================================================================
// computeSteering — THE exact law from color_tracker_node.py's
// image_callback. linear.x is ALWAYS maxLinearSpeed while tracking (this
// control law never slows down for a large offset, only steers); angular.z
// is 0 inside the deadzone, else clamp(-angularGain * offsetPx, ...).
// =============================================================================

export function computeSteering(
  offsetPx: number,
  params: { centroidDeadzonePx: number; angularGain: number; maxLinearSpeed: number; maxAngularSpeed: number }
): TwistCommand {
  const linearX = params.maxLinearSpeed;

  if (Math.abs(offsetPx) <= params.centroidDeadzonePx) {
    return { linearX, angularZ: 0 };
  }

  const raw = -params.angularGain * offsetPx;
  const angularZ = Math.max(-params.maxAngularSpeed, Math.min(params.maxAngularSpeed, raw));
  return { linearX, angularZ };
}

// =============================================================================
// detectTarget — runs inRangeMask -> findBlobs -> largestBlobAboveThreshold
// against one frame. The one function every visualization actually calls
// each tick.
//
// PERFORMANCE NOTE FOR CALLERS: a naive per-pixel flood fill over a full
// 640x480+ frame at 15-30fps is a real main-thread cost. Callers (
// PipelineStages/TrackPanel/CalibratePanel) are responsible for downsampling
// frame.pixels to a small fixed working size (160x120) BEFORE calling this
// — deliberately kept out of this function so it stays resolution-agnostic
// and cheap to unit-test at 4x4. Centroid/offset coordinates this returns
// are in the SAME resolution as the frame passed in; scale them back up for
// display against the original frame size.
// =============================================================================

export function detectTarget(
  frame: CameraFrame,
  hsvLower: HsvTriplet,
  hsvUpper: HsvTriplet,
  minContourAreaPx2: number
): DetectionResult {
  const mask = inRangeMask(frame.pixels, frame.width, frame.height, hsvLower, hsvUpper);
  const blobs = findBlobs(mask, frame.width, frame.height);
  const best = largestBlobAboveThreshold(blobs, minContourAreaPx2);

  if (!best) {
    return { mask, contourFound: false, centroid: null, areaPx2: null, offsetPx: null };
  }

  return {
    mask,
    contourFound: true,
    centroid: { cx: best.cx, cy: best.cy },
    areaPx2: best.areaPx2,
    offsetPx: best.cx - frame.width / 2,
  };
}
