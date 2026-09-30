/**
 * Deterministic bench-run traces.
 *
 * Outside the component module so ProjectTemplate.tsx exports components only
 * — a plain function exported alongside them breaks fast refresh for the file.
 */
/** Deterministic trace: a fixed function of the index, never random(). */
export function wobble(n: number, base: number, amp: number, spikes: { at: number; mag: number }[] = []): number[] {
    return Array.from({ length: n }, (_, i) => {
        let v = base + Math.sin(i * 0.37) * amp + Math.sin(i * 1.13) * amp * 0.35;
        for (const s of spikes) {
            const d = Math.abs(i - s.at);
            if (d < 7) v += s.mag * Math.exp(-(d * d) / 8);
        }
        return +v.toFixed(3);
    });
}
