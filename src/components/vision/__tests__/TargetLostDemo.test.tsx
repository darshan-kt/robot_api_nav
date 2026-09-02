import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TargetLostDemo } from '../TargetLostDemo'
import { VisionSourceProvider } from '../../../lib/vision/VisionSourceContext'

/**
 * TargetLostDemo is purely presentational — the actual countdown/hysteresis
 * timing lives in TrackPanel (see TrackPanel.test.tsx for that). These
 * tests cover what this component owns: rendering the right state per
 * prop, and — mock mode only — the toggle actually driving the source.
 */

function renderInMock(props: Partial<React.ComponentProps<typeof TargetLostDemo>> = {}) {
  return render(
    <VisionSourceProvider>
      <TargetLostDemo secondsSinceLastDetection={null} targetLostTimeoutSec={1.0} stopped={false} {...props} />
    </VisionSourceProvider>
  )
}

describe('TargetLostDemo — idle state', () => {
  it('shows the mock hide-target toggle by default (mock is the default source)', () => {
    renderInMock()
    expect(screen.getByTestId('target-lost-toggle')).toBeInTheDocument()
  })

  it('shows no countdown or WARN log before anything has been detected', () => {
    renderInMock()
    expect(screen.queryByTestId('target-lost-countdown')).not.toBeInTheDocument()
    expect(screen.queryByTestId('target-lost-warn-log')).not.toBeInTheDocument()
  })
})

describe('TargetLostDemo — countdown state', () => {
  it('renders the countdown once a detection time exists, without WARN yet', () => {
    renderInMock({ secondsSinceLastDetection: 0.4, stopped: false })
    expect(screen.getByTestId('target-lost-countdown')).toHaveTextContent('0.4s since last detection')
    expect(screen.queryByTestId('target-lost-warn-log')).not.toBeInTheDocument()
  })
})

describe('TargetLostDemo — stopped state', () => {
  it('renders the WARN log line naming target_lost_timeout_sec, not a search/spin state', () => {
    renderInMock({ secondsSinceLastDetection: 1.4, targetLostTimeoutSec: 1.0, stopped: true })
    const warn = screen.getByTestId('target-lost-warn-log')
    expect(warn).toHaveTextContent('STOP, not searching')
    // Guards the actual safety claim: nothing in this component's output
    // ever mentions searching/spinning as the response to loss.
    expect(warn.textContent?.toLowerCase()).not.toContain('spin')
    expect(warn.textContent?.toLowerCase()).not.toMatch(/\bsearch\b(?!ing — not)/)
  })

  it('explains the Project 1 vs Project 2 contrast the course itself draws', () => {
    renderInMock({ secondsSinceLastDetection: 1.4, stopped: true })
    expect(screen.getByText(/Project 1 had its own obstacle sensor/)).toBeInTheDocument()
  })
})

describe('TargetLostDemo — mock toggle actually drives the source', () => {
  it('clicking Hide the target flips the button into the hidden state', () => {
    renderInMock()
    const button = screen.getByTestId('target-lost-toggle').querySelector('button')!
    expect(button).toHaveTextContent('Hide the target')

    fireEvent.click(button)
    expect(button).toHaveTextContent('TARGET HIDDEN')

    fireEvent.click(button)
    expect(button).toHaveTextContent('Hide the target')
  })
})
