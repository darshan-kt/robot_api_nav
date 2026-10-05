/**
 * Figure primitives for the Motion kit pages.
 *
 * Same contract as Viz.tsx — hand-authored inline SVG on the media tokens,
 * every coordinate a pure function of the props, no random() anywhere. Kept in
 * its own file for the reason LabViews and LabLoops are: these six are only
 * ever used by three pages, and Viz.tsx is already the shared surface four
 * sensor pages import.
 *
 * Nothing here invents a number. Curves are drawn by SAMPLING the model in
 * lib/liveFrames.ts, so a figure and the live panel beside it cannot disagree
 * about where the deadband is.
 */

/**
 * One square wave, as an SVG path.
 *
 * Shared by both encoder figures because they got it wrong in the same two
 * ways independently: clamping off-screen transitions to the left edge piles
 * several of them on one x (a spike), and closing the path at a fixed level
 * draws a diagonal whenever the wave ends on the other one. Both ends are
 * evaluated here instead, so the path always starts and finishes at the level
 * the wave is actually at.
 *
 * `phase` is in cycles and scrolls the wave left; `shift` offsets one channel
 * against the other (0.25 is the quadrature quarter-period).
 */
function squareWave(
    x0: number, x1: number, yHigh: number, yLow: number,
    period: number, phase = 0, shift = 0,
): string {
    const u = (x: number) => (x - x0) / period + phase - shift;
    const levelY = (x: number) => ((((u(x) % 1) + 1) % 1) < 0.5 ? yHigh : yLow);

    const d = [`M ${x0} ${levelY(x0)}`];
    for (let k = Math.floor(2 * (phase - shift)) + 1; ; k++) {
        const x = x0 + (k / 2 - phase + shift) * period;
        if (x > x1) break;
        if (x <= x0) continue;
        const after = k % 2 === 0 ? yHigh : yLow;          // even index -> rising
        const before = after === yHigh ? yLow : yHigh;
        d.push(`L ${+x.toFixed(2)} ${before}`, `L ${+x.toFixed(2)} ${after}`);
    }
    d.push(`L ${x1} ${levelY(x1)}`);
    return d.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────
// Duty response — what a duty cycle actually buys you, per floor
// ─────────────────────────────────────────────────────────────────────────

export interface DutyCurve {
    label: string;
    /** Sampled, not traced: the page passes rpmForDuty bound to a floor. */
    rpm: (duty: number) => number;
    deadband: number;
    tone: 'live' | 'stream';
}

export function DutyResponse({ curves, topRpm }: { curves: DutyCurve[]; topRpm: number }) {
    const W = 640, H = 322, PAD_L = 62, PAD_R = 24, PAD_T = 22, PAD_B = 80;
    const yMax = Math.ceil((topRpm * 1.08) / 20) * 20;
    const X = (d: number) => PAD_L + d * (W - PAD_L - PAD_R);
    const Y = (r: number) => PAD_T + (1 - r / yMax) * (H - PAD_T - PAD_B);

    const line = (fn: (d: number) => number) =>
        Array.from({ length: 101 }, (_, i) => `${i ? 'L' : 'M'} ${X(i / 100)} ${Y(fn(i / 100))}`).join(' ');

    const stroke = { live: 'stroke-media-live', stream: 'stroke-media-stream' };
    const fill = { live: 'fill-media-live', stream: 'fill-media-stream' };

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`Output speed against duty cycle. ${curves.map(c =>
                `${c.label}: nothing turns below ${Math.round(c.deadband * 100)} percent duty, reaching ${Math.round(c.rpm(1))} rpm at full duty`
            ).join('. ')}`}>

            {/* the deadband of the best case — the band where current flows and nothing moves */}
            <rect x={X(0)} y={Y(yMax)} width={X(curves[0].deadband) - X(0)} height={Y(0) - Y(yMax)}
                className="fill-media-fault/15" />
            <text x={X(curves[0].deadband / 2)} y={Y(yMax) + 16} textAnchor="middle"
                className="fill-media-fault font-mono" fontSize={12}>dead</text>

            {[0, 0.25, 0.5, 0.75, 1].map(f => (
                <g key={f}>
                    <line x1={X(0)} y1={Y(yMax * f)} x2={X(1)} y2={Y(yMax * f)} className="stroke-media-fg/10" strokeWidth={1} />
                    <text x={PAD_L - 8} y={Y(yMax * f) + 4} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>
                        {Math.round(yMax * f)}
                    </text>
                </g>
            ))}

            {/* what duty looks like it does: a straight proportional line */}
            <path d={`M ${X(0)} ${Y(0)} L ${X(1)} ${Y(topRpm)}`}
                className="fill-none stroke-media-fg/35" strokeWidth={1.5} strokeDasharray="6 5" />

            {curves.map(c => (
                <g key={c.label}>
                    <path d={line(c.rpm)} className={`fill-none ${stroke[c.tone]}`} strokeWidth={2.5} />
                    <line x1={X(c.deadband)} y1={Y(0)} x2={X(c.deadband)} y2={Y(yMax * 0.86)}
                        className={`${stroke[c.tone]} opacity-50`} strokeWidth={1} strokeDasharray="4 4" />
                    <text x={X(c.deadband) + 5} y={Y(yMax * 0.86) - 4} className={`${fill[c.tone]} font-mono`} fontSize={12}>
                        {Math.round(c.deadband * 100)}%
                    </text>
                </g>
            ))}

            {/* axes */}
            <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} className="stroke-media-fg/40" strokeWidth={1} />
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(d => (
                <text key={d} x={X(d)} y={Y(0) + 18} textAnchor="middle" className="fill-media-fg/55 font-mono" fontSize={12}>
                    {Math.round(d * 100)}
                </text>
            ))}
            <text x={X(0.5)} y={Y(0) + 36} textAnchor="middle" className="fill-media-fg/60 font-mono" fontSize={12}>
                PWM duty cycle, %
            </text>
            <text x={PAD_L - 8} y={PAD_T - 8} textAnchor="end" className="fill-media-fg/60 font-mono" fontSize={12}>rpm</text>

            {/* Legend on its own row below the axis title. Inline labels on the
                curves collided with them at every duty worth labelling. */}
            {[...curves.map(c => ({ label: c.label, tone: c.tone, dash: false })),
              { label: 'what duty looks like it does', tone: 'muted' as const, dash: true }]
                .map((k, i, all) => {
                    const x = PAD_L + all.slice(0, i).reduce((n, q) => n + q.label.length * 7.3 + 34, 0);
                    return (
                        <g key={k.label} transform={`translate(${x} ${H - 14})`}>
                            <line x1={0} y1={-4} x2={18} y2={-4} strokeWidth={3}
                                strokeDasharray={k.dash ? '4 3' : undefined}
                                className={k.tone === 'muted' ? 'stroke-media-fg/40' : stroke[k.tone as 'live' | 'stream']} />
                            <text x={24} y={0} className="fill-media-fg/70 font-mono" fontSize={12}>{k.label}</text>
                        </g>
                    );
                })}
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Motor trace — the bench step test as three synchronised lanes
// ─────────────────────────────────────────────────────────────────────────

export interface TraceFrame { duty: number; rpm: number; amps: number; stalled: boolean }

/**
 * Duty, speed and current on one time axis, which is the only way the point
 * lands: in the second segment the top lane steps up, the bottom lane steps
 * up, and the middle lane does not move.
 */
export function MotorTrace({ frames, index }: { frames: TraceFrame[]; index: number }) {
    const W = 640, LANE = 74, PAD_L = 74, PAD_R = 78, PAD_T = 20, PAD_B = 34;
    const H = PAD_T + LANE * 3 + PAD_B;
    const n = frames.length;
    const X = (f: number) => PAD_L + (f / (n - 1)) * (W - PAD_L - PAD_R);

    const lanes = [
        { key: 'duty' as const, label: 'duty', unit: '%', max: 100, get: (f: TraceFrame) => f.duty * 100, dp: 0, tone: 'stream' },
        { key: 'rpm' as const, label: 'output', unit: 'rpm', max: 220, get: (f: TraceFrame) => f.rpm, dp: 0, tone: 'live' },
        { key: 'amps' as const, label: 'current', unit: 'A', max: 1.0, get: (f: TraceFrame) => f.amps, dp: 2, tone: 'warning' },
    ];
    const stroke: Record<string, string> = { stream: 'stroke-media-stream', live: 'stroke-media-live', warning: 'stroke-media-warn' };
    const fill: Record<string, string> = { stream: 'fill-media-stream', live: 'fill-media-live', warning: 'fill-media-warn' };

    // Contiguous stalled runs, shaded through every lane at once.
    const runs: [number, number][] = [];
    for (let f = 0; f < n; f++) {
        if (!frames[f].stalled) continue;
        const last = runs[runs.length - 1];
        if (last && last[1] === f - 1) last[1] = f; else runs.push([f, f]);
    }

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`Step test, frame ${index} of ${n}. Duty ${(frames[index].duty * 100).toFixed(0)} percent, ${frames[index].rpm} rpm, ${frames[index].amps.toFixed(2)} amps${frames[index].stalled ? ', drawing current while stalled' : ''}`}>

            {runs.map(([a, b]) => (
                <g key={a}>
                    <rect x={X(a)} y={PAD_T} width={Math.max(X(b) - X(a), 2)} height={LANE * 3} className="fill-media-fault/15" />
                    <text x={(X(a) + X(b)) / 2} y={PAD_T - 6} textAnchor="middle" className="fill-media-fault font-mono" fontSize={12}>
                        current, no rotation
                    </text>
                </g>
            ))}

            {lanes.map((ln, li) => {
                const top = PAD_T + li * LANE;
                const base = top + LANE - 16;
                const Y = (v: number) => base - (v / ln.max) * (LANE - 26);
                const now = ln.get(frames[index]);
                return (
                    <g key={ln.key}>
                        <line x1={PAD_L} y1={base} x2={W - PAD_R} y2={base} className="stroke-media-fg/20" strokeWidth={1} />
                        <text x={PAD_L - 10} y={top + 14} textAnchor="end" className="fill-media-fg/70 font-mono" fontSize={12}>{ln.label}</text>
                        <text x={PAD_L - 10} y={base + 4} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>0</text>
                        <polyline
                            points={frames.map((f, i) => `${X(i)},${Y(ln.get(f))}`).join(' ')}
                            className={`fill-none ${stroke[ln.tone]}`} strokeWidth={2} strokeLinejoin="round" />
                        <circle cx={X(index)} cy={Y(now)} r={4} className={fill[ln.tone]} />
                        <text x={W - PAD_R + 8} y={top + 14} className={`${fill[ln.tone]} font-mono`} fontSize={12}>
                            {now.toFixed(ln.dp)} {ln.unit}
                        </text>
                    </g>
                );
            })}

            <line x1={X(index)} y1={PAD_T} x2={X(index)} y2={PAD_T + LANE * 3} className="stroke-media-fg/45" strokeWidth={1} />
            <text x={PAD_L} y={H - 12} className="fill-media-fg/55 font-mono" fontSize={12}>frame 0</text>
            <text x={W - PAD_R} y={H - 12} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>{n - 1}</text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Open-loop drift — the straight-line test, drawn from the kinematics
// ─────────────────────────────────────────────────────────────────────────

/**
 * Both wheels commanded the same speed; one motor is faster; the result is an
 * arc. The arc is INTEGRATED from the differential-drive kinematics rather
 * than drawn by hand, because the whole claim of the figure is the size of the
 * error after three metres.
 */
export function OpenLoopDrift({ vL, vR, trackM, arcLenM }:
    { vL: number; vR: number; trackM: number; arcLenM: number }) {
    const W = 640, H = 330, OX = 74, OY = H - 72;
    const v = (vL + vR) / 2;
    const w = (vR - vL) / trackM;
    const k = w / v;                                  // signed curvature, 1/m
    const theta = k * arcLenM;
    const fwd = Math.sin(theta) / k;
    const lat = (1 - Math.cos(theta)) / k;

    const scale = Math.min((W - OX - 70) / Math.max(arcLenM, fwd), (OY - 48) / Math.max(Math.abs(lat), 0.4));
    const PX = (x: number) => OX + x * scale;
    const PY = (y: number) => OY - y * scale;

    const arc = Array.from({ length: 121 }, (_, i) => {
        const s = (i / 120) * arcLenM;
        return `${i ? 'L' : 'M'} ${PX(Math.sin(k * s) / k)} ${PY((1 - Math.cos(k * s)) / k)}`;
    }).join(' ');

    const degs = (theta * 180) / Math.PI;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`After ${arcLenM.toFixed(2)} metres of travel the robot is ${Math.abs(lat).toFixed(2)} metres to the side and rotated ${Math.abs(degs).toFixed(0)} degrees, with no wheel ever measured`}>

            {/* floor grid, one line per half metre */}
            {Array.from({ length: Math.ceil(arcLenM / 0.5) + 1 }, (_, i) => (
                <line key={i} x1={PX(i * 0.5)} y1={OY + 6} x2={PX(i * 0.5)} y2={PY(Math.abs(lat) + 0.25)}
                    className="stroke-media-fg/8" strokeWidth={1} />
            ))}

            {/* intended: straight, the same arc length */}
            <line x1={PX(0)} y1={PY(0)} x2={PX(arcLenM)} y2={PY(0)}
                className="stroke-media-fg/40" strokeWidth={2} strokeDasharray="8 6" />
            <text x={PX(arcLenM)} y={PY(0) + 20} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>
                intended — {arcLenM.toFixed(2)} m straight
            </text>

            {/* actual */}
            <path d={arc} className="fill-none stroke-media-fault" strokeWidth={2.5} />
            <circle cx={PX(0)} cy={PY(0)} r={6} className="fill-media-fg/60" />
            <text x={PX(0) - 6} y={PY(0) + 22} className="fill-media-fg/55 font-mono" fontSize={12}>start</text>

            {/* end pose, rotated by the integrated heading */}
            <g transform={`translate(${PX(fwd)} ${PY(lat)}) rotate(${-degs})`}>
                <rect x={-13} y={-10} width={26} height={20} rx={4} className="fill-media-fault" />
                <path d="M 13 0 L 5 -5 L 5 5 Z" className="fill-media-bg" />
            </g>

            {/* the measurement that makes the point */}
            <line x1={PX(fwd)} y1={PY(0)} x2={PX(fwd)} y2={PY(lat)} className="stroke-media-fault/70" strokeWidth={1} strokeDasharray="3 3" />
            <text x={PX(fwd) - 10} y={PY(lat / 2) + 4} textAnchor="end" className="fill-media-fault font-mono" fontSize={12}>
                {Math.abs(lat).toFixed(2)} m off
            </text>
            <text x={PX(fwd) + 24} y={PY(lat) - 14} className="fill-media-fault font-mono" fontSize={12}>
                {Math.abs(degs).toFixed(0)}° rotated
            </text>

            <text x={OX} y={24} className="fill-media-fg/70 font-mono" fontSize={12}>
                left {vL.toFixed(3)} m/s · right {vR.toFixed(3)} m/s · same commanded duty
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Differential view — two wheel speeds, and the one arc they imply
// ─────────────────────────────────────────────────────────────────────────

/**
 * The instantaneous centre of rotation is the whole idea of a differential
 * drive, so it is drawn as a point on the floor: equal wheels put it at
 * infinity, opposite wheels put it between the wheels, and everything else is
 * somewhere on that line.
 */
export function DifferentialView({ vL, vR, trackM, label }:
    { vL: number; vR: number; trackM: number; label: string }) {
    const W = 580, H = 262;
    const RX = 262, RY = 132, SCALE = 96, SPAN = 0.78;
    const v = (vL + vR) / 2;
    const w = (vR - vL) / trackM;
    const pivot = Math.abs(v) < 0.02 && Math.abs(w) > 0.02;
    const straight = Math.abs(w) < 0.02;
    const radius = straight ? Infinity : v / w;

    // Sample the arc, stopping at the frame edge rather than drawing outside it.
    // Stop short of a full revolution: on a tight arc 3.2 m of path closes the
    // circle, and a closed circle reads as an orbit rather than the way ahead.
    const sMax = straight ? 3.2 : Math.min(3.2, 0.78 * 2 * Math.PI * Math.abs(radius));
    const pts: string[] = [];
    if (!pivot) {
        for (let i = 0; i <= 140; i++) {
            const s = (i / 140) * sMax;
            const k = w / v;
            const x = Math.abs(k) < 1e-6 ? s : Math.sin(k * s) / k;
            const y = Math.abs(k) < 1e-6 ? 0 : (1 - Math.cos(k * s)) / k;
            const px = RX + x * SCALE, py = RY - y * SCALE;
            if (px > W - 14 || py < 20 || py > H - 40) break;
            pts.push(`${px},${py}`);
        }
    }

    const icrY = RY - (SCALE / (w / v));
    const icrVisible = !straight && !pivot && icrY > 22 && icrY < H - 34;

    const wheels = [
        { name: 'L', val: vL, y: 72 },
        { name: 'R', val: vR, y: 120 },
    ];
    const BAR_MID = 78, BAR_HALF = 46;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[620px] mx-auto block"
            style={{ minWidth: 380 }} role="img"
            aria-label={`${label}. Left wheel ${vL.toFixed(3)} metres per second, right wheel ${vR.toFixed(3)}, giving ${v.toFixed(3)} metres per second forward and ${w.toFixed(3)} radians per second of rotation${straight ? '' : `, a turn radius of ${Math.abs(radius).toFixed(2)} metres`}`}>
            <rect width={W} height={H} rx={8} className="fill-media-fg/5" />

            {/* ── wheel speeds, signed about a zero line ── */}
            <text x={18} y={44} className="fill-media-fg/70 font-mono" fontSize={12}>wheel m/s</text>
            <line x1={BAR_MID} y1={56} x2={BAR_MID} y2={140} className="stroke-media-fg/30" strokeWidth={1} />
            {wheels.map(wh => {
                const px = (wh.val / SPAN) * BAR_HALF;
                return (
                    <g key={wh.name}>
                        <text x={20} y={wh.y + 12} className="fill-media-fg/60 font-mono" fontSize={12}>{wh.name}</text>
                        <rect x={px >= 0 ? BAR_MID : BAR_MID + px} y={wh.y} width={Math.max(Math.abs(px), 1.5)} height={17} rx={2}
                            className={wh.val === 0 ? 'fill-media-fg/25' : px < 0 ? 'fill-media-warn/80' : 'fill-media-live/80'} />
                        <text x={BAR_MID + BAR_HALF + 8} y={wh.y + 13} className="fill-media-fg font-mono" fontSize={12}>
                            {wh.val >= 0 ? '+' : ''}{wh.val.toFixed(3)}
                        </text>
                    </g>
                );
            })}
            <line x1={186} y1={30} x2={186} y2={H - 24} className="stroke-media-fg/15" strokeWidth={1} />

            {/* ── the floor ── */}
            <line x1={RX} y1={RY} x2={W - 16} y2={RY} className="stroke-media-fg/12" strokeWidth={1} strokeDasharray="3 5" />

            {pts.length > 1 && (
                <polyline points={pts.join(' ')} className="fill-none stroke-media-live" strokeWidth={2.5} />
            )}

            {pivot && (
                <path d={`M ${RX + 34} ${RY - 20} A 40 40 0 1 ${w > 0 ? 0 : 1} ${RX + 34} ${RY + 20}`}
                    className="fill-none stroke-media-live" strokeWidth={2.5} markerEnd="" />
            )}

            {icrVisible && (
                <g>
                    <line x1={RX} y1={RY} x2={RX} y2={icrY} className="stroke-media-stream/60" strokeWidth={1} strokeDasharray="4 4" />
                    <circle cx={RX} cy={icrY} r={5} className="fill-media-stream" />
                    <text x={RX + 10} y={icrY + 4} className="fill-media-stream font-mono" fontSize={12}>
                        ICR · {Math.abs(radius).toFixed(2)} m
                    </text>
                </g>
            )}

            {/* robot: chassis across the track, a wheel at each end */}
            <g transform={`translate(${RX} ${RY})`}>
                <rect x={-8} y={-13} width={16} height={26} rx={3} className="fill-media-fg/25 stroke-media-fg/50" strokeWidth={1} />
                <rect x={-5} y={-17} width={10} height={5} rx={1.5} className={vL === 0 ? 'fill-media-fg/40' : 'fill-media-live'} />
                <rect x={-5} y={12} width={10} height={5} rx={1.5} className={vR === 0 ? 'fill-media-fg/40' : 'fill-media-live'} />
                <path d="M 15 0 L 8 -4.5 L 8 4.5 Z" className="fill-media-live" />
            </g>

            <text x={200} y={44} className="fill-media-live font-mono" fontSize={12}>{label}</text>
            <text x={200} y={H - 22} className="fill-media-fg/60 font-mono" fontSize={12}>
                v {v >= 0 ? '+' : ''}{v.toFixed(3)} m/s · ω {w >= 0 ? '+' : ''}{w.toFixed(3)} rad/s
            </text>
            <text x={W - 16} y={H - 22} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>
                {straight ? 'ICR at infinity' : pivot ? 'ICR between the wheels' : icrVisible ? '' : 'ICR off view'}
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Quadrature — the two channels, and why there are four counts per cycle
// ─────────────────────────────────────────────────────────────────────────

/** A/B at 90°, the Gray-code states, and the count staircase they drive. */
export function QuadratureFigure({ cycles = 4 }: { cycles?: number }) {
    const W = 640, H = 310, PAD_L = 78, PAD_R = 26;
    const span = W - PAD_L - PAD_R;
    const P = span / cycles;
    const AY = 46, BY = 116, LANE = 34;
    const STAIR_TOP = 196, STAIR_H = 62;

    const wave = (y: number, shift: number) => squareWave(PAD_L, PAD_L + span, y, y + LANE, P, 0, shift);

    // One count per channel edge: four per electrical cycle.
    const edges: { x: number; state: string }[] = [];
    for (let c = 0; c < cycles; c++) {
        edges.push(
            { x: c * P + 0.00 * P, state: '10' },
            { x: c * P + 0.25 * P, state: '11' },
            { x: c * P + 0.50 * P, state: '01' },
            { x: c * P + 0.75 * P, state: '00' },
        );
    }

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: W }} role="img"
            aria-label={`Channels A and B ninety degrees apart. Each of the four edges per electrical cycle advances the count, so ${cycles} cycles produce ${cycles * 4} counts, and the order of the two-bit states is what gives direction`}>

            {edges.map(e => (
                <line key={e.x} x1={PAD_L + e.x} y1={AY - 10} x2={PAD_L + e.x} y2={STAIR_TOP + STAIR_H}
                    className="stroke-media-fg/12" strokeWidth={1} />
            ))}

            <text x={PAD_L - 12} y={AY + 20} textAnchor="end" className="fill-media-fg/70 font-mono" fontSize={12}>A</text>
            <path d={wave(AY, 0)} className="fill-none stroke-media-live" strokeWidth={2.5} strokeLinejoin="miter" />

            <text x={PAD_L - 12} y={BY + 20} textAnchor="end" className="fill-media-fg/70 font-mono" fontSize={12}>B</text>
            <path d={wave(BY, 0.25)} className="fill-none stroke-media-stream" strokeWidth={2.5} strokeLinejoin="miter" />

            {/* the quarter-period offset, measured on the figure */}
            <line x1={PAD_L} y1={BY + LANE + 16} x2={PAD_L + P * 0.25} y2={BY + LANE + 16}
                className="stroke-media-fg/50" strokeWidth={1} />
            <text x={PAD_L + P * 0.25 + 8} y={BY + LANE + 20} className="fill-media-fg/60 font-mono" fontSize={12}>
                90° — this offset is the direction
            </text>

            {/* states, in the order forward produces them */}
            {edges.map(e => (
                <text key={`s${e.x}`} x={PAD_L + e.x + 3} y={STAIR_TOP - 10}
                    className="fill-media-fg/50 font-mono" fontSize={12}>{e.state}</text>
            ))}

            {/* count staircase: +1 at every edge */}
            <polyline
                points={edges.map((e, i) =>
                    `${PAD_L + e.x},${STAIR_TOP + STAIR_H - (i / edges.length) * STAIR_H} ` +
                    `${PAD_L + (edges[i + 1]?.x ?? span)},${STAIR_TOP + STAIR_H - (i / edges.length) * STAIR_H}`
                ).join(' ')}
                className="fill-none stroke-media-live" strokeWidth={2} />
            <text x={PAD_L - 12} y={STAIR_TOP + 14} textAnchor="end" className="fill-media-fg/70 font-mono" fontSize={12}>count</text>
            <text x={PAD_L - 12} y={STAIR_TOP + STAIR_H + 4} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>0</text>
            <text x={PAD_L} y={H - 12} className="fill-media-fg/55 font-mono" fontSize={12}>
                {cycles} cycles · {cycles * 4} counts · reverse emits these states backwards
            </text>
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Encoder view — the loop closing, live
// ─────────────────────────────────────────────────────────────────────────

/**
 * Commanded against measured, with the duty the controller had to choose to
 * get there. When the floor changes under it, the top pair stays put and the
 * bottom bar moves — which is the difference between this page and the last.
 */
export function EncoderView({ phase, cmd, meas, duty, floor, countsPerPeriod, cyclesPerS }: {
    phase: number; cmd: number; meas: number; duty: number;
    floor: string; countsPerPeriod: number; cyclesPerS: number;
}) {
    const W = 580, H = 268, PAD_L = 76, PAD_R = 92;
    const span = W - PAD_L - PAD_R;
    const cycles = 4, P = span / cycles, LANE = 22;
    const AY = 38, BY = 78;
    const moving = meas > 0.004;

    const wave = (y: number, shift: number) => squareWave(PAD_L, PAD_L + span, y, y + LANE, P, phase, shift);

    const SPEED_MAX = 0.55;
    const bar = (v: number) => (v / SPEED_MAX) * span;
    const CMD_Y = 130, MEAS_Y = 158, DUTY_Y = 208;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[620px] mx-auto block"
            style={{ minWidth: 380 }} role="img"
            aria-label={`Commanded ${cmd.toFixed(2)} metres per second, measured ${meas.toFixed(3)} from the encoder, controller holding ${(duty * 100).toFixed(0)} percent duty on ${floor} floor, ${countsPerPeriod} counts per 20 millisecond period`}>
            <rect width={W} height={H} rx={8} className="fill-media-fg/5" />

            <text x={16} y={AY + 16} className="fill-media-fg/70 font-mono" fontSize={12}>A</text>
            <path d={wave(AY, 0)} className="fill-none stroke-media-live" strokeWidth={2} strokeLinejoin="miter" />
            <text x={16} y={BY + 16} className="fill-media-fg/70 font-mono" fontSize={12}>B</text>
            <path d={wave(BY, 0.25)} className="fill-none stroke-media-stream" strokeWidth={2} strokeLinejoin="miter" />
            <text x={W - PAD_R + 8} y={AY + 16} className="fill-media-fg/55 font-mono" fontSize={12}>
                {moving ? `${cyclesPerS}/s` : 'stopped'}
            </text>
            <text x={W - PAD_R + 8} y={BY + 16} className="fill-media-fg/55 font-mono" fontSize={12}>
                {countsPerPeriod}/20ms
            </text>

            <line x1={PAD_L} y1={104} x2={W - PAD_R} y2={104} className="stroke-media-fg/15" strokeWidth={1} />

            {/* commanded, as an outline — it is a request, not a measurement */}
            <text x={16} y={CMD_Y + 14} className="fill-media-fg/70 font-mono" fontSize={12}>cmd</text>
            <rect x={PAD_L} y={CMD_Y} width={Math.max(bar(cmd), 1)} height={18} rx={2}
                className="fill-none stroke-media-stream" strokeWidth={2} strokeDasharray="5 3" />
            <text x={W - PAD_R + 8} y={CMD_Y + 14} className="fill-media-stream font-mono" fontSize={12}>
                {cmd.toFixed(2)} m/s
            </text>

            {/* measured, filled — this one is a fact */}
            <text x={16} y={MEAS_Y + 14} className="fill-media-fg/70 font-mono" fontSize={12}>meas</text>
            <rect x={PAD_L} y={MEAS_Y} width={Math.max(bar(meas), 1)} height={18} rx={2} className="fill-media-live/80" />
            <text x={W - PAD_R + 8} y={MEAS_Y + 14} className="fill-media-live font-mono" fontSize={12}>
                {meas.toFixed(3)} m/s
            </text>

            {/* duty: the price of holding that speed on this floor */}
            <text x={16} y={DUTY_Y + 14} className="fill-media-fg/70 font-mono" fontSize={12}>duty</text>
            <rect x={PAD_L} y={DUTY_Y} width={span} height={18} rx={2} className="fill-media-fg/10" />
            <rect x={PAD_L} y={DUTY_Y} width={Math.max(duty * span, 1)} height={18} rx={2} className="fill-media-warn/80" />
            <text x={W - PAD_R + 8} y={DUTY_Y + 14} className="fill-media-warn font-mono" fontSize={12}>
                {(duty * 100).toFixed(0)}%
            </text>

            <text x={PAD_L} y={H - 12} className="fill-media-fg/55 font-mono" fontSize={12}>
                {floor} floor
            </text>
            <text x={W - PAD_R} y={H - 12} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>
                time axis not to scale
            </text>
        </svg>
    );
}
