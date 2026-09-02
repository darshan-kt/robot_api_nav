import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { localDb } from '../localDb'

/**
 * localDb is the app's entire persistence layer — missions, schedules,
 * safety zones and the e-stop audit trail all live here in IndexedDB
 * (fake-indexeddb in this environment, installed by src/test/setup.ts).
 */

// A fresh IDBFactory per test. deleteDatabase() is NOT usable here: idb.ts
// opens a new connection for every operation and never closes any of them,
// so a delete blocks forever behind those open handles. Swapping the whole
// factory sidesteps that — the leak itself is noted in docs/TESTING.md.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

describe('robot record', () => {
  it('seeds a default robot on first read', async () => {
    const robot = await localDb.getRobot()
    expect(robot?.id).toBe('robot-1')
    expect(robot?.name).toBe('Pilot-Robot-01')
  })

  it('persists the seeded robot instead of reseeding', async () => {
    const first = await localDb.getRobot()
    await localDb.updateRobot('robot-1', { name: 'Renamed' })
    const second = await localDb.getRobot()
    expect(second?.name).toBe('Renamed')
    expect(second?.id).toBe(first?.id)
  })

  it('seeds conservative teleop limits', async () => {
    const robot = await localDb.getRobot()
    expect(robot?.max_linear_speed).toBe(0.1)
    expect(robot?.max_turn_rate).toBe(0.1)
  })

  it('self-heals a record still sitting on the old 0.5/1.0 defaults', async () => {
    await localDb.getRobot()
    await localDb.updateRobot('robot-1', { max_linear_speed: 0.5, max_turn_rate: 1.0 })
    const healed = await localDb.getRobot()
    expect(healed?.max_linear_speed).toBe(0.1)
    expect(healed?.max_turn_rate).toBe(0.1)
  })

  it('leaves a deliberately configured speed alone', async () => {
    await localDb.getRobot()
    await localDb.updateRobot('robot-1', { max_linear_speed: 0.5, max_turn_rate: 0.4 })
    const robot = await localDb.getRobot()
    expect(robot?.max_linear_speed).toBe(0.5)
  })

  it('never seeds a teleop limit above the gateway clamp', async () => {
    // The gateway caps at 0.8 m/s / 1.0 rad/s; a UI default above that
    // would present a speed the robot silently refuses to reach.
    const robot = await localDb.getRobot()
    expect(robot!.max_linear_speed!).toBeLessThanOrEqual(0.8)
    expect(robot!.max_turn_rate!).toBeLessThanOrEqual(1.0)
  })

  it('rejects an update to an unknown robot', async () => {
    await localDb.getRobot()
    await expect(localDb.updateRobot('ghost-robot', { name: 'x' })).rejects.toThrow(/not found/i)
  })
})

describe('emergency stops', () => {
  it('records a trigger', async () => {
    await localDb.triggerEmergencyStop('robot-1', true, 'operator pressed E-STOP')
    const stops = await localDb.getEmergencyStops()
    expect(stops).toHaveLength(1)
    expect(stops[0].is_active).toBe(true)
    expect(stops[0].triggered_at).not.toBeNull()
  })

  it('records a release with released_at set instead', async () => {
    await localDb.triggerEmergencyStop('robot-1', false, 'released')
    const [stop] = await localDb.getEmergencyStops()
    expect(stop.is_active).toBe(false)
    expect(stop.triggered_at).toBeNull()
    expect(stop.released_at).not.toBeNull()
  })

  it('notifies the rest of the UI via a DOM event', async () => {
    // The dashboard's status banner listens for this — without it the
    // banner would go stale after an e-stop from another page.
    const listener = vi.fn()
    window.addEventListener('localdb-estop-updated', listener)
    await localDb.triggerEmergencyStop('robot-1', true, 'test')
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('localdb-estop-updated', listener)
  })

  it('returns the audit trail newest first', async () => {
    await localDb.triggerEmergencyStop('robot-1', true, 'first')
    await new Promise(r => setTimeout(r, 5))
    await localDb.triggerEmergencyStop('robot-1', false, 'second')
    const stops = await localDb.getEmergencyStops()
    expect(stops[0].reason).toBe('second')
  })

  it('honours the limit argument', async () => {
    for (let i = 0; i < 5; i++) await localDb.triggerEmergencyStop('robot-1', true, `s${i}`)
    expect(await localDb.getEmergencyStops(3)).toHaveLength(3)
  })
})

describe('missions', () => {
  it('saves and reads back a mission', async () => {
    const saved = await localDb.saveMission({ name: 'Night loop', status: 'pending' })
    const all = await localDb.getMissions()
    expect(all.map(m => m.id)).toContain(saved.id)
  })

  it('updates in place rather than duplicating', async () => {
    const saved = await localDb.saveMission({ name: 'Loop', status: 'pending' })
    await localDb.saveMission({ id: saved.id, name: 'Loop', status: 'running' })
    const all = await localDb.getMissions()
    expect(all).toHaveLength(1)
    expect(all[0].status).toBe('running')
  })

  it('updates a mission status', async () => {
    const saved = await localDb.saveMission({ name: 'Loop', status: 'pending' })
    const updated = await localDb.updateMissionStatus(saved.id, 'completed')
    expect(updated.status).toBe('completed')
  })

  it('rejects a status update for an unknown mission', async () => {
    await expect(localDb.updateMissionStatus('nope', 'completed')).rejects.toThrow(/not found/i)
  })
})

describe('safety zones', () => {
  it('scopes zones to their map', async () => {
    await localDb.saveSafetyZone({ map_id: 'map-a', name: 'Zone A' })
    await localDb.saveSafetyZone({ map_id: 'map-b', name: 'Zone B' })
    const zones = await localDb.getSafetyZones('map-a')
    expect(zones).toHaveLength(1)
    expect(zones[0].name).toBe('Zone A')
  })

  it('deletes a zone', async () => {
    const zone = await localDb.saveSafetyZone({ map_id: 'map-a', name: 'Zone A' })
    await localDb.deleteSafetyZone(zone.id)
    expect(await localDb.getSafetyZones('map-a')).toHaveLength(0)
  })
})

describe('legacy localStorage migration', () => {
  it('imports old records and clears the legacy key', async () => {
    localStorage.setItem('robot_store_missions', JSON.stringify([
      { id: 'legacy-1', name: 'Old mission', created_at: new Date().toISOString() },
    ]))
    const missions = await localDb.getMissions()
    expect(missions.map(m => m.id)).toContain('legacy-1')
    expect(localStorage.getItem('robot_store_missions')).toBeNull()
  })

  it('ignores malformed legacy JSON instead of failing the read', async () => {
    localStorage.setItem('robot_store_missions', '{not json')
    await expect(localDb.getMissions()).resolves.toBeInstanceOf(Array)
  })

  it('runs only once', async () => {
    await localDb.getMissions()
    localStorage.setItem('robot_store_missions', JSON.stringify([{ id: 'late', created_at: '' }]))
    const missions = await localDb.getMissions()
    expect(missions.map(m => m.id)).not.toContain('late')
  })
})

describe('scheduled routes', () => {
  it('saves and reads back a schedule', async () => {
    const saved = await localDb.saveSchedule({ name: 'Nightly sweep', cron: '0 2 * * *' } as never)
    const all = await localDb.getSchedules()
    expect(all.map(s => s.id)).toContain(saved.id)
  })

  it('deletes a schedule', async () => {
    const saved = await localDb.saveSchedule({ name: 'Nightly sweep' } as never)
    await localDb.deleteSchedule(saved.id)
    expect(await localDb.getSchedules()).toHaveLength(0)
  })
})

describe('schedule executions', () => {
  it('saves and orders executions by scheduled time', async () => {
    await localDb.saveExecution({ scheduled_for: '2026-01-02T00:00:00Z' } as never)
    await localDb.saveExecution({ scheduled_for: '2026-01-01T00:00:00Z' } as never)
    const execs = await localDb.getExecutions()
    expect(execs[0].scheduled_for).toBe('2026-01-01T00:00:00Z')
  })
})

describe('record id generation', () => {
  /**
   * Regression: ids were `prefix + Date.now()`. Two records saved inside the
   * same millisecond collided, and because every save replaces on an id
   * match, the second silently overwrote the first — placing two waypoint
   * zones quickly was enough to lose one.
   */
  it('gives two zones saved back to back distinct ids', async () => {
    const a = await localDb.saveSafetyZone({ map_id: 'map-a', name: 'A' })
    const b = await localDb.saveSafetyZone({ map_id: 'map-a', name: 'B' })
    expect(a.id).not.toBe(b.id)
    expect(await localDb.getSafetyZones('map-a')).toHaveLength(2)
  })

  it('keeps every mission in a rapid burst', async () => {
    for (let i = 0; i < 20; i++) await localDb.saveMission({ name: `M${i}` })
    expect(await localDb.getMissions()).toHaveLength(20)
  })

  it('keeps every e-stop in a rapid burst', async () => {
    // The audit trail is the one place silent record loss would matter most.
    for (let i = 0; i < 10; i++) await localDb.triggerEmergencyStop('robot-1', true, `s${i}`)
    expect(await localDb.getEmergencyStops(50)).toHaveLength(10)
  })

  it('keeps every map saved in a burst', async () => {
    for (let i = 0; i < 10; i++) await localDb.saveMap({ name: `map${i}` })
    expect(await localDb.getMaps()).toHaveLength(10)
  })
})
