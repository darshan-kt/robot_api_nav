import { describe, it, expect } from 'vitest'
import { parsePgmToDataUrl } from '../pgmParser'

/**
 * The map the operator plans routes on is decoded by this parser. jsdom has
 * no canvas, so the successful render path can't run here — but every
 * rejection path can, and those are what protect the UI from a corrupt or
 * hostile .pgm.
 */
function pgm(header: string, pixels: number[]): ArrayBuffer {
  const head = new TextEncoder().encode(header)
  const out = new Uint8Array(head.length + pixels.length)
  out.set(head, 0)
  out.set(Uint8Array.from(pixels), head.length)
  return out.buffer
}

describe('parsePgmToDataUrl header validation', () => {
  it('rejects a non-P5 (ASCII P2) file', async () => {
    await expect(parsePgmToDataUrl(pgm('P2\n2 2\n255\n', [0, 0, 0, 0])))
      .rejects.toThrow(/P5/)
  })

  it('rejects a file that is not a PGM at all', async () => {
    await expect(parsePgmToDataUrl(new TextEncoder().encode('<html>').buffer))
      .rejects.toThrow(/P5/)
  })

  it('rejects a 16-bit PGM', async () => {
    await expect(parsePgmToDataUrl(pgm('P5\n2 2\n65535\n', [0, 0, 0, 0])))
      .rejects.toThrow(/maxVal/)
  })

  it('rejects a garbage header', async () => {
    await expect(parsePgmToDataUrl(pgm('P5\nwide tall\n255\n', [0])))
      .rejects.toThrow(/Invalid PGM header/)
  })

  it('rejects a truncated file rather than reading past the end', async () => {
    // Declares 4x4 = 16 pixels, supplies 4.
    await expect(parsePgmToDataUrl(pgm('P5\n4 4\n255\n', [0, 0, 0, 0])))
      .rejects.toThrow(/truncated/)
  })

  it('accepts comment lines in the header (map_saver emits them)', async () => {
    // Gets past header parsing — the only remaining failure is jsdom's
    // missing canvas, which proves the header was read correctly.
    await expect(parsePgmToDataUrl(pgm('P5\n# CREATOR: map_saver 0.05 m/pix\n2 2\n255\n', [0, 1, 2, 3])))
      .rejects.toThrow(/2D context/)
  })

  it('accepts a well-formed header with a full pixel payload', async () => {
    await expect(parsePgmToDataUrl(pgm('P5\n2 2\n255\n', [0, 128, 200, 255])))
      .rejects.toThrow(/2D context/)
  })
})
