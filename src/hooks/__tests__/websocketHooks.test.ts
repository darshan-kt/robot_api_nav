import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTelemetry } from '../useTelemetry'
import { useVelocityCtrl } from '../useVelocityCtrl'

/**
 * The gateway's WebSocket streams as the browser sees them. A stubbed
 * WebSocket lets these tests cover what matters operationally: that the
 * hooks derive the right ws:// URL, survive a dropped link, and — for
 * teleop — never send a frame into a socket that isn't open.
 */

// Module-level rather than static class fields: tsconfig sets
// erasableSyntaxOnly, which disallows the latter.
const CONNECTING = 0
const OPEN = 1
const CLOSED = 3
let instances: MockWebSocket[] = []

class MockWebSocket {
  static readonly CONNECTING = CONNECTING
  static readonly OPEN = OPEN
  static readonly CLOSED = CLOSED

  readyState: number = CONNECTING
  sent: string[] = []
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null

  url: string

  constructor(url: string) {
    this.url = url
    instances.push(this)
  }

  send(data: string) {
    if (this.readyState !== OPEN) throw new Error('socket not open')
    this.sent.push(data)
  }

  close() {
    this.readyState = CLOSED
    this.onclose?.()
  }

  // --- test helpers ---
  open() {
    this.readyState = OPEN
    this.onopen?.()
  }

  emit(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) })
  }

  drop() {
    this.readyState = CLOSED
    this.onclose?.()
  }
}

beforeEach(() => {
  instances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const latest = () => instances[instances.length - 1]

describe('useTelemetry', () => {
  it('derives a ws:// URL from the http gateway URL', () => {
    renderHook(() => useTelemetry())
    expect(latest().url).toMatch(/^ws:\/\/.*\/api\/telemetry$/)
  })

  it('reports connected once the socket opens', async () => {
    const { result } = renderHook(() => useTelemetry())
    act(() => latest().open())
    await waitFor(() => expect(result.current.connected).toBe(true))
  })

  it('exposes the latest telemetry frame', async () => {
    const { result } = renderHook(() => useTelemetry())
    act(() => {
      latest().open()
      latest().emit({ type: 'telemetry', x: 1.5, y: -2.5, theta: 0.3 })
    })
    await waitFor(() => expect(result.current.robotState?.x).toBe(1.5))
  })

  it('ignores a malformed frame instead of tearing down the stream', async () => {
    const { result } = renderHook(() => useTelemetry())
    act(() => {
      latest().open()
      latest().onmessage?.({ data: 'not json' })
      latest().emit({ type: 'telemetry', x: 9, y: 9, theta: 0 })
    })
    await waitFor(() => expect(result.current.robotState?.x).toBe(9))
  })

  it('merges a status frame without wiping the last known position', async () => {
    const { result } = renderHook(() => useTelemetry())
    act(() => {
      latest().open()
      latest().emit({ type: 'telemetry', x: 4, y: 5, theta: 0 })
      latest().emit({ type: 'status', status: 'NAVIGATING' })
    })
    await waitFor(() => {
      expect(result.current.robotState?.status).toBe('NAVIGATING')
      expect(result.current.robotState?.x).toBe(4)   // position preserved
    })
  })

  it('marks itself disconnected and schedules a reconnect when the link drops', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTelemetry())
    act(() => latest().open())
    act(() => latest().drop())

    expect(result.current.connected).toBe(false)
    act(() => { vi.advanceTimersByTime(2100) })
    expect(instances.length).toBe(2)   // a new socket was opened
  })

  it('backs off on repeated failures instead of hammering the gateway', () => {
    vi.useFakeTimers()
    renderHook(() => useTelemetry())

    act(() => latest().drop())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(instances.length).toBe(2)

    act(() => latest().drop())
    act(() => { vi.advanceTimersByTime(2000) })   // 2nd delay is 3000ms — too early
    expect(instances.length).toBe(2)

    act(() => { vi.advanceTimersByTime(1100) })
    expect(instances.length).toBe(3)
  })

  it('stops reconnecting once the component unmounts', () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useTelemetry())
    act(() => latest().open())
    unmount()
    act(() => { vi.advanceTimersByTime(30000) })
    expect(instances.length).toBe(1)
  })
})

describe('useVelocityCtrl', () => {
  it('connects to the teleop endpoint', () => {
    renderHook(() => useVelocityCtrl())
    expect(latest().url).toMatch(/\/api\/velocity_ctrl$/)
  })

  it('sends a cmd_vel frame in the shape the gateway parses', async () => {
    const { result } = renderHook(() => useVelocityCtrl())
    act(() => latest().open())
    act(() => result.current.sendVelocity(0.3, -0.2))

    expect(JSON.parse(latest().sent[0])).toEqual({ type: 'cmd_vel', linear: 0.3, angular: -0.2 })
  })

  it('drops commands silently while the socket is not open', () => {
    // The joystick fires at 10Hz regardless of link state; throwing here
    // would break the whole control surface on a brief reconnect.
    const { result } = renderHook(() => useVelocityCtrl())
    expect(() => act(() => result.current.sendVelocity(0.5, 0))).not.toThrow()
    expect(latest().sent).toHaveLength(0)
  })

  it('sends nothing after the link drops', () => {
    const { result } = renderHook(() => useVelocityCtrl())
    act(() => latest().open())
    const socket = latest()
    act(() => socket.drop())

    act(() => result.current.sendVelocity(0.5, 0))
    expect(socket.sent).toHaveLength(0)
  })

  it('relays a zero frame — the stop command must never be filtered out', () => {
    const { result } = renderHook(() => useVelocityCtrl())
    act(() => latest().open())
    act(() => result.current.sendVelocity(0, 0))
    expect(JSON.parse(latest().sent[0])).toEqual({ type: 'cmd_vel', linear: 0, angular: 0 })
  })

  it('closes the socket on unmount so the gateway deadman can stop the robot', () => {
    const { unmount } = renderHook(() => useVelocityCtrl())
    act(() => latest().open())
    const socket = latest()
    unmount()
    expect(socket.readyState).toBe(CLOSED)
  })
})
