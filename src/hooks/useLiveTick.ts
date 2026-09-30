import { useEffect, useState } from 'react';

/**
 * A monotonically increasing tick for the reference pages' live panels.
 *
 * Driven by setInterval rather than requestAnimationFrame on purpose: these
 * views redraw at sensor rates (2–20 Hz), not display rates, and rAF would
 * burn 60 fps of React renders to show data that only changes twelve times a
 * second.
 *
 * Motion policy, matching DESIGN.md Appendix A: an animating panel on a
 * reference page is exactly the ambient motion that competes with the content
 * around it. So it is pausable, and under `prefers-reduced-motion: reduce` it
 * starts paused and stays paused until the reader asks for it — the panel
 * still renders a frame, it just does not move on its own.
 */
export function useLiveTick(hz: number) {
    const [reduced] = useState(() =>
        typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const [running, setRunning] = useState(!reduced);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setTick(t => t + 1), Math.max(1000 / hz, 40));
        return () => clearInterval(id);
    }, [running, hz]);

    /** Advance one frame while paused — the only way forward under reduced motion. */
    const step = () => setTick(t => t + 1);

    return { tick, running, setRunning, step, reduced };
}
