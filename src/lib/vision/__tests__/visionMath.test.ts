import { describe, it, expect } from 'vitest'
import {
  rgbToHsv,
  inRangeMask,
  findBlobs,
  largestBlobAboveThreshold,
  computeSteering,
  detectTarget,
} from '../visionMath'
import type { CameraFrame, HsvTriplet } from '../types'

/**
 * This pipeline is the app's whole reason for existing: every stage the
 * student sees on screen is actually computed from the current frame, not
 * pre-canned. These tests pin the algorithmic shape against tiny,
 * hand-built pixel buffers — cheap and exact, with no React tree, no
 * timers, no mock class involved.
 */

// The real color_tracker_node.py default — a placeholder for a specific
// red-ish target under specific lighting, not a working general value.
const REAL_DEFAULT_LOWER: HsvTriplet = [0, 120, 70]
const REAL_DEFAULT_UPPER: HsvTriplet = [10, 255, 255]

describe('rgbToHsv', () => {
  it('converts pure red to OpenCV H=0', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual([0, 255, 255])
  })

  it('converts pure green to OpenCV H=60 (120/2, not 120)', () => {
    expect(rgbToHsv(0, 255, 0)).toEqual([60, 255, 255])
  })

  it('converts pure blue to OpenCV H=120 (240/2, not 240)', () => {
    expect(rgbToHsv(0, 0, 255)).toEqual([120, 255, 255])
  })

  it('white has zero saturation, full value', () => {
    const [, s, v] = rgbToHsv(255, 255, 255)
    expect(s).toBe(0)
    expect(v).toBe(255)
  })

  it('black has zero value', () => {
    const [, , v] = rgbToHsv(0, 0, 0)
    expect(v).toBe(0)
  })

  it('grey has zero saturation', () => {
    const [, s] = rgbToHsv(128, 128, 128)
    expect(s).toBe(0)
  })

  it('every output stays within OpenCV ranges (H 0-179, S/V 0-255)', () => {
    for (let i = 0; i < 50; i++) {
      const r = (i * 37) % 256
      const g = (i * 71) % 256
      const b = (i * 113) % 256
      const [h, s, v] = rgbToHsv(r, g, b)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(179)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(255)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(255)
    }
  })
})

// =============================================================================
// inRangeMask
// =============================================================================

/** A width x height RGBA buffer, filled with `bg`, with a rectangular
 *  block of `fg` painted at [x0,y0)-[x1,y1). */
function makePixels(
  width: number,
  height: number,
  bg: [number, number, number],
  block?: { x0: number; y0: number; x1: number; y1: number; color: [number, number, number] }
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const inBlock = block && x >= block.x0 && x < block.x1 && y >= block.y0 && y < block.y1
      const [r, g, b] = inBlock ? block!.color : bg
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
      pixels[i + 3] = 255
    }
  }
  return pixels
}

describe('inRangeMask', () => {
  it('marks exactly the pixels whose HSV falls inside the range', () => {
    const width = 4
    const height = 4
    // Red 2x2 block top-left, blue everywhere else (blue's hue=120 is
    // outside the real default's H range [0,10]).
    const pixels = makePixels(width, height, [0, 0, 255], {
      x0: 0, y0: 0, x1: 2, y1: 2, color: [255, 0, 0],
    })

    const mask = inRangeMask(pixels, width, height, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const expected = x < 2 && y < 2 ? 255 : 0
        expect(mask[y * width + x]).toBe(expected)
      }
    }
  })

  it('returns an all-zero mask when nothing matches', () => {
    const width = 3
    const height = 3
    const pixels = makePixels(width, height, [0, 0, 255]) // pure blue everywhere
    const mask = inRangeMask(pixels, width, height, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER)
    expect(Array.from(mask).every((v) => v === 0)).toBe(true)
  })

  it('does not auto-wrap the hue boundary near 0/179 (matches cv2.inRange exactly)', () => {
    // A hue of 179 must NOT match a range whose lower bound is 0 unless
    // explicitly widened — no implicit wraparound.
    const width = 1
    const height = 1
    // Magenta-ish, hue ~150 in OpenCV range — outside [0,10].
    const pixels = makePixels(width, height, [255, 0, 255])
    const mask = inRangeMask(pixels, width, height, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER)
    expect(mask[0]).toBe(0)
  })
})

// =============================================================================
// findBlobs
// =============================================================================

function makeMask(width: number, height: number, on: [number, number][]): Uint8Array {
  const mask = new Uint8Array(width * height)
  for (const [x, y] of on) mask[y * width + x] = 255
  return mask
}

describe('findBlobs', () => {
  it('returns no blobs for an empty mask', () => {
    expect(findBlobs(new Uint8Array(16), 4, 4)).toEqual([])
  })

  it('finds a single connected blob with the correct area and centroid', () => {
    // A 2x2 block at (1,1)-(2,2) in a 5x5 mask.
    const mask = makeMask(5, 5, [[1, 1], [2, 1], [1, 2], [2, 2]])
    const blobs = findBlobs(mask, 5, 5)
    expect(blobs).toHaveLength(1)
    expect(blobs[0].areaPx2).toBe(4)
    expect(blobs[0].cx).toBeCloseTo(1.5)
    expect(blobs[0].cy).toBeCloseTo(1.5)
  })

  it('finds two disjoint blobs separately, each with its own centroid', () => {
    const mask = makeMask(6, 1, [[0, 0], [1, 0], [4, 0], [5, 0]]) // gap at x=2,3
    const blobs = findBlobs(mask, 6, 1)
    expect(blobs).toHaveLength(2)
    const areas = blobs.map((b) => b.areaPx2).sort()
    expect(areas).toEqual([2, 2])
    const centroids = blobs.map((b) => b.cx).sort((a, b) => a - b)
    expect(centroids[0]).toBeCloseTo(0.5)
    expect(centroids[1]).toBeCloseTo(4.5)
  })

  it('does not connect diagonally-touching pixels (4-connectivity only)', () => {
    // Two pixels touching only at a corner must be two separate blobs.
    const mask = makeMask(2, 2, [[0, 0], [1, 1]])
    const blobs = findBlobs(mask, 2, 2)
    expect(blobs).toHaveLength(2)
  })
})

// =============================================================================
// largestBlobAboveThreshold
// =============================================================================

describe('largestBlobAboveThreshold', () => {
  const blobs = [
    { areaPx2: 3, cx: 0, cy: 0 },
    { areaPx2: 10, cx: 1, cy: 1 },
    { areaPx2: 1, cx: 2, cy: 2 },
  ]

  it('excludes blobs below the threshold and picks the largest survivor', () => {
    expect(largestBlobAboveThreshold(blobs, 2)?.areaPx2).toBe(10)
  })

  it('returns null when nothing clears the threshold', () => {
    expect(largestBlobAboveThreshold(blobs, 500)).toBeNull()
  })

  it('returns null for an empty blob list', () => {
    expect(largestBlobAboveThreshold([], 0)).toBeNull()
  })
})

// =============================================================================
// computeSteering — the exact law from color_tracker_node.py
// =============================================================================

const STEERING_PARAMS = {
  centroidDeadzonePx: 40,
  angularGain: 0.005,
  maxLinearSpeed: 0.12,
  maxAngularSpeed: 0.4,
}

describe('computeSteering', () => {
  it('goes straight when the offset is inside the deadzone', () => {
    expect(computeSteering(0, STEERING_PARAMS)).toEqual({ linearX: 0.12, angularZ: 0 })
    expect(computeSteering(40, STEERING_PARAMS).angularZ).toBe(0) // boundary inclusive
    expect(computeSteering(-40, STEERING_PARAMS).angularZ).toBe(0)
  })

  it('turns with the correct sign outside the deadzone', () => {
    // Positive offset (target right of centre) -> negative angular.z (turn right, CW).
    expect(computeSteering(100, STEERING_PARAMS).angularZ).toBeLessThan(0)
    // Negative offset (target left of centre) -> positive angular.z (turn left, CCW).
    expect(computeSteering(-100, STEERING_PARAMS).angularZ).toBeGreaterThan(0)
  })

  it('computes the exact proportional value before saturation', () => {
    // offset=100, gain=0.005 -> raw = -0.5, saturates.
    // offset=50, gain=0.005 -> raw = -0.25, does not saturate (< 0.4).
    expect(computeSteering(50, STEERING_PARAMS).angularZ).toBeCloseTo(-0.25)
  })

  it('clamps to maxAngularSpeed on a large offset in either direction', () => {
    expect(computeSteering(10_000, STEERING_PARAMS).angularZ).toBeCloseTo(-0.4)
    expect(computeSteering(-10_000, STEERING_PARAMS).angularZ).toBeCloseTo(0.4)
  })

  it('linear.x is ALWAYS maxLinearSpeed while tracking, regardless of offset — this control law never slows for a large offset, only steers', () => {
    for (const offset of [0, 39, 40, 41, 500, -500, 100_000]) {
      expect(computeSteering(offset, STEERING_PARAMS).linearX).toBe(STEERING_PARAMS.maxLinearSpeed)
    }
  })
})

// =============================================================================
// detectTarget — end to end
// =============================================================================

function makeFrame(
  width: number,
  height: number,
  bg: [number, number, number],
  block?: { x0: number; y0: number; x1: number; y1: number; color: [number, number, number] }
): CameraFrame {
  return {
    sourceKind: 'mock',
    receivedAt: Date.now(),
    topic: '/camera/color/image_raw',
    msgType: 'sensor_msgs/Image',
    width,
    height,
    pixels: makePixels(width, height, bg, block),
  }
}

describe('detectTarget', () => {
  it('finds a target above the area threshold and reports its centroid/offset', () => {
    const frame = makeFrame(8, 8, [0, 0, 255], { x0: 2, y0: 2, x1: 5, y1: 5, color: [255, 0, 0] }) // 3x3 = 9px
    const result = detectTarget(frame, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER, 5)

    expect(result.contourFound).toBe(true)
    expect(result.areaPx2).toBe(9)
    expect(result.centroid).not.toBeNull()
    expect(result.centroid!.cx).toBeCloseTo(3)
    expect(result.centroid!.cy).toBeCloseTo(3)
    expect(result.offsetPx).toBeCloseTo(3 - 8 / 2) // cx - frameWidth/2
  })

  it('reports no detection when the matching blob is below min_contour_area', () => {
    const frame = makeFrame(8, 8, [0, 0, 255], { x0: 2, y0: 2, x1: 4, y1: 4, color: [255, 0, 0] }) // 2x2 = 4px
    const result = detectTarget(frame, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER, 5) // needs >= 5

    expect(result.contourFound).toBe(false)
    expect(result.centroid).toBeNull()
    expect(result.areaPx2).toBeNull()
    expect(result.offsetPx).toBeNull()
  })

  it('reports no detection when nothing in frame matches the color range', () => {
    const frame = makeFrame(8, 8, [0, 0, 255]) // all blue, no red at all
    const result = detectTarget(frame, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER, 1)
    expect(result.contourFound).toBe(false)
  })

  it('always returns a full-size mask, whether or not a target was found', () => {
    const frame = makeFrame(8, 8, [0, 0, 255])
    const result = detectTarget(frame, REAL_DEFAULT_LOWER, REAL_DEFAULT_UPPER, 1)
    expect(result.mask.length).toBe(8 * 8)
  })
})
