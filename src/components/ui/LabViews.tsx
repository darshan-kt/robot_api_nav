/**
 * The live data windows on the project pages.
 *
 * Each one shows what that behaviour is actually looking at — the camera
 * crop, the tracked blob, the standoff, the route — rather than a generic
 * chart. Frames arrive from the pure generators in lib/liveFrames.ts, so
 * these are stateless and stay screenshot-stable when paused.
 */

const W = 520, H = 240;

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[560px] mx-auto block"
            style={{ minWidth: 340 }} role="img" aria-label={label}>
            <rect width={W} height={H} rx={8} className="fill-media-fg/5" />
            {children}
        </svg>
    );
}

/** Line follower: the cropped camera strip, the line, and the steer command. */
export function LineView({ centroidX, errMm, locked }: { centroidX: number; errMm: number; locked: boolean }) {
    const cropTop = 96, cropH = 96;
    const cx = 40 + centroidX * (W - 80);

    return (
        <Frame label={`Camera crop with the line centroid at ${(centroidX * 100).toFixed(0)} percent across, cross-track error ${errMm} millimetres`}>
            {/* what the camera sees above the crop — discarded */}
            <rect x={0} y={0} width={W} height={cropTop} className="fill-media-bg/60" />
            <text x={W / 2} y={52} textAnchor="middle" className="fill-media-fg/35 font-mono" fontSize={12}>
                ignored — crop discards the top 75%
            </text>

            {/* the crop window */}
            <rect x={0} y={cropTop} width={W} height={cropH} className="fill-none stroke-media-live/50" strokeWidth={2} strokeDasharray="8 5" />
            {/* the tape, thresholded */}
            <rect x={cx - 26} y={cropTop} width={52} height={cropH} className="fill-media-fg/70" />
            {/* frame centre vs centroid */}
            <line x1={W / 2} y1={cropTop} x2={W / 2} y2={cropTop + cropH} className="stroke-media-fg/30" strokeWidth={1} strokeDasharray="4 4" />
            <line x1={cx} y1={cropTop} x2={cx} y2={cropTop + cropH}
                className={locked ? 'stroke-media-live' : 'stroke-fault'} strokeWidth={3} />
            <circle cx={cx} cy={cropTop + cropH / 2} r={6}
                className={locked ? 'fill-media-live' : 'fill-fault'} />

            <text x={12} y={cropTop + cropH + 22} className="fill-media-fg/60 font-mono" fontSize={12}>crop window</text>
            <text x={W - 12} y={cropTop + cropH + 22} textAnchor="end"
                className={locked ? 'fill-media-live font-mono' : 'fill-fault font-mono'} fontSize={12}>
                {locked ? `error ${errMm > 0 ? '+' : ''}${errMm} mm` : 'line lost — stop'}
            </text>
        </Frame>
    );
}

/** Object tracker: the frame, the blob, its box, and the bearing. */
export function TrackView({ objectX, bearingDeg, areaPx, locked }: { objectX: number; bearingDeg: number; areaPx: number; locked: boolean }) {
    const cx = 40 + objectX * (W - 80);
    const r = Math.max(14, Math.sqrt(areaPx) / 9);

    return (
        <Frame label={`Camera frame with the target at bearing ${bearingDeg} degrees, contour area ${areaPx} pixels`}>
            <line x1={W / 2} y1={20} x2={W / 2} y2={H - 40} className="stroke-media-fg/25" strokeWidth={1} strokeDasharray="4 4" />
            <circle cx={cx} cy={H / 2 - 10} r={r} className="fill-media-stream" />
            <rect x={cx - r - 8} y={H / 2 - 10 - r - 8} width={(r + 8) * 2} height={(r + 8) * 2} rx={4}
                className={locked ? 'fill-none stroke-media-live' : 'fill-none stroke-fault'} strokeWidth={2} />
            {/* bearing arrow from frame centre to the target */}
            <line x1={W / 2} y1={H - 44} x2={cx} y2={H - 44}
                className={locked ? 'stroke-media-live' : 'stroke-fault'} strokeWidth={3} />
            <text x={12} y={H - 14} className="fill-media-fg/60 font-mono" fontSize={12}>
                area {areaPx.toLocaleString()} px
            </text>
            <text x={W - 12} y={H - 14} textAnchor="end"
                className={locked ? 'fill-media-live font-mono' : 'fill-fault font-mono'} fontSize={12}>
                bearing {bearingDeg > 0 ? '+' : ''}{bearingDeg}°
            </text>
        </Frame>
    );
}

/** Human follower: a standoff gauge with the deadband drawn on it. */
export function StandoffView({ standoffM, inDeadband }: { standoffM: number; inDeadband: boolean }) {
    const min = 0.8, max = 2.2;
    const x = (m: number) => 40 + ((m - min) / (max - min)) * (W - 80);
    const y = 120;

    return (
        <Frame label={`Standoff ${standoffM} metres, target 1.40 metres, ${inDeadband ? 'inside' : 'outside'} the deadband`}>
            {/* deadband */}
            <rect x={x(1.25)} y={y - 26} width={x(1.55) - x(1.25)} height={52} rx={6} className="fill-media-live/15" />
            <line x1={x(1.4)} y1={y - 34} x2={x(1.4)} y2={y + 34} className="stroke-media-live/70" strokeWidth={2} strokeDasharray="5 4" />
            <text x={x(1.4)} y={y - 42} textAnchor="middle" className="fill-media-live font-mono" fontSize={12}>1.40 m target</text>

            {/* the rail */}
            <line x1={40} y1={y} x2={W - 40} y2={y} className="stroke-media-fg/30" strokeWidth={2} />
            {[0.8, 1.2, 1.6, 2.0].map(m => (
                <text key={m} x={x(m)} y={y + 44} textAnchor="middle" className="fill-media-fg/45 font-mono" fontSize={12}>{m}</text>
            ))}

            {/* robot at the current standoff */}
            <circle cx={x(standoffM)} cy={y} r={12}
                className={inDeadband ? 'fill-media-live' : 'fill-warning'} />
            <circle cx={x(standoffM)} cy={y} r={12} className="fill-none stroke-media-bg" strokeWidth={2} />

            <text x={12} y={H - 14} className="fill-media-fg/60 font-mono" fontSize={12}>metres to target</text>
            <text x={W - 12} y={H - 14} textAnchor="end"
                className={inDeadband ? 'fill-media-live font-mono' : 'fill-warning font-mono'} fontSize={12}>
                {inDeadband ? 'holding — no command' : `closing ${standoffM.toFixed(2)} m`}
            </text>
        </Frame>
    );
}

/** Patrol: the route with the active waypoint and progress along the leg. */
export function RouteView({ waypoint, stops, progress, lap }: { waypoint: number; stops: number; progress: number; lap: number }) {
    const pts: [number, number][] = [[80, 70], [260, 70], [440, 70], [440, 170], [260, 170], [80, 170]];
    const a = pts[(waypoint - 1) % stops];
    const bNext = pts[waypoint % stops];
    const rx = a[0] + (bNext[0] - a[0]) * progress;
    const ry = a[1] + (bNext[1] - a[1]) * progress;

    return (
        <Frame label={`Patrol route, heading to waypoint ${waypoint} of ${stops}, lap ${lap}`}>
            <path d="M 80 70 L 440 70 L 440 170 L 80 170 Z" className="fill-none stroke-media-fg/30" strokeWidth={2} strokeDasharray="8 6" />
            {pts.map(([px, py], i) => {
                const done = i + 1 < waypoint;
                const active = i + 1 === waypoint;
                return (
                    <g key={i}>
                        <circle cx={px} cy={py} r={active ? 9 : 5}
                            className={active ? 'fill-media-live' : done ? 'fill-media-live/45' : 'fill-media-fg/25'} />
                        <text x={px} y={py - 16} textAnchor="middle"
                            className={active ? 'fill-media-live font-mono' : 'fill-media-fg/45 font-mono'} fontSize={12}>
                            {i + 1}
                        </text>
                    </g>
                );
            })}
            <circle cx={rx} cy={ry} r={11} className="fill-media-live" />
            <circle cx={rx} cy={ry} r={11} className="fill-none stroke-media-bg" strokeWidth={2} />

            <text x={12} y={H - 14} className="fill-media-fg/60 font-mono" fontSize={12}>lap {lap}</text>
            <text x={W - 12} y={H - 14} textAnchor="end" className="fill-media-live font-mono" fontSize={12}>
                waypoint {waypoint} / {stops}
            </text>
        </Frame>
    );
}

/**
 * Histogram of real samples with the theoretical density drawn over it.
 *
 * Bars are normalised to a density so both share one y axis — the teaching
 * point is that the bars converge onto the curve as n grows, and that only
 * reads if they are directly comparable rather than two scales side by side.
 */
export function HistogramView({
    bars, domain, pdf, markers = [], unit,
}: {
    bars: number[];
    domain: [number, number];
    pdf: (x: number) => number;
    markers?: { x: number; label: string }[];
    unit: string;
}) {
    const PAD_L = 52, PAD_R = 16, PAD_T = 22, PAD_B = 40;
    const [lo, hi] = domain;
    const curve = Array.from({ length: 200 }, (_, i) => {
        const x = lo + (i / 199) * (hi - lo);
        return [x, pdf(x)] as [number, number];
    });
    const peak = Math.max(...bars, ...curve.map(c => c[1]), 1e-6) * 1.12;

    const X = (v: number) => PAD_L + ((v - lo) / (hi - lo)) * (W - PAD_L - PAD_R);
    const Y = (v: number) => PAD_T + (1 - v / peak) * (H - PAD_T - PAD_B);
    const bw = (W - PAD_L - PAD_R) / bars.length;

    return (
        <Frame label={`Histogram of samples against the theoretical density, ${lo} to ${hi} ${unit}`}>
            {[0.5, 1].map(f => (
                <line key={f} x1={PAD_L} y1={Y(peak * f)} x2={W - PAD_R} y2={Y(peak * f)}
                    className="stroke-media-fg/10" strokeWidth={1} />
            ))}

            {bars.map((d, i) => (
                <rect key={i} x={PAD_L + i * bw + 1} y={Y(d)} width={Math.max(bw - 2, 1)}
                    height={Math.max(Y(0) - Y(d), 0)} className="fill-media-live/45" />
            ))}

            <path d={curve.map(([x, y], i) => `${i ? 'L' : 'M'} ${X(x)} ${Y(y)}`).join(' ')}
                className="fill-none stroke-media-stream" strokeWidth={2.5} />

            {markers.map(m => (
                <g key={m.label}>
                    <line x1={X(m.x)} y1={PAD_T} x2={X(m.x)} y2={Y(0)}
                        className="stroke-media-fg/45" strokeWidth={1} strokeDasharray="4 3" />
                    <text x={X(m.x)} y={PAD_T - 6} textAnchor="middle"
                        className="fill-media-fg/70 font-mono" fontSize={12}>{m.label}</text>
                </g>
            ))}

            <line x1={PAD_L} y1={Y(0)} x2={W - PAD_R} y2={Y(0)} className="stroke-media-fg/40" strokeWidth={1} />
            <text x={PAD_L} y={H - 14} className="fill-media-fg/55 font-mono" fontSize={12}>{lo}</text>
            <text x={W - PAD_R} y={H - 14} textAnchor="end" className="fill-media-fg/55 font-mono" fontSize={12}>
                {hi} {unit}
            </text>
            <text x={W / 2} y={H - 14} textAnchor="middle" className="fill-media-stream font-mono" fontSize={12}>
                theoretical density
            </text>
        </Frame>
    );
}
