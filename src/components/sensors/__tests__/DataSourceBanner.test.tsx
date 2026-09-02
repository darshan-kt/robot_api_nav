import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataSourceBanner } from '../DataSourceBanner'

/**
 * This component IS the honesty promise: every card must be unmistakable
 * about whether it's showing simulated or real data. These tests pin the
 * two states apart — a mock banner must never claim to be live, and vice
 * versa — since that confusion is exactly what this component exists to
 * prevent.
 */

describe('DataSourceBanner — mock state', () => {
  it('renders an unmissable SIMULATED DATA label', () => {
    render(<DataSourceBanner sourceKind="mock" deviceId="rplidar_a2" />)
    expect(screen.getByText('SIMULATED DATA')).toBeInTheDocument()
  })

  it('does not render a live topic/Hz/online pill', () => {
    render(<DataSourceBanner sourceKind="mock" deviceId="rplidar_a2" topic="/scan" measuredHz={10} online />)
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.queryByText('ONLINE')).not.toBeInTheDocument()
    expect(screen.queryByText('10.0 Hz')).not.toBeInTheDocument()
  })

  it('is keyed by data-testid to its device', () => {
    render(<DataSourceBanner sourceKind="mock" deviceId="astra_pro" />)
    expect(screen.getByTestId('datasource-banner-astra_pro')).toBeInTheDocument()
  })
})

describe('DataSourceBanner — live state', () => {
  it('renders the LIVE label, not SIMULATED', () => {
    render(<DataSourceBanner sourceKind="live" deviceId="rplidar_a2" online />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.queryByText('SIMULATED DATA')).not.toBeInTheDocument()
  })

  it('renders the topic and measured Hz when provided', () => {
    render(<DataSourceBanner sourceKind="live" deviceId="rplidar_a2" topic="/scan" measuredHz={9.98} online />)
    expect(screen.getByText('/scan')).toBeInTheDocument()
    expect(screen.getByText('10.0 Hz')).toBeInTheDocument()
  })

  it('reports ONLINE when connected and OFFLINE when not', () => {
    const { rerender } = render(<DataSourceBanner sourceKind="live" deviceId="rplidar_a2" online />)
    expect(screen.getByText('ONLINE')).toBeInTheDocument()

    rerender(<DataSourceBanner sourceKind="live" deviceId="rplidar_a2" online={false} />)
    expect(screen.getByText('OFFLINE')).toBeInTheDocument()
  })

  it('omits the Hz pill when measuredHz is null', () => {
    render(<DataSourceBanner sourceKind="live" deviceId="rplidar_a2" measuredHz={null} online />)
    expect(screen.queryByText(/Hz$/)).not.toBeInTheDocument()
  })
})
