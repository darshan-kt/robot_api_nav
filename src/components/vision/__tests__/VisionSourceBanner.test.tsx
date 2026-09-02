import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VisionSourceBanner } from '../VisionSourceBanner'

/**
 * The 3-way honesty promise: mock must never look like real data, webcam
 * must never look like the robot, and each state has to be unambiguous on
 * its own — a learner glancing at the card must never wonder which is
 * which.
 */

describe('VisionSourceBanner — mock state', () => {
  it('renders SIMULATED DATA', () => {
    render(<VisionSourceBanner sourceKind="mock" />)
    expect(screen.getByText('SIMULATED DATA')).toBeInTheDocument()
  })

  it('does not render YOUR CAMERA or LIVE', () => {
    render(<VisionSourceBanner sourceKind="mock" />)
    expect(screen.queryByText('YOUR CAMERA')).not.toBeInTheDocument()
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
  })

  it('is keyed by a stable testid', () => {
    render(<VisionSourceBanner sourceKind="mock" />)
    expect(screen.getByTestId('datasource-banner-vision')).toBeInTheDocument()
  })
})

describe('VisionSourceBanner — webcam state', () => {
  it('renders YOUR CAMERA, not SIMULATED', () => {
    render(<VisionSourceBanner sourceKind="webcam" />)
    expect(screen.getByText('YOUR CAMERA')).toBeInTheDocument()
    expect(screen.queryByText('SIMULATED DATA')).not.toBeInTheDocument()
  })

  it('explicitly states this is not the robot', () => {
    render(<VisionSourceBanner sourceKind="webcam" />)
    expect(screen.getByText(/not the robot's camera/i)).toBeInTheDocument()
  })

  it('does not render the diagonal-stripe watermark reserved for mock', () => {
    const { container } = render(<VisionSourceBanner sourceKind="webcam" />)
    expect(container.querySelector('[style*="repeating-linear-gradient"]')).not.toBeInTheDocument()
  })
})

describe('VisionSourceBanner — live state (reserved, future-proofing check)', () => {
  it('renders the LIVE pulse treatment, not SIMULATED or YOUR CAMERA', () => {
    render(<VisionSourceBanner sourceKind="live" online />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.queryByText('SIMULATED DATA')).not.toBeInTheDocument()
    expect(screen.queryByText('YOUR CAMERA')).not.toBeInTheDocument()
  })

  it('reports ONLINE/OFFLINE from the online prop', () => {
    const { rerender } = render(<VisionSourceBanner sourceKind="live" online />)
    expect(screen.getByText('ONLINE')).toBeInTheDocument()
    rerender(<VisionSourceBanner sourceKind="live" online={false} />)
    expect(screen.getByText('OFFLINE')).toBeInTheDocument()
  })

  it('shows measured Hz when provided, omits it when null', () => {
    const { rerender } = render(<VisionSourceBanner sourceKind="live" measuredHz={14.97} online />)
    expect(screen.getByText('15.0 Hz')).toBeInTheDocument()
    rerender(<VisionSourceBanner sourceKind="live" measuredHz={null} online />)
    expect(screen.queryByText(/Hz$/)).not.toBeInTheDocument()
  })
})
