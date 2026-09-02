import { describe, it, expect } from 'vitest'
import { COLOR_TRACKER_PARAMETERS } from '../parameterSchemas'

/**
 * This app's central factual claim is that all 9 color_tracker_node.py
 * parameters are restart-required, CONFIRMED from the shown source (no
 * add_on_set_parameters_callback), not guessed. These tests protect that
 * claim structurally, and pin every default to the real course source so a
 * silent transcription drift gets caught immediately.
 */

describe('COLOR_TRACKER_PARAMETERS structure', () => {
  it('has exactly the 9 real parameters, no more, no fewer', () => {
    expect(COLOR_TRACKER_PARAMETERS).toHaveLength(9)
  })

  it('has unique keys', () => {
    const keys = COLOR_TRACKER_PARAMETERS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every entry has a non-empty reconfigureNote', () => {
    for (const p of COLOR_TRACKER_PARAMETERS) {
      expect(p.reconfigureNote.trim().length).toBeGreaterThan(20)
    }
  })

  it('every entry cites a sourceRef', () => {
    for (const p of COLOR_TRACKER_PARAMETERS) {
      expect(p.sourceRef.trim().length).toBeGreaterThan(0)
    }
  })
})

describe("every parameter is tagged 'restart' — the app's central, source-confirmed claim", () => {
  it('has zero live-tagged parameters', () => {
    expect(COLOR_TRACKER_PARAMETERS.filter((p) => p.reconfigure === 'live')).toHaveLength(0)
  })

  it('has zero investigate-tagged parameters — this IS confirmed, not ambiguous', () => {
    expect(COLOR_TRACKER_PARAMETERS.filter((p) => p.reconfigure === 'investigate')).toHaveLength(0)
  })

  it('every single parameter is restart-tagged', () => {
    expect(COLOR_TRACKER_PARAMETERS.every((p) => p.reconfigure === 'restart')).toBe(true)
  })
})

describe('defaults match the real color_tracker_node.py source exactly', () => {
  const byKey = Object.fromEntries(COLOR_TRACKER_PARAMETERS.map((p) => [p.key, p]))

  it('hsv_lower defaults to the real placeholder [0, 120, 70]', () => {
    expect(byKey.hsv_lower.default).toEqual([0, 120, 70])
    expect(byKey.hsv_lower.type).toBe('hsvTriplet')
  })

  it('hsv_upper defaults to the real placeholder [10, 255, 255]', () => {
    expect(byKey.hsv_upper.default).toEqual([10, 255, 255])
    expect(byKey.hsv_upper.type).toBe('hsvTriplet')
  })

  it('min_contour_area defaults to 500', () => {
    expect(byKey.min_contour_area.default).toBe(500)
  })

  it('centroid_deadzone_px defaults to 40', () => {
    expect(byKey.centroid_deadzone_px.default).toBe(40)
  })

  it('angular_gain defaults to 0.005', () => {
    expect(byKey.angular_gain.default).toBe(0.005)
  })

  it('max_linear_speed defaults to 0.12', () => {
    expect(byKey.max_linear_speed.default).toBe(0.12)
  })

  it('max_angular_speed defaults to 0.4', () => {
    expect(byKey.max_angular_speed.default).toBe(0.4)
  })

  it('target_lost_timeout_sec defaults to 1.0', () => {
    expect(byKey.target_lost_timeout_sec.default).toBe(1.0)
  })

  it('publish_debug_image defaults to true', () => {
    expect(byKey.publish_debug_image.default).toBe(true)
  })
})

describe('numeric parameters satisfy min <= default <= max', () => {
  for (const p of COLOR_TRACKER_PARAMETERS) {
    if (p.type !== 'number') continue
    it(`${p.key}`, () => {
      expect(p.default as number).toBeGreaterThanOrEqual(p.min!)
      expect(p.default as number).toBeLessThanOrEqual(p.max!)
    })
  }
})
