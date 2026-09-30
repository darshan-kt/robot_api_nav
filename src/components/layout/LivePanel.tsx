import type { ReactNode } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { useLiveTick } from '../../hooks/useLiveTick';

/**
 * "Live visualization" panel for the sensor reference pages.
 *
 * The word live here describes the view updating, NOT a link to hardware —
 * so the chip says SIMULATED, reusing the labs' existing vocabulary rather
 * than inventing a parallel one. `LIVE` and `OFFLINE` stay reserved for real
 * connection state everywhere in this console, and nothing on a reference
 * page is allowed to claim either.
 *
 * Children receive the tick so each sensor can generate its own frame; the
 * generators stay pure and deterministic given (index, tick), which is what
 * keeps them unit-testable and screenshot-stable.
 */
export function LivePanel({
    hz,
    rateLabel,
    children,
    readout,
    quiet = false,
}: {
    hz: number;
    /** What the real sensor's rate would be, e.g. "10 rev/s". */
    rateLabel: string;
    children: (tick: number) => ReactNode;
    /** Optional per-frame numeric strip under the figure. */
    readout?: (tick: number) => ReactNode;
    /** Suppress the simulation caveat when the host page already states it —
     *  the reduced-motion hint still shows, because that one is actionable. */
    quiet?: boolean;
}) {
    const { tick, running, setRunning, step, reduced } = useLiveTick(hz);

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <h2 className="text-title font-bold text-text">Live visualization</h2>
                    <span className="shrink-0 px-2 py-0.5 rounded-full border border-warning/40 bg-warning/15 text-warning text-meta font-mono uppercase tracking-widest">
                        Simulated
                    </span>
                </div>

                {/* No shrink-0 here: a long rateLabel ("12 Hz — the array's
                    real cycle") cannot then shrink or wrap, and pushed the
                    document 61px wider than a 375 viewport. */}
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-meta font-mono uppercase tracking-widest text-textMuted">
                        {rateLabel}
                    </span>
                    <button
                        type="button"
                        onClick={() => setRunning(r => !r)}
                        aria-pressed={running}
                        aria-label={running ? 'Pause the simulated feed' : 'Play the simulated feed'}
                        className="tap-target inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-card/60
                                   text-meta font-mono uppercase tracking-widest text-textMuted
                                   hover:text-text hover:border-live/50 transition-colors duration-base ease-standard"
                    >
                        {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {running ? 'Pause' : 'Play'}
                    </button>
                    <button
                        type="button"
                        onClick={step}
                        disabled={running}
                        aria-label="Advance one frame"
                        className="tap-target inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-card/60
                                   text-meta font-mono uppercase tracking-widest text-textMuted
                                   hover:text-text hover:border-live/50 transition-colors duration-base ease-standard
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-textMuted disabled:hover:border-border/60"
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        Step
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-media-bg p-4 overflow-x-auto">
                {children(tick)}
            </div>

            {readout && <div className="mt-3">{readout(tick)}</div>}

            {(reduced || !quiet) && (
                <p className="text-body text-textMuted leading-relaxed mt-3">
                    {reduced
                        ? 'Your system asks for reduced motion, so this starts paused. Press play to run it, or step through a frame at a time.'
                        : 'Synthesised from the sensor model on this page — no robot is attached to this console and nothing here reads hardware. Frames are a pure function of the frame index, so pausing and stepping replays exactly the same sequence.'}
                </p>
            )}
        </section>
    );
}
