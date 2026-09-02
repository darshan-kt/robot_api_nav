import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  MockSensorSource,
  angularResolutionDegForBaud,
  computeRayCount,
  computeRoomRangeM,
  computeRegistrationOffset,
  buildDepthGrid,
} from '../MockSensorSource'
import type { LidarScanFrame, AstraFramePair } from '../types'

/**
 * MockSensorSource is the only concrete SensorDataSource today, and it has
 * to earn the promise the rest of the app makes on its behalf: every card
 * says "SIMULATED DATA," but the simulated data still has to behave like
 * the real thing would — respecting the opt-in cost model, actually timing
 * itself off the configured rate, and actually reflecting the
 * depth_registration finding rather than just labeling a static picture.
 */

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

// =============================================================================
// Pure generator functions
// =============================================================================

describe('angularResolutionDegForBaud', () => {
  it('maps A2M8s baud (115200) to its coarser resolution', () => {
    expect(angularResolutionDegForBaud('115200')).toBe(0.45)
  })

  it('maps A2M7/A2M12 baud (256000) to the finer resolution', () => {
    expect(angularResolutionDegForBaud('256000')).toBe(0.225)
  })

  it('falls back to the finer resolution for the mismatched node default', () => {
    expect(angularResolutionDegForBaud('1000000')).toBe(0.225)
  })
})

describe('computeRayCount', () => {
  it('derives a full-circle ray count from angular resolution', () => {
    expect(computeRayCount(0.225)).toBe(1600)
    expect(computeRayCount(0.45)).toBe(800)
  })

  it('never returns fewer than 8 rays even for a degenerate input', () => {
    expect(computeRayCount(1000)).toBeGreaterThanOrEqual(8)
  })
})

describe('computeRoomRangeM', () => {
  it('is deterministic for the same angle/ray/tick', () => {
    const a = computeRoomRangeM(0.5, 10, 3)
    const b = computeRoomRangeM(0.5, 10, 3)
    expect(a).toBe(b)
  })

  it('varies with tick (the dial visibly "breathes")', () => {
    const a = computeRoomRangeM(0.5, 10, 1)
    const b = computeRoomRangeM(0.5, 10, 2)
    expect(a).not.toBe(b)
  })

  it('never returns a non-positive range', () => {
    for (let i = 0; i < 50; i++) {
      expect(computeRoomRangeM(i * 0.1, i, 0)).toBeGreaterThan(0)
    }
  })

  it('stays within a plausible room-scale bound', () => {
    // Half-width 3m / half-depth 2.5m rectangle plus jitter — nothing here
    // should read like an open field or a closet.
    for (let i = 0; i < 36; i++) {
      const r = computeRoomRangeM((i * 10 * Math.PI) / 180, i, 0)
      expect(r).toBeLessThan(6)
    }
  })
})

describe('computeRegistrationOffset', () => {
  it('is zero when registered', () => {
    expect(computeRegistrationOffset(true)).toEqual({ dxCells: 0, dyCells: 0 })
  })

  it('is non-zero when unregistered — the actual teaching mechanism', () => {
    const offset = computeRegistrationOffset(false)
    expect(offset.dxCells !== 0 || offset.dyCells !== 0).toBe(true)
  })
})

describe('buildDepthGrid', () => {
  const shapes = [{ x: 0.5, y: 0.5, r: 0.1, hue: 0 }]

  it('produces a grid of the requested dimensions', () => {
    const grid = buildDepthGrid(shapes, 16, 12, { dxCells: 0, dyCells: 0 })
    expect(grid).toHaveLength(12)
    expect(grid[0]).toHaveLength(16)
  })

  it('places a near-depth blob at the shape position when registered', () => {
    const grid = buildDepthGrid(shapes, 16, 12, { dxCells: 0, dyCells: 0 })
    const col = Math.round(0.5 * 15)
    const row = Math.round(0.5 * 11)
    expect(grid[row][col]).toBeLessThan(1.5)
  })

  it('shifts the blob when an offset is applied — proves the misalignment is real, not cosmetic', () => {
    const aligned = buildDepthGrid(shapes, 16, 12, { dxCells: 0, dyCells: 0 })
    const shifted = buildDepthGrid(shapes, 16, 12, { dxCells: 3, dyCells: -2 })
    const col = Math.round(0.5 * 15)
    const row = Math.round(0.5 * 11)
    // Where the blob WAS, it's now gone (back to background depth).
    expect(shifted[row][col]).toBeGreaterThan(aligned[row][col])
  })
})

// =============================================================================
// MockSensorSource — subscription lifecycle
// =============================================================================

describe('MockSensorSource subscription lifecycle', () => {
  let source: MockSensorSource

  beforeEach(() => {
    source = new MockSensorSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('does not stream before anything subscribes (opt-in cost model)', () => {
    expect(source.getStatus('rplidar_a2').online).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(source.getStatus('rplidar_a2').measuredHz).toBeNull()
  })

  it('starts streaming on the first subscriber and stops on the last unsubscribe', () => {
    const frames: LidarScanFrame[] = []
    const unsubscribe = source.subscribe('rplidar_a2', (f) => frames.push(f))

    expect(source.getStatus('rplidar_a2').online).toBe(true)
    vi.advanceTimersByTime(500) // one full tick at the 10Hz default
    expect(frames.length).toBeGreaterThan(0)

    unsubscribe()
    expect(source.getStatus('rplidar_a2').online).toBe(false)

    const countAtUnsubscribe = frames.length
    vi.advanceTimersByTime(2000)
    expect(frames.length).toBe(countAtUnsubscribe) // no more frames after unsubscribing
  })

  it('does not double-start the interval under a StrictMode-shaped subscribe/unsubscribe/subscribe', () => {
    const frames: LidarScanFrame[] = []
    const unsubscribe1 = source.subscribe('rplidar_a2', (f) => frames.push(f))
    unsubscribe1()
    source.subscribe('rplidar_a2', (f) => frames.push(f))

    vi.advanceTimersByTime(100)
    // Only one interval should be running — if two got started, frame count
    // would be roughly double what a single 10Hz stream produces.
    const countAfterOneTick = frames.length
    vi.advanceTimersByTime(100)
    const countAfterTwoTicks = frames.length
    expect(countAfterTwoTicks - countAfterOneTick).toBeLessThanOrEqual(1)
  })

  it('every emitted lidar frame is tagged sourceKind: mock', () => {
    const frames: LidarScanFrame[] = []
    source.subscribe('rplidar_a2', (f) => frames.push(f))
    vi.advanceTimersByTime(500)
    expect(frames.length).toBeGreaterThan(0)
    expect(frames.every((f) => f.sourceKind === 'mock')).toBe(true)
  })

  it('every emitted lidar frame carries the real LaserScan field set', () => {
    const frames: LidarScanFrame[] = []
    source.subscribe('rplidar_a2', (f) => frames.push(f))
    vi.advanceTimersByTime(200)
    const frame = frames[0]
    for (const key of ['frame_id', 'angle_min', 'angle_max', 'angle_increment', 'range_min', 'range_max', 'ranges']) {
      expect(frame).toHaveProperty(key)
    }
    expect(Array.isArray(frame.ranges)).toBe(true)
  })

  it('astra subscribers receive a depth+rgb pair each tick', () => {
    const frames: AstraFramePair[] = []
    source.subscribe('astra_pro', (f) => frames.push(f))
    vi.advanceTimersByTime(1000 / 30 + 10)
    expect(frames.length).toBeGreaterThan(0)
    expect(frames[0].depth).not.toBeNull()
    expect(frames[0].rgb).not.toBeNull()
  })

  it('dispose() leaves zero pending timers', () => {
    source.subscribe('rplidar_a2', () => {})
    source.subscribe('astra_pro', () => {})
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    source.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})

// =============================================================================
// Parameter application — the restart-vs-live distinction
// =============================================================================

describe('MockSensorSource parameter application', () => {
  let source: MockSensorSource

  beforeEach(() => {
    source = new MockSensorSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('a restart-tagged parameter change does NOT take effect until restartDevice() resolves', async () => {
    expect(source.getParameterValue('rplidar_a2', 'serial_baudrate')).toBe('1000000')
    source.setParameterValue('rplidar_a2', 'serial_baudrate', '115200')
    // Still the old value — staged, not applied.
    expect(source.getParameterValue('rplidar_a2', 'serial_baudrate')).toBe('1000000')

    await source.restartDevice('rplidar_a2')
    expect(source.getParameterValue('rplidar_a2', 'serial_baudrate')).toBe('115200')
  })

  it('an investigate-tagged parameter (depth_registration) applies immediately in the mock', () => {
    expect(source.getParameterValue('astra_pro', 'depth_registration')).toBe(false)
    source.setParameterValue('astra_pro', 'depth_registration', true)
    expect(source.getParameterValue('astra_pro', 'depth_registration')).toBe(true)
  })

  it('toggling depth_registration changes the very next astra frame pair', () => {
    const frames: AstraFramePair[] = []
    source.subscribe('astra_pro', (f) => frames.push(f))
    vi.advanceTimersByTime(1000 / 30 + 5)
    expect(frames[frames.length - 1].depth?.registered).toBe(false)

    source.setParameterValue('astra_pro', 'depth_registration', true)
    vi.advanceTimersByTime(1000 / 30 + 5)
    expect(frames[frames.length - 1].depth?.registered).toBe(true)
  })

  it('a restart-tagged color_fps change does not alter tick cadence until restart', () => {
    const frames: AstraFramePair[] = []
    source.subscribe('astra_pro', (f) => frames.push(f))
    vi.advanceTimersByTime(1000) // ~30 frames at the 30fps default
    const countBefore = frames.length

    source.setParameterValue('astra_pro', 'color_fps', 5) // staged, restart-required
    vi.advanceTimersByTime(1000)
    const countAfterStagedOnly = frames.length - countBefore
    // Cadence should still be ~30fps-ish, not yet down at 5fps.
    expect(countAfterStagedOnly).toBeGreaterThan(10)
  })

  it('an unknown parameter key is ignored rather than throwing', () => {
    expect(() => source.setParameterValue('rplidar_a2', 'not_a_real_param', 1)).not.toThrow()
  })

  it('ignores a set on a device with no matching schema entry gracefully', () => {
    expect(source.getParameterValue('rplidar_a2', 'nonexistent')).toBeUndefined()
  })
})

// =============================================================================
// Measured Hz — never an echo of the configured rate
// =============================================================================

describe('MockSensorSource getStatus().measuredHz', () => {
  let source: MockSensorSource

  beforeEach(() => {
    source = new MockSensorSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('is null before enough ticks have happened to measure', () => {
    expect(source.getStatus('rplidar_a2').measuredHz).toBeNull()
  })

  it('reports something close to the configured rate once streaming', () => {
    source.subscribe('rplidar_a2', () => {})
    vi.advanceTimersByTime(2000) // 20 ticks at 10Hz
    const hz = source.getStatus('rplidar_a2').measuredHz
    expect(hz).not.toBeNull()
    expect(hz as number).toBeGreaterThan(5)
    expect(hz as number).toBeLessThan(15)
  })

  it('diverges from a pending, not-yet-restarted scan_frequency change', () => {
    source.subscribe('rplidar_a2', () => {})
    vi.advanceTimersByTime(1000)
    source.setParameterValue('rplidar_a2', 'scan_frequency', 100) // investigate-tagged: applies live
    vi.advanceTimersByTime(1000)
    const hz = source.getStatus('rplidar_a2').measuredHz as number
    // scan_frequency is 'investigate', applied live and restarts the timer —
    // so measuredHz should visibly move toward the new rate, proving it's
    // measured from real ticks and not a static echo of the original config.
    expect(hz).toBeGreaterThan(15)
  })
})
