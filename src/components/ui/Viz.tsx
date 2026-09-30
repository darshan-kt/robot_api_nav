/**
 * Figure primitives.
 *
 * All hand-authored inline SVG on the theme tokens — no charting dependency,
 * because a library's defaults (palette, type, tooltips) fight the design
 * system and these figures are static.
 *
 * Everything here is DETERMINISTIC: geometry is a pure function of its inputs
 * with no random() anywhere, so a figure does not change between renders and a
 * screenshot diff stays meaningful.
 */
import type { ReactNode } from 'react';
import { castRoom } from '../../lib/roomCast';

/** Shared frame: caption sits under the figure, per the page anatomy. */
export function Figure({ title, caption, children }: { title: string; caption: ReactNode; children: ReactNode }) {
    return (
        <figure className="m-0">
            {/* Figures scroll at natural size rather than scaling down: a
                640-unit viewBox squeezed into 320px renders its labels at 5px.
                Each primitive sets its own min-width; this just scrolls. */}
            <div className="rounded-xl border border-border/60 bg-media-bg p-4 overflow-x-auto">
                {children}
            </div>
            <figcaption className="mt-3">
                <span className="block text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{title}</span>
                <span className="block text-body text-textMuted leading-relaxed">{caption}</span>
            </figcaption>
        </figure>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Depth envelope — side elevation of what a depth camera can actually use
// ─────────────────────────────────────────────────────────────────────────

export interface DepthBand {
    from: number;
    to: number;
    label: string;
    kind: 'dead' | 'calibrated' | 'degraded';
}

export function DepthEnvelope({ bands, vfovDeg, maxM }: { bands: DepthBand[]; vfovDeg: number; maxM: number }) {
    // Box sized FROM the geometry, not guessed: a true 49.5 deg wedge across
    // 8 m needs +/-3.7 m of vertical extent. At the old 640x260 the wedge ran
    // off both edges and the 4 m / 8 m labels landed ~140px below the viewBox.
    const W = 420, H = 360, originX = 70, originY = H / 2;
    const scale = (W - originX - 40) / maxM;
    const half = (vfovDeg / 2) * (Math.PI / 180);

    // The sensor's vertical field of view, drawn as a real wedge.
    const edgeY = (m: number) => Math.tan(half) * m * scale;
    const fill: Record<DepthBand['kind'], string> = {
        dead: 'fill-fault/20',
        calibrated: 'fill-live/20',
        degraded: 'fill-warning/15',
    };
    const stroke: Record<DepthBand['kind'], string> = {
        dead: 'stroke-fault',
        calibrated: 'stroke-live',
        degraded: 'stroke-warning',
    };

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[520px] mx-auto block"
            style={{ minWidth: W }} role="img"
            aria-label={`Depth envelope: ${bands.map(b => `${b.label} ${b.from} to ${b.to} metres`).join(', ')}`}>
            {bands.map(b => {
                const x0 = originX + b.from * scale, x1 = originX + b.to * scale;
                const y0 = edgeY(b.from), y1 = edgeY(b.to);
                return (
                    <g key={b.label}>
                        <path
                            d={`M ${x0} ${originY - y0} L ${x1} ${originY - y1} L ${x1} ${originY + y1} L ${x0} ${originY + y0} Z`}
                            className={`${fill[b.kind]} ${stroke[b.kind]}`} strokeWidth={1}
                        />
                        <line x1={x1} y1={originY - y1} x2={x1} y2={originY + y1}
                            className={stroke[b.kind]} strokeWidth={1} strokeDasharray="3 3" />
                        <text x={x1} y={originY + y1 + 16} textAnchor="middle"
                            className="fill-media-fg font-mono" fontSize={12}>{b.to} m</text>
                    </g>
                );
            })}

            {/* sensor body */}
            <rect x={originX - 16} y={originY - 14} width={16} height={28} rx={3}
                className="fill-media-fg/70" />
            <text x={originX - 24} y={originY + 4} textAnchor="end"
                className="fill-media-fg/70 font-mono" fontSize={12}>sensor</text>

            {/* band labels, stacked so they never collide with the wedge */}
            {bands.map((b, i) => (
                <text key={b.label} x={originX + 8} y={20 + i * 17}
                    className="fill-media-fg/80 font-mono" fontSize={12}>
                    <tspan className={stroke[b.kind].replace('stroke-', 'fill-')}>■</tspan> {b.label}
                </text>
            ))}
            <text x={W - 4} y={H - 6} textAnchor="end" className="fill-media-fg/50 font-mono" fontSize={12}>
                vertical FOV {vfovDeg}°
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Polar scan — one frame, ray-cast from real room geometry
// ─────────────────────────────────────────────────────────────────────────


export function PolarScan({ beams = 360, maxM = 6, rings = [1, 2, 3, 4, 5], ranges }:
    { beams?: number; maxM?: number; rings?: number[];
      /** Supplied frame (live panel). Omit for the static ray-cast room. */
      ranges?: (number | null)[] }) {
    const S = 300, c = S / 2, R = c - 26;
    const pts = ranges
        ? ranges.map((range, i) => ({ angle: (i / ranges.length) * Math.PI * 2, range }))
        : castRoom(beams);
    const scale = R / maxM;

    return (
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto max-w-[420px] mx-auto block"
            style={{ minWidth: 340 }} role="img"
            aria-label={ranges
                ? `Polar plot of a simulated scan frame, ${ranges.filter(r => r !== null).length} of ${ranges.length} beams returning`
                : 'Polar plot of one scan frame in a 6 by 4 metre room with a doorway and a pillar'}>
            {rings.map(m => (
                <g key={m}>
                    <circle cx={c} cy={c} r={m * scale} className="fill-none stroke-media-live/15" strokeWidth={1} />
                    <text x={c + 3} y={c - m * scale + 10} className="fill-media-live/40 font-mono" fontSize={11}>{m}m</text>
                </g>
            ))}
            <line x1={c - R} y1={c} x2={c + R} y2={c} className="stroke-media-live/15" strokeWidth={1} />
            <line x1={c} y1={c - R} x2={c} y2={c + R} className="stroke-media-live/15" strokeWidth={1} />

            {pts.map((p, i) => {
                if (p.range === null) return null;
                const r = Math.min(p.range, maxM) * scale;
                // scanner frame: 0 rad is forward (up), CCW positive
                const x = c - Math.sin(p.angle) * r;
                const y = c - Math.cos(p.angle) * r;
                return <circle key={i} cx={x} cy={y} r={1.5} className="fill-media-live/80" />;
            })}

            <circle cx={c} cy={c} r={5} className="fill-media-live stroke-media-fg" strokeWidth={1.5} />
            <path d={`M ${c} ${c - 13} L ${c - 5} ${c - 7} L ${c + 5} ${c - 7} Z`} className="fill-media-fg" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Signed axis bars — IMU, stationary and level
// ─────────────────────────────────────────────────────────────────────────

export interface AxisTriple {
    label: string;
    unit: string;
    span: number;
    values: [number, number, number];
    /** Gyro bias lives in the thousandths; two decimals renders it as 0.00. */
    decimals?: number;
}

export function AxisBars({ groups }: { groups: AxisTriple[] }) {
    const ROW = 26, PAD = 16, LABEL = 104, BAR = 300;
    const H = PAD * 2 + groups.length * (ROW * 3 + 18);
    const mid = LABEL + BAR / 2;

    return (
        <svg viewBox={`0 0 ${LABEL + BAR + 96} ${H}`} className="w-full h-auto"
            style={{ minWidth: LABEL + BAR + 96 }} role="img"
            aria-label={groups.map(g => `${g.label}: x ${g.values[0]}, y ${g.values[1]}, z ${g.values[2]} ${g.unit}`).join('; ')}>
            {groups.map((g, gi) => {
                const top = PAD + gi * (ROW * 3 + 18);
                return (
                    <g key={g.label}>
                        <text x={0} y={top + 10} className="fill-media-fg font-mono" fontSize={12}>{g.label}</text>
                        <line x1={mid} y1={top + 14} x2={mid} y2={top + 14 + ROW * 3}
                            className="stroke-media-fg/30" strokeWidth={1} />
                        {(['x', 'y', 'z'] as const).map((ax, ai) => {
                            const v = g.values[ai];
                            const w = (v / g.span) * (BAR / 2);
                            const y = top + 18 + ai * ROW;
                            return (
                                <g key={ax}>
                                    <text x={LABEL - 10} y={y + 11} textAnchor="end"
                                        className="fill-media-fg/60 font-mono" fontSize={12}>{ax}</text>
                                    <rect x={w >= 0 ? mid : mid + w} y={y} width={Math.max(Math.abs(w), 1)} height={ROW - 9} rx={1}
                                        className={v === 0 ? 'fill-media-fg/25' : 'fill-media-live/80'} />
                                    <text x={LABEL + BAR + 8} y={y + 11}
                                        className="fill-media-fg font-mono" fontSize={12}>
                                        {v.toFixed(g.decimals ?? 2)} {g.unit}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Beam cones — one per transducer, at the real beam angle
// ─────────────────────────────────────────────────────────────────────────

export interface Transducer { name: string; mountDeg: number; echoM: number | null }

export function BeamCones({ transducers, beamDeg, maxM }: { transducers: Transducer[]; beamDeg: number; maxM: number }) {
    const S = 300, c = S / 2, R = c - 34;   // margin for the edge labels
    const scale = R / maxM;
    const half = (beamDeg / 2) * (Math.PI / 180);

    return (
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto max-w-[420px] mx-auto block"
            style={{ minWidth: 340 }} role="img"
            aria-label={transducers.map(t => `${t.name}: ${t.echoM === null ? 'no echo' : t.echoM + ' metres'}`).join('; ')}>
            {[1, 2, 3].filter(m => m <= maxM).map(m => (
                <circle key={m} cx={c} cy={c} r={m * scale} className="fill-none stroke-media-fg/10" strokeWidth={1} />
            ))}

            {transducers.map(t => {
                const a = (t.mountDeg - 90) * (Math.PI / 180);
                const a0 = a - half, a1 = a + half;
                const p = (ang: number, r: number) => `${c + Math.cos(ang) * r} ${c + Math.sin(ang) * r}`;
                const coneR = maxM * scale;
                const hasEcho = t.echoM !== null;
                return (
                    <g key={t.name}>
                        <path d={`M ${c} ${c} L ${p(a0, coneR)} A ${coneR} ${coneR} 0 0 1 ${p(a1, coneR)} Z`}
                            className={hasEcho ? 'fill-media-live/10 stroke-media-live/30' : 'fill-media-fg/5 stroke-media-fg/15'}
                            strokeWidth={1} strokeDasharray={hasEcho ? undefined : '3 3'} />
                        {hasEcho && (
                            <path d={`M ${p(a0, t.echoM! * scale)} A ${t.echoM! * scale} ${t.echoM! * scale} 0 0 1 ${p(a1, t.echoM! * scale)}`}
                                className="fill-none stroke-media-live" strokeWidth={2.5} />
                        )}
                        {(() => {
                            // Clamp the label inside the viewBox and derive the
                            // anchor from the CLAMPED position: at mount -60 the
                            // natural end-anchored x is ~32, so "0.61 m" began at
                            // x=-8 and rendered as ".61 m".
                            const raw = c + Math.cos(a) * (coneR + 8);
                            const lx = Math.min(S - 6, Math.max(6, raw));
                            const anchor = lx <= 6 ? 'start'
                                : lx >= S - 6 ? 'end'
                                    : Math.cos(a) > 0.3 ? 'start'
                                        : Math.cos(a) < -0.3 ? 'end' : 'middle';
                            return (
                                <text x={lx} y={c + Math.sin(a) * (coneR + 8) + 3} textAnchor={anchor}
                                    className={hasEcho ? 'fill-media-live font-mono' : 'fill-media-fg/40 font-mono'} fontSize={11}>
                                    {t.echoM === null ? 'no echo' : `${t.echoM.toFixed(2)} m`}
                                </text>
                            );
                        })()}
                    </g>
                );
            })}
            <circle cx={c} cy={c} r={5} className="fill-media-fg/70" />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Coverage matrix — which sensor returns something useful in which band
// ─────────────────────────────────────────────────────────────────────────

export type Cell = 'full' | 'partial' | 'none';

export function CoverageMatrix({ bands, rows }: { bands: string[]; rows: { sensor: string; cells: Cell[] }[] }) {
    const mark: Record<Cell, { cls: string; glyph: string; label: string }> = {
        full: { cls: 'bg-live/25 text-live border-live/40', glyph: '●', label: 'usable' },
        partial: { cls: 'bg-warning/20 text-warning border-warning/40', glyph: '◐', label: 'degraded' },
        none: { cls: 'bg-overlay/5 text-textMuted border-border/50', glyph: '·', label: 'nothing' },
    };
    return (
        // `relative` is load-bearing: the sr-only <caption> is absolutely
        // positioned, and without a positioned ancestor its containing block
        // is the initial one — so it escapes this scroller's clip and sits at
        // its static position 520px in, dragging the document 125px wide at
        // 375. Making the scroller the containing block clips it again.
        <div className="relative overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
                <caption className="sr-only">Which sensor returns usable data in which range band</caption>
                <thead>
                    <tr>
                        <th scope="col" className="text-left text-meta font-mono uppercase tracking-widest text-textMuted pb-3 pr-4">Sensor</th>
                        {bands.map(b => (
                            <th key={b} scope="col" className="text-center text-meta font-mono uppercase tracking-widest text-textMuted pb-3 px-2">{b}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.sensor} className="border-t border-border/40">
                            <th scope="row" className="text-left text-body font-medium text-text py-3 pr-4 whitespace-nowrap">{r.sensor}</th>
                            {r.cells.map((cell, i) => (
                                <td key={i} className="text-center py-3 px-2">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-body ${mark[cell].cls}`}>
                                        <span aria-hidden="true">{mark[cell].glyph}</span>
                                        <span className="sr-only">{mark[cell].label}</span>
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Pipeline — a processing chain, left to right
// ─────────────────────────────────────────────────────────────────────────

export interface Stage { name: string; detail: string }

/**
 * Scrolls horizontally on a narrow screen rather than shrinking illegibly —
 * five boxes squeezed into 375px is four boxes of unreadable text.
 */
export function Pipeline({ stages }: { stages: Stage[] }) {
    const BOX_W = 156, BOX_H = 78, GAP = 30, PAD = 8;
    const W = PAD * 2 + stages.length * BOX_W + (stages.length - 1) * GAP;
    const H = 114;
    const top = 26;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
            aria-label={`Pipeline: ${stages.map(s => s.name).join(' then ')}`}>
            {stages.map((s, i) => {
                const x = PAD + i * (BOX_W + GAP);
                return (
                    <g key={s.name}>
                        <rect x={x} y={top} width={BOX_W} height={BOX_H} rx={8}
                            className="fill-media-fg/5 stroke-media-live/40" strokeWidth={1} />
                        <text x={x + BOX_W / 2} y={top + 24} textAnchor="middle"
                            className="fill-media-fg font-mono font-bold" fontSize={13}>{s.name}</text>
                        <foreignObject x={x + 6} y={top + 30} width={BOX_W - 12} height={BOX_H - 34}>
                            <div className="text-meta leading-tight text-center text-media-fg/60 font-mono">
                                {s.detail}
                            </div>
                        </foreignObject>
                        <text x={x + BOX_W / 2} y={top - 8} textAnchor="middle"
                            className="fill-media-live/50 font-mono" fontSize={12}>{i + 1}</text>
                        {i < stages.length - 1 && (
                            <g>
                                <line x1={x + BOX_W + 5} y1={top + BOX_H / 2} x2={x + BOX_W + GAP - 9}
                                    y2={top + BOX_H / 2} className="stroke-media-live/50" strokeWidth={1.5} />
                                <path d={`M ${x + BOX_W + GAP - 9} ${top + BOX_H / 2} l -6 -4 v 8 z`}
                                    className="fill-media-live/50" />
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Sparkline — a bench-run trace
// ─────────────────────────────────────────────────────────────────────────

export function Sparkline({ values, unit, band }: { values: number[]; unit: string; band?: [number, number] }) {
    const W = 640, H = 138, PAD_L = 52, PAD_R = 10, PAD_T = 12, PAD_B = 22;
    const lo = Math.min(...values, band ? band[0] : Infinity);
    const hi = Math.max(...values, band ? band[1] : -Infinity);
    const span = hi - lo || 1;
    const x = (i: number) => PAD_L + (i / (values.length - 1)) * (W - PAD_L - PAD_R);
    const y = (v: number) => PAD_T + (1 - (v - lo) / span) * (H - PAD_T - PAD_B);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`Trace of ${values.length} samples, ${lo.toFixed(2)} to ${hi.toFixed(2)} ${unit}`}>
            {band && (
                <rect x={PAD_L} y={y(band[1])} width={W - PAD_L - PAD_R} height={Math.abs(y(band[0]) - y(band[1]))}
                    className="fill-media-live/10" />
            )}
            {[lo, (lo + hi) / 2, hi].map((v, i) => (
                <g key={i}>
                    <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)} className="stroke-media-fg/10" strokeWidth={1} />
                    <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end" className="fill-media-fg/50 font-mono" fontSize={12}>
                        {v.toFixed(2)}
                    </text>
                </g>
            ))}
            <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                className="fill-none stroke-media-live" strokeWidth={1.5} strokeLinejoin="round" />
            <text x={W - PAD_R} y={H - 6} textAnchor="end" className="fill-media-fg/40 font-mono" fontSize={12}>{unit}</text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Curve — a probability density, EVALUATED not traced
// ─────────────────────────────────────────────────────────────────────────

export interface Marker { x: number; label: string; dashed?: boolean }

/**
 * Samples the real density function. A hand-traced bell curve puts its
 * inflection points in the wrong place and its tails too fat — exactly the
 * region a distribution page exists to discuss.
 */
export function Curve({ pdf, domain, markers = [], samples = 240 }:
    { pdf: (x: number) => number; domain: [number, number]; markers?: Marker[]; samples?: number }) {
    const W = 640, H = 248, PAD_L = 56, PAD_R = 16, PAD_T = 20, PAD_B = 34;
    const [a, b] = domain;
    const pts: [number, number][] = [];
    for (let i = 0; i < samples; i++) {
        const xv = a + (i / (samples - 1)) * (b - a);
        pts.push([xv, pdf(xv)]);
    }
    const peak = Math.max(...pts.map(p => p[1])) || 1;
    const X = (v: number) => PAD_L + ((v - a) / (b - a)) * (W - PAD_L - PAD_R);
    const Y = (v: number) => PAD_T + (1 - v / (peak * 1.08)) * (H - PAD_T - PAD_B);

    const line = pts.map(([xv, yv], i) => `${i ? 'L' : 'M'} ${X(xv)} ${Y(yv)}`).join(' ');
    const area = `${line} L ${X(b)} ${Y(0)} L ${X(a)} ${Y(0)} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`Probability density over ${a} to ${b}, peak ${peak.toFixed(3)}`}>
            {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={PAD_L} y1={Y(peak * f)} x2={W - PAD_R} y2={Y(peak * f)}
                    className="stroke-media-fg/10" strokeWidth={1} />
            ))}
            <path d={area} className="fill-media-live/15" />
            <path d={line} className="fill-none stroke-media-live" strokeWidth={2} />

            {markers.map(m => (
                <g key={m.label}>
                    <line x1={X(m.x)} y1={PAD_T} x2={X(m.x)} y2={Y(0)}
                        className="stroke-media-stream" strokeWidth={1} strokeDasharray="4 3" />
                    <text x={X(m.x)} y={PAD_T - 3} textAnchor="middle"
                        className="fill-media-stream font-mono" fontSize={12}>{m.label}</text>
                </g>
            ))}

            <line x1={PAD_L} y1={Y(0)} x2={W - PAD_R} y2={Y(0)} className="stroke-media-fg/40" strokeWidth={1} />
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={Y(0)} className="stroke-media-fg/40" strokeWidth={1} />
            <text x={PAD_L} y={H - 8} className="fill-media-fg/50 font-mono" fontSize={12}>{a}</text>
            <text x={W - PAD_R} y={H - 8} textAnchor="end" className="fill-media-fg/50 font-mono" fontSize={12}>{b}</text>
            <text x={PAD_L - 6} y={Y(peak) + 3} textAnchor="end" className="fill-media-fg/50 font-mono" fontSize={12}>
                {peak.toFixed(2)}
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Gated architecture — what a model may call, and what sits below it
// ─────────────────────────────────────────────────────────────────────────

export function GatedArchitecture({ chain, floor }: { chain: string[]; floor: string }) {
    const BOX_W = 150, BOX_H = 60, GAP = 32, PAD = 8;
    const W = PAD * 2 + chain.length * BOX_W + (chain.length - 1) * GAP;
    const H = 204;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
            aria-label={`${chain.join(' calls ')}, with ${floor} underneath and unreachable`}>
            {chain.map((name, i) => {
                const x = PAD + i * (BOX_W + GAP);
                const gate = name.toLowerCase().includes('gate');
                return (
                    <g key={name}>
                        <rect x={x} y={20} width={BOX_W} height={BOX_H} rx={8}
                            className={gate ? 'fill-warning/15 stroke-warning' : 'fill-media-fg/5 stroke-media-live/40'}
                            strokeWidth={gate ? 1.5 : 1} />
                        <foreignObject x={x + 6} y={26} width={BOX_W - 12} height={BOX_H - 12}>
                            <div className={`text-meta leading-tight text-center font-mono font-bold ${gate ? 'text-warning' : 'text-media-fg'}`}>
                                {name}
                            </div>
                        </foreignObject>
                        {i < chain.length - 1 && (
                            <g>
                                <line x1={x + BOX_W + 4} y1={46} x2={x + BOX_W + GAP - 8} y2={46}
                                    className="stroke-media-live/50" strokeWidth={1.5} />
                                <path d={`M ${x + BOX_W + GAP - 8} 46 l -6 -4 v 8 z`} className="fill-media-live/50" />
                            </g>
                        )}
                    </g>
                );
            })}

            <text x={W / 2} y={12} textAnchor="middle" className="fill-media-fg/45 font-mono" fontSize={12}>
                every arrow above can fail
            </text>

            <rect x={PAD} y={100} width={W - PAD * 2} height={56} rx={8}
                className="fill-fault/10 stroke-fault" strokeWidth={1.5} strokeDasharray="6 3" />
            <text x={W / 2} y={124} textAnchor="middle" className="fill-fault font-mono font-bold" fontSize={12}>{floor}</text>
            <text x={W / 2} y={145} textAnchor="middle" className="fill-fault/70 font-mono" fontSize={12}>
                below the model · not reachable by any tool call
            </text>
            <text x={W / 2} y={177} textAnchor="middle" className="fill-media-fg/45 font-mono" fontSize={12}>
                the band below must not
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Depth grid — a coarse depth image as a heatmap
// ─────────────────────────────────────────────────────────────────────────

/**
 * Near reads bright, far reads dim. Deliberately not a rainbow ramp: a
 * single-hue scale keeps "closer" monotonic to the eye, where a spectral one
 * makes the reader translate colour to distance through a legend.
 */
export function DepthGrid({ grid, nearM, farM }: { grid: number[][]; nearM: number; farM: number }) {
    const rows = grid.length, cols = grid[0]?.length ?? 0;
    const CELL = 26, PAD = 2;
    const W = cols * CELL, H = rows * CELL;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mx-auto block" role="img"
            aria-label={`Depth image, ${cols} by ${rows} cells, ${nearM} to ${farM} metres`}>
            {grid.map((row, r) => row.map((d, c) => {
                const t = Math.min(1, Math.max(0, (d - nearM) / (farM - nearM)));
                const opacity = +(0.92 - t * 0.78).toFixed(3);   // near = opaque
                return (
                    <rect key={`${r}-${c}`} x={c * CELL + PAD} y={r * CELL + PAD}
                        width={CELL - PAD * 2} height={CELL - PAD * 2} rx={3}
                        className="fill-media-live" opacity={opacity}>
                        <title>{`${d.toFixed(2)} m`}</title>
                    </rect>
                );
            }))}
        </svg>
    );
}
