/* src/lib/pgmParser.ts */
/**
 * Parses a PGM (Portable GrayMap) binary file (P5) and returns a Data URL (PNG).
 * Supports 8‑bit max value (0‑255) and skips comment lines that start with '#'.
 */
export async function parsePgmToDataUrl(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);

  // Helper to recognise whitespace characters.
  const isWs = (c: number) => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d; // space, tab, LF, CR
  const isComment = (c: number) => c === 0x23; // '#'

  // Skip whitespace and comments, returning the next non‑ignored index.
  const skipIgnored = (pos: number): number => {
    while (pos < bytes.length) {
      // Skip whitespace first.
      while (pos < bytes.length && isWs(bytes[pos])) pos++;
      // If a comment, skip to the end of the line.
      if (pos < bytes.length && isComment(bytes[pos])) {
        while (pos < bytes.length && bytes[pos] !== 0x0a) pos++;
        continue; // after newline, loop again to skip any further whitespace/comments
      }
      break;
    }
    return pos;
  };

  // Read the next token (sequence of non‑whitespace characters) and return it with the index after it.
  const readToken = (pos: number): { token: string; nextPos: number } => {
    pos = skipIgnored(pos);
    let end = pos;
    while (end < bytes.length && !isWs(bytes[end])) end++;
    const token = new TextDecoder().decode(bytes.subarray(pos, end));
    const nextPos = skipIgnored(end);
    return { token, nextPos };
  };

  // Verify magic number "P5".
  if (bytes[0] !== 0x50 || bytes[1] !== 0x35) {
    throw new Error('Only binary P5 PGM files are supported');
  }

  // Parse header: width, height, maxVal.
  let cursor = 2;
  const widthTok = readToken(cursor);
  const width = parseInt(widthTok.token, 10);
  const heightTok = readToken(widthTok.nextPos);
  const height = parseInt(heightTok.token, 10);
  const maxValTok = readToken(heightTok.nextPos);
  const maxVal = parseInt(maxValTok.token, 10);

  if (isNaN(width) || isNaN(height) || isNaN(maxVal)) {
    throw new Error('Invalid PGM header');
  }
  if (maxVal > 255) {
    throw new Error('Only maxVal <= 255 supported');
  }

  // Locate start of pixel data after any whitespace/comments following maxVal.
  let dataStart = maxValTok.nextPos;
  dataStart = skipIgnored(dataStart);

  const pixelCount = width * height;
  if (bytes.length - dataStart < pixelCount) {
    throw new Error('PGM file truncated');
  }
  const pixelData = bytes.subarray(dataStart, dataStart + pixelCount);

  // Render to canvas.
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to get 2D context');
  const imageData = ctx.createImageData(width, height);
  const dst = imageData.data;
  for (let i = 0, j = 0; i < pixelData.length; i++, j += 4) {
    const v = pixelData[i];
    dst[j] = v; // R
    dst[j + 1] = v; // G
    dst[j + 2] = v; // B
    dst[j + 3] = 255; // A
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
