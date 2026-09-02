import { describe, it, expect } from 'vitest'
import { sanitizeInput, escapeHTML, validateRobotConfig, validateFileUpload } from '../utils'

describe('sanitizeInput', () => {
  it('strips HTML tags from operator-entered text', () => {
    expect(sanitizeInput('<b>Route A</b>')).toBe('Route A')
  })

  it('neutralises a script tag', () => {
    expect(sanitizeInput('<script>alert(1)</script>Dock')).toBe('alert(1)Dock')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeInput('  Warehouse Loop  ')).toBe('Warehouse Loop')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('leaves ordinary mission names untouched', () => {
    expect(sanitizeInput('Aisle 3 → Dock 1 (night)')).toBe('Aisle 3 → Dock 1 (night)')
  })

  it('silently truncates at a bare "<" — a lossy edge case, not an XSS one', () => {
    // The regex is /<[^>]*>?/gm: the trailing '>' is OPTIONAL, so an
    // unclosed '<' swallows everything after it. A mission named
    // "Aisle 1 < Aisle 2" is stored as "Aisle 1". Not a security problem
    // (React escapes on render anyway) but it destroys operator input,
    // so the behaviour is pinned here rather than left to be rediscovered.
    expect(sanitizeInput('a < b')).toBe('a')
    expect(sanitizeInput('Aisle 1 < Aisle 2')).toBe('Aisle 1')
  })
})

describe('escapeHTML', () => {
  it('escapes characters that would otherwise open a tag', () => {
    expect(escapeHTML('<img src=x onerror=alert(1)>')).not.toContain('<img')
  })

  it('escapes ampersands', () => {
    expect(escapeHTML('Dock & Charge')).toBe('Dock &amp; Charge')
  })
})

describe('validateRobotConfig', () => {
  it.each([
    [0, true], [1.5, true], [5, true], [-0.1, false], [5.1, false],
  ])('maxSpeed(%s) === %s', (value, expected) => {
    expect(validateRobotConfig.maxSpeed(value as number)).toBe(expected)
  })

  it.each([
    [0.1, true], [0.5, true], [10, true], [0.09, false], [10.1, false],
  ])('obstacleDistance(%s) === %s', (value, expected) => {
    expect(validateRobotConfig.obstacleDistance(value as number)).toBe(expected)
  })
})

describe('validateFileUpload', () => {
  it.each(['map.pgm', 'map.yaml', 'floor.PNG', 'photo.jpeg'])('accepts %s', (name) => {
    expect(validateFileUpload.isAllowedType(name)).toBe(true)
  })

  it.each(['payload.exe', 'script.sh', 'archive.zip', 'map.pgm.exe'])('rejects %s', (name) => {
    expect(validateFileUpload.isAllowedType(name)).toBe(false)
  })

  it('is case-insensitive about extensions', () => {
    expect(validateFileUpload.isAllowedType('MAP.PGM')).toBe(true)
  })

  it('rejects a file with no extension', () => {
    expect(validateFileUpload.isAllowedType('mapfile')).toBe(false)
  })

  it('enforces the 10MB cap at the boundary', () => {
    expect(validateFileUpload.isAllowedSize(10 * 1024 * 1024)).toBe(true)
    expect(validateFileUpload.isAllowedSize(10 * 1024 * 1024 + 1)).toBe(false)
  })
})
