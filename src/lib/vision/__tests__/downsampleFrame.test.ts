import { describe, it, expect } from 'vitest'
import { downsampleFrame } from '../downsampleFrame'
import type { CameraFrame } from '../types'

function makeFrame(width: number, height: number, fill: [number, number, number]): CameraFrame {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = fill[0]
    pixels[i * 4 + 1] = fill[1]
    pixels[i * 4 + 2] = fill[2]
    pixels[i * 4 + 3] = 255
  }
  return {
    sourceKind: 'mock',
    receivedAt: 0,
    topic: '/camera/color/image_raw',
    msgType: 'sensor_msgs/Image',
    width,
    height,
    pixels,
  }
}

describe('downsampleFrame', () => {
  it('produces a frame of exactly the requested dimensions', () => {
    const frame = makeFrame(320, 240, [10, 20, 30])
    const down = downsampleFrame(frame, 160, 120)
    expect(down.width).toBe(160)
    expect(down.height).toBe(120)
    expect(down.pixels.length).toBe(160 * 120 * 4)
  })

  it('is a no-op (same object) when already at the target size', () => {
    const frame = makeFrame(160, 120, [1, 2, 3])
    expect(downsampleFrame(frame, 160, 120)).toBe(frame)
  })

  it('preserves a uniform color exactly', () => {
    const frame = makeFrame(320, 240, [200, 50, 5])
    const down = downsampleFrame(frame, 160, 120)
    expect(down.pixels[0]).toBe(200)
    expect(down.pixels[1]).toBe(50)
    expect(down.pixels[2]).toBe(5)
    expect(down.pixels[down.pixels.length - 4]).toBe(200) // last pixel too
  })

  it('never reads out of bounds when upsampling (target larger than source)', () => {
    const frame = makeFrame(4, 4, [7, 8, 9])
    expect(() => downsampleFrame(frame, 8, 8)).not.toThrow()
    const up = downsampleFrame(frame, 8, 8)
    expect(up.pixels[0]).toBe(7)
  })

  it('preserves the sourceKind and topic metadata', () => {
    const frame = makeFrame(320, 240, [0, 0, 0])
    const down = downsampleFrame(frame, 160, 120)
    expect(down.sourceKind).toBe('mock')
    expect(down.topic).toBe('/camera/color/image_raw')
  })
})
