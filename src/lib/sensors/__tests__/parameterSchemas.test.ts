import { describe, it, expect } from 'vitest'
import { RPLIDAR_A2_PARAMETERS, ASTRA_PRO_PARAMETERS, PARAMETER_SCHEMAS } from '../parameterSchemas'
import { MockSensorSource } from '../MockSensorSource'
import type { ParameterDef } from '../types'

/**
 * The reconfigure tag on each parameter is a factual claim about real
 * hardware ("this can only change via a driver restart"), not a UI
 * convenience — these tests protect its structural integrity (every entry
 * tagged, every tag valid, nothing silently blank) so a future correction
 * only ever has to touch parameterSchemas.ts itself, per the plan's
 * backend-implementer checklist.
 */

const ALL_SCHEMAS: [string, ParameterDef[]][] = [
  ['rplidar_a2', RPLIDAR_A2_PARAMETERS],
  ['astra_pro', ASTRA_PRO_PARAMETERS],
]

describe.each(ALL_SCHEMAS)('%s parameter schema', (_deviceId, params) => {
  it('is non-empty', () => {
    expect(params.length).toBeGreaterThan(0)
  })

  it('every entry has a valid reconfigure tag', () => {
    for (const p of params) {
      expect(['live', 'restart', 'investigate']).toContain(p.reconfigure)
    }
  })

  it('every entry has a non-empty reconfigureNote — no unjustified tags', () => {
    for (const p of params) {
      expect(p.reconfigureNote.trim().length).toBeGreaterThan(10)
    }
  })

  it('every entry cites a sourceRef', () => {
    for (const p of params) {
      expect(p.sourceRef.trim().length).toBeGreaterThan(0)
    }
  })

  it('has unique keys', () => {
    const keys = params.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('numeric params satisfy min <= default <= max', () => {
    for (const p of params) {
      if (p.type === 'number' && p.min !== undefined && p.max !== undefined) {
        expect(p.default as number).toBeGreaterThanOrEqual(p.min)
        expect(p.default as number).toBeLessThanOrEqual(p.max)
      }
    }
  })

  it('enum params default to one of their own options', () => {
    for (const p of params) {
      if (p.type === 'enum') {
        expect(p.options?.map((o) => o.value)).toContain(String(p.default))
      }
    }
  })

  it('boolean params default to an actual boolean', () => {
    for (const p of params) {
      if (p.type === 'boolean') {
        expect(typeof p.default).toBe('boolean')
      }
    }
  })
})

describe('parameterSchemas — device-specific facts that must not silently drift', () => {
  it('serial_baudrate is tagged restart — the single most load-bearing tag in the app', () => {
    const baud = RPLIDAR_A2_PARAMETERS.find((p) => p.key === 'serial_baudrate')
    expect(baud?.reconfigure).toBe('restart')
  })

  it("serial_baudrate's default matches the real node's own mismatched default, not a submodel value", () => {
    // This IS the Baud Rate Trap: the node's compiled-in default (1,000,000
    // bps) matches no A2 submodel. Seeding the schema default to a
    // submodel's correct value would quietly erase the finding it exists to
    // teach.
    const baud = RPLIDAR_A2_PARAMETERS.find((p) => p.key === 'serial_baudrate')
    expect(baud?.default).toBe('1000000')
  })

  it('depth_registration defaults to false — matching the real driver default, not the topic name it belies', () => {
    const reg = ASTRA_PRO_PARAMETERS.find((p) => p.key === 'depth_registration')
    expect(reg?.default).toBe(false)
  })

  it('every enable_* Astra flag is tagged restart, since each gates a stream opened at node startup', () => {
    const enableFlags = ASTRA_PRO_PARAMETERS.filter((p) => p.key.startsWith('enable_'))
    expect(enableFlags.length).toBeGreaterThan(0)
    for (const flag of enableFlags) {
      expect(flag.reconfigure).toBe('restart')
    }
  })
})

describe('parameterSchemas <-> MockSensorSource round trip', () => {
  it('a fresh source is seeded from exactly the schema defaults, for every device', () => {
    const source = new MockSensorSource()
    try {
      for (const [deviceId, params] of ALL_SCHEMAS) {
        for (const p of params) {
          expect(source.getParameterValue(deviceId as 'rplidar_a2' | 'astra_pro', p.key)).toBe(p.default)
        }
      }
    } finally {
      source.dispose()
    }
  })

  it('PARAMETER_SCHEMAS indexes both devices and nothing else', () => {
    expect(Object.keys(PARAMETER_SCHEMAS).sort()).toEqual(['astra_pro', 'rplidar_a2'])
  })
})
