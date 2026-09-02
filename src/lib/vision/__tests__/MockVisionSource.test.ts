import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MockVisionSource, MOCK_SCENE_WIDTH, MOCK_SCENE_HEIGHT } from '../MockVisionSource'
import { detectTarget } from '../visionMath'
import type { CameraFrame } from '../types'

/**
 * MockVisionSource is the default, always-on data source — every card
 * says "SIMULATED DATA," but the frames it emits still have to behave like
 * a real camera stream would: opt-in cost model, restart-staged
 * parameters, and (uniquely to this app) a real color a real calibration
 * can actually find.
 */

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('MockVisionSource subscription lifecycle', () => {
  let source: MockVisionSource

  beforeEach(() => {
    source = new MockVisionSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('does not stream before anything subscribes (opt-in cost model)', () => {
    expect(source.getStatus().online).toBe(false)
    vi.advanceTimersByTime(2000)
    expect(source.getStatus().measuredHz).toBeNull()
  })

  it('starts on first subscribe, stops on last unsubscribe', () => {
    const frames: CameraFrame[] = []
    const unsubscribe = source.subscribeCamera((f) => frames.push(f))

    expect(source.getStatus().online).toBe(true)
    vi.advanceTimersByTime(200)
    expect(frames.length).toBeGreaterThan(0)

    unsubscribe()
    expect(source.getStatus().online).toBe(false)
    const countAtUnsubscribe = frames.length
    vi.advanceTimersByTime(1000)
    expect(frames.length).toBe(countAtUnsubscribe)
  })

  it('every emitted frame is tagged sourceKind: mock and matches the CameraFrame contract', () => {
    const frames: CameraFrame[] = []
    source.subscribeCamera((f) => frames.push(f))
    vi.advanceTimersByTime(200)

    expect(frames.length).toBeGreaterThan(0)
    const frame = frames[0]
    expect(frame.sourceKind).toBe('mock')
    expect(frame.topic).toBe('/camera/color/image_raw')
    expect(frame.width).toBe(MOCK_SCENE_WIDTH)
    expect(frame.height).toBe(MOCK_SCENE_HEIGHT)
    expect(frame.pixels.length).toBe(MOCK_SCENE_WIDTH * MOCK_SCENE_HEIGHT * 4)
  })

  it('does not double-start under a StrictMode-shaped subscribe/unsubscribe/subscribe', () => {
    const frames: CameraFrame[] = []
    const unsub1 = source.subscribeCamera((f) => frames.push(f))
    unsub1()
    source.subscribeCamera((f) => frames.push(f))

    vi.advanceTimersByTime(200)
    const countAfterFirstWindow = frames.length
    vi.advanceTimersByTime(200)
    const countAfterSecondWindow = frames.length - countAfterFirstWindow
    // A doubled interval would roughly double the per-window frame count.
    expect(countAfterSecondWindow).toBeLessThanOrEqual(countAfterFirstWindow + 1)
  })

  it('dispose() leaves zero pending timers', () => {
    source.subscribeCamera(() => {})
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    source.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('MockVisionSource default target color', () => {
  it("the emitted target is actually detectable by the real course's default HSV calibration", () => {
    // This is the point of tuning TARGET_COLOR deliberately: a student
    // opening Track mode with the real, unmodified default hsv_lower/
    // hsv_upper should see a detection immediately, not a blank mask.
    const source = new MockVisionSource()
    let latest: CameraFrame | null = null
    source.subscribeCamera((f) => { latest = f })
    vi.advanceTimersByTime(200)
    source.dispose()

    expect(latest).not.toBeNull()
    const result = detectTarget(latest!, [0, 120, 70], [10, 255, 255], 50)
    expect(result.contourFound).toBe(true)
  })
})

describe('MockVisionSource parameter staging', () => {
  let source: MockVisionSource

  beforeEach(() => {
    source = new MockVisionSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('a restart-tagged parameter change does not apply until restartDevice() resolves', async () => {
    expect(source.getParameterValue('min_contour_area')).toBe(500)
    source.setParameterValue('min_contour_area', 999)
    expect(source.getParameterValue('min_contour_area')).toBe(500)

    await source.restartDevice()
    expect(source.getParameterValue('min_contour_area')).toBe(999)
  })

  it('hsv_lower/hsv_upper stage exactly like every other parameter', async () => {
    source.setParameterValue('hsv_lower', [40, 100, 100])
    expect(source.getParameterValue('hsv_lower')).toEqual([0, 120, 70]) // unchanged until restart

    await source.restartDevice()
    expect(source.getParameterValue('hsv_lower')).toEqual([40, 100, 100])
  })

  it('is seeded from the schema defaults for every parameter', () => {
    expect(source.getParameterValue('hsv_upper')).toEqual([10, 255, 255])
    expect(source.getParameterValue('max_linear_speed')).toBe(0.12)
    expect(source.getParameterValue('publish_debug_image')).toBe(true)
  })
})

describe('MockVisionSource getPendingValue', () => {
  let source: MockVisionSource

  beforeEach(() => {
    source = new MockVisionSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('is undefined when nothing is staged', () => {
    expect(source.getPendingValue('min_contour_area')).toBeUndefined()
  })

  it('reflects a staged edit before restartDevice() resolves', () => {
    source.setParameterValue('min_contour_area', 777)
    expect(source.getPendingValue('min_contour_area')).toBe(777)
    expect(source.getParameterValue('min_contour_area')).toBe(500) // still the old applied value
  })

  it('clears once restartDevice() applies it', async () => {
    source.setParameterValue('min_contour_area', 777)
    await source.restartDevice()
    expect(source.getPendingValue('min_contour_area')).toBeUndefined()
    expect(source.getParameterValue('min_contour_area')).toBe(777)
  })

  it('is what a second UI surface (e.g. CalibratePanel) would read to stay consistent with a panel it does not own', () => {
    // Simulates CalibratePanel's "Copy to Track Config" staging hsv_lower
    // directly on the source, independent of VisionParameterPanel's own
    // local state.
    source.setParameterValue('hsv_lower', [50, 100, 100])
    expect(source.getPendingValue('hsv_lower')).toEqual([50, 100, 100])
  })
})

describe('MockVisionSource target-lost control', () => {
  let source: MockVisionSource

  beforeEach(() => {
    source = new MockVisionSource()
  })

  afterEach(() => {
    source.dispose()
  })

  it('setTargetVisible(false) removes the target from the next frame', () => {
    const frames: CameraFrame[] = []
    source.subscribeCamera((f) => frames.push(f))
    vi.advanceTimersByTime(100)
    const before = detectTarget(frames[frames.length - 1], [0, 120, 70], [10, 255, 255], 50)
    expect(before.contourFound).toBe(true)

    source.setTargetVisible(false)
    frames.length = 0
    vi.advanceTimersByTime(100)
    const after = detectTarget(frames[frames.length - 1], [0, 120, 70], [10, 255, 255], 50)
    expect(after.contourFound).toBe(false)
  })

  it('setTargetVisible(true) brings it back', () => {
    const frames: CameraFrame[] = []
    source.subscribeCamera((f) => frames.push(f))
    source.setTargetVisible(false)
    vi.advanceTimersByTime(100)
    source.setTargetVisible(true)
    frames.length = 0
    vi.advanceTimersByTime(100)
    const result = detectTarget(frames[frames.length - 1], [0, 120, 70], [10, 255, 255], 50)
    expect(result.contourFound).toBe(true)
  })

  it('requestAccess always resolves ok — the mock has no permission concept', async () => {
    await expect(source.requestAccess()).resolves.toEqual({ ok: true })
  })
})
