/**
 * Deterministic sampling for the distribution lab pages.
 *
 * Samples are drawn by inverse transform from a seeded PRNG, so the histogram
 * on screen is a REAL draw from the distribution, not a shape traced to look
 * like one. Same seed, same stream — which is what lets a page accumulate
 * samples as the tick advances and still replay identically when paused.
 *
 * Because the stream is fixed, taking the first n of it is the same as having
 * drawn n samples one at a time. That is the whole trick behind the
 * "watch the histogram fill up" view.
 */

/** mulberry32 — small, fast, good enough for teaching, fully reproducible. */
export function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Inverse-transform samplers ───────────────────────────────────────────

export function uniformSamples(n: number, a: number, b: number, seed = 12345): number[] {
    const r = rng(seed);
    return Array.from({ length: n }, () => a + r() * (b - a));
}

/** F⁻¹(u) = −ln(1 − u) / λ */
export function exponentialSamples(n: number, lambda: number, seed = 2024): number[] {
    const r = rng(seed);
    return Array.from({ length: n }, () => -Math.log(1 - r()) / lambda);
}

/** Box–Muller. Returns one of the pair per draw; the discarded half costs
 *  nothing here and keeps the stream index aligned with the sample index. */
export function normalSamples(n: number, mu: number, sigma: number, seed = 777): number[] {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
        const u1 = Math.max(r(), 1e-12);
        const u2 = r();
        return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    });
}

// ── Densities (the curve the histogram should approach) ──────────────────

export const pdfUniform = (a: number, b: number) => (x: number) => (x >= a && x <= b ? 1 / (b - a) : 0);

export const pdfExponential = (lambda: number) => (x: number) => (x >= 0 ? lambda * Math.exp(-lambda * x) : 0);

export const pdfNormal = (mu: number, sigma: number) => (x: number) =>
    Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));

// ── Binning ──────────────────────────────────────────────────────────────

/** Counts per bin, normalised to a density so it is directly comparable
 *  with the pdf drawn over it (bars and curve share one y axis). */
export function histogram(samples: number[], bins: number, domain: [number, number]): number[] {
    const [lo, hi] = domain;
    const w = (hi - lo) / bins;
    const counts = new Array(bins).fill(0);
    for (const s of samples) {
        if (s < lo || s >= hi) continue;
        counts[Math.min(bins - 1, Math.floor((s - lo) / w))]++;
    }
    const n = samples.length || 1;
    return counts.map(c => c / (n * w));
}

/** Sample mean and standard deviation — what the lab actually measures. */
export function stats(samples: number[]): { mean: number; sd: number } {
    const n = samples.length || 1;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
    return { mean, sd };
}
