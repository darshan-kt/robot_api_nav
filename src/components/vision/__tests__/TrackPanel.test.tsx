import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TrackPanel } from '../TrackPanel'
import { VisionSourceProvider } from '../../../lib/vision/VisionSourceContext'
import { ToastProvider } from '../../ui/Toast'

/**
 * TrackPanel is where the real "STOP not search" state machine actually
 * lives — it mirrors color_tracker_node.py's architecture directly: a
 * per-frame detection that updates the last-known-good Twist, and a
 * SEPARATE, frame-rate-independent safety tick that decides whether that
 * command is still current or the timeout has elapsed. This is the app's
 * central safety claim, tested at the level that actually owns it.
 */

function renderPanel() {
  return render(
    <ToastProvider>
      <VisionSourceProvider>
        <TrackPanel active />
      </VisionSourceProvider>
    </ToastProvider>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('TrackPanel — steady tracking', () => {
  it('reports a non-zero linear.x once the target has been detected (mock target visible by default)', () => {
    renderPanel()
    act(() => { vi.advanceTimersByTime(500) })

    const readout = screen.getByTestId('twist-readout')
    // linear.x is ALWAYS max_linear_speed while tracking — the default is 0.12.
    expect(readout).toHaveTextContent('0.120')
  })
})

describe('TrackPanel — STOP not search', () => {
  it('holds the last command during the grace period, then hard-zeros after target_lost_timeout_sec — never a spin', async () => {
    renderPanel()

    // Let the pipeline lock onto the (visible-by-default) mock target.
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByTestId('twist-readout')).toHaveTextContent('0.120')

    // Hide the target via the TargetLostDemo toggle rendered inside TrackPanel.
    const toggle = screen.getByTestId('target-lost-toggle').querySelector('button')!
    act(() => { fireEvent.click(toggle) })

    // Still inside the 1.0s default grace period — no WARN yet, and the
    // panel is still holding the last known-good command (not zeroed
    // instantly the moment one frame has no detection).
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.queryByTestId('target-lost-warn-log')).not.toBeInTheDocument()

    // Past the timeout now (total ~1.1s since hiding).
    act(() => { vi.advanceTimersByTime(600) })

    const warnLog = screen.getByTestId('target-lost-warn-log')
    expect(warnLog).toHaveTextContent('publishing STOP, not searching')

    const readout = screen.getByTestId('twist-readout')
    expect(readout).toHaveTextContent('0.000')
    // Both axes must be exactly zero — not just linear.x.
    const numbers = readout.textContent?.match(/-?\d+\.\d{3}/g) ?? []
    expect(numbers.every((n) => Number(n) === 0)).toBe(true)
  })

  it('the sandbox disclaimer is present whenever the sandbox renders — this app never controls real hardware', () => {
    renderPanel()
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByTestId('robot-sandbox-disclaimer')).toHaveTextContent('not connected to the real robot')
  })
})
