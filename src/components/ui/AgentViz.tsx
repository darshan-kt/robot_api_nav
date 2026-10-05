/**
 * Live views for the two AI & robotics design drafts.
 *
 * Unlike every other figure in this console these are HTML rather than SVG,
 * and deliberately: both are mostly prose, and prose in a fixed viewBox either
 * overflows or scales its own type down to 6px at 375. Laid out as flow
 * content it wraps, stays selectable, and inherits the type scale.
 *
 * They sit inside LivePanel's media surface, so colours come from the
 * theme-invariant `media` tokens — the surface is dark in every theme.
 */
import type { ContextBlock, GateCall, GateStep } from '../../lib/liveFrames';

// ─────────────────────────────────────────────────────────────────────────
// Gate trace — one tool call, hop by hop
// ─────────────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<GateStep['status'], { chip: string; text: string; word: string }> = {
    moving: { chip: 'border-media-live bg-media-live/20', text: 'text-media-live', word: 'in flight' },
    hold: { chip: 'border-media-warn bg-media-warn/20', text: 'text-media-warn', word: 'held for a human' },
    refused: { chip: 'border-media-fault bg-media-fault/20', text: 'text-media-fault', word: 'refused' },
    bypass: { chip: 'border-media-warn bg-media-warn/10 border-dashed', text: 'text-media-warn', word: 'routed around the gate' },
    done: { chip: 'border-media-live bg-media-live/30', text: 'text-media-live', word: 'complete' },
};

const TIER_TONE: Record<GateCall['tier'], string> = {
    observe: 'border-media-live/50 text-media-live',
    propose: 'border-media-stream/50 text-media-stream',
    commit: 'border-media-warn/50 text-media-warn',
    always: 'border-media-fault/50 text-media-fault',
    'not exposed': 'border-media-fault/50 text-media-fault',
};

export function GateTrace({ chain, call, step, reached, callIndex, total }: {
    chain: string[];
    call: GateCall;
    step: GateStep;
    reached: number[];
    callIndex: number;
    total: number;
}) {
    const tone = STATUS_TONE[step.status];
    const furthest = Math.max(...reached);
    const bypassing = step.status === 'bypass';

    return (
        <div className="min-w-0">
            {/* which call, and what it is allowed to be */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
                <span className="text-title font-mono font-bold text-media-fg">{call.tool}</span>
                <span className={`px-2 py-0.5 rounded-full border text-meta font-mono uppercase tracking-widest ${TIER_TONE[call.tier]}`}>
                    {call.tier}
                </span>
                <span className={`text-meta font-mono uppercase tracking-widest ${tone.text}`}>{tone.word}</span>
                <span className="ml-auto text-meta font-mono uppercase tracking-widest text-media-fg/55">
                    call {callIndex + 1} / {total}
                </span>
            </div>

            {/* the chain. Wraps to a column rather than scrolling at 375. */}
            <ol className="flex flex-wrap gap-2 list-none p-0 m-0 mb-3">
                {chain.map((name, i) => {
                    const isGate = i === 2;
                    const here = step.stage === i;
                    const cleared = furthest > i || (furthest === i && step.status === 'done');
                    const skipped = bypassing && isGate;

                    const cls = skipped
                        ? 'border-media-warn/60 border-dashed bg-transparent text-media-warn/70'
                        : here
                            ? `${tone.chip} ${tone.text}`
                            : cleared
                                ? 'border-media-live/40 bg-media-live/5 text-media-fg/70'
                                : 'border-media-fg/15 bg-transparent text-media-fg/55';

                    return (
                        <li key={name}
                            className={`flex-1 basis-[128px] min-w-0 rounded-lg border px-3 py-2 text-center transition-colors duration-base ease-standard ${cls}`}>
                            <span className="block text-meta font-mono font-bold leading-tight break-words">{name}</span>
                            <span className="block text-meta font-mono uppercase tracking-widest opacity-70 mt-0.5">
                                {skipped ? 'skipped' : here ? '▸ here' : cleared ? 'cleared' : '—'}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {/* Reserved height: without it the panel grows and shrinks a line at
                a time as the notes change length, and the page jumps under the
                reader's cursor on every frame. */}
            <p className={`text-body leading-relaxed m-0 min-h-[3.25rem] ${tone.text}`}>{step.note}</p>

            {/* The floor is drawn on every frame, including the frames where
                nothing is near it. That is the claim: it is not a stage in the
                chain, it is underneath all of them, always. */}
            <div className={`mt-4 rounded-lg border border-dashed px-3 py-2.5 ${
                bypassing || call.tier === 'always'
                    ? 'border-media-fault bg-media-fault/15'
                    : 'border-media-fault/45 bg-media-fault/5'}`}>
                <span className="block text-meta font-mono font-bold uppercase tracking-widest text-media-fault">
                    E-Stop latch · cmd_vel deadman · speed ceiling
                </span>
                <span className="block text-meta font-mono text-media-fault/80 mt-1">
                    below the model · no schema · not reachable by any tool call
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Context window — the trust boundary, drawn where it actually runs
// ─────────────────────────────────────────────────────────────────────────

const CHANNEL_TONE: Record<ContextBlock['channel'], { rule: string; label: string }> = {
    instruction: { rule: 'border-media-live', label: 'text-media-live' },
    data: { rule: 'border-media-stream', label: 'text-media-stream' },
    model: { rule: 'border-media-fg/45', label: 'text-media-fg/70' },
};

export function ContextWindow({ blocks, shown, total }: {
    blocks: ContextBlock[]; shown: number; total: number;
}) {
    return (
        <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
                <span className="text-meta font-mono uppercase tracking-widest text-media-fg/70">
                    One turn, assembling
                </span>
                <span className="text-meta font-mono uppercase tracking-widest text-media-fg/55">
                    {shown} / {total} blocks
                </span>
            </div>

            {/* Height reserved for the finished stack so the page does not grow
                under the reader a block at a time. */}
            <ul className="list-none p-0 m-0 space-y-2 min-h-[21rem]">
                {blocks.map((b, i) => {
                    const tone = CHANNEL_TONE[b.channel];
                    const isData = b.channel === 'data';
                    return (
                        <li key={i}
                            className={`border-l-2 pl-3 ${tone.rule} ${isData ? 'ml-0 sm:ml-8' : ''} ${
                                b.hostile ? 'border-media-fault' : ''}`}>
                            <div className="flex flex-wrap items-baseline gap-x-2">
                                <span className={`text-meta font-mono ${b.hostile ? 'text-media-fault' : tone.label}`}>
                                    {b.label}
                                </span>
                                <span className="text-meta font-mono uppercase tracking-widest text-media-fg/55">
                                    {isData ? 'data channel' : b.channel === 'model' ? 'model output' : 'instruction channel'}
                                </span>
                            </div>
                            <p className={`text-body leading-relaxed m-0 mt-0.5 break-words ${
                                b.hostile ? 'text-media-fault font-mono' : 'text-media-fg/70'}`}>
                                {b.body}
                            </p>
                            {b.hostile && (
                                <p className="text-meta font-mono text-media-fault/85 m-0 mt-1 leading-relaxed">
                                    An imperative, arriving on the data channel. Identical to block 1 as far as
                                    the tokeniser is concerned — the tag it came in is the only thing separating them.
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>

            {shown === total && (
                <p className="text-meta font-mono text-media-live m-0 mt-3 leading-relaxed border-t border-media-fg/15 pt-3">
                    The call names the operator's destination, not the camera's. Nothing inside &lt;obs&gt; authorised
                    anything — and the call it did produce is still held at the commit tier.
                </p>
            )}
        </div>
    );
}
