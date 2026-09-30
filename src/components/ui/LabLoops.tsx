import type { CSSProperties } from 'react';

/**
 * Looping "robot in action" scenes for the project pages.
 *
 * These are the animated illustrations — built as CSS-animated SVG rather
 * than .gif files, for three reasons that matter here: a gif cannot follow
 * the theme (it would stay dark on a light canvas), cannot be frozen for
 * `prefers-reduced-motion`, and costs hundreds of KB for something that is
 * a few hundred bytes of markup. The global reduced-motion guard in
 * index.css freezes all of them for free.
 *
 * Every scene is a top-down view of the lab floor, drawn to the same
 * conventions: the robot is a filled dot with a heading notch, a dashed
 * outline is the planned path, and live is the accent colour.
 */

const box = 'w-full h-auto max-w-[560px] mx-auto block';

function Floor({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <svg viewBox="0 0 560 240" className={box} role="img" aria-label={label}>
            <defs>
                <pattern id="lab-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 28 0 L 0 0 0 28" className="fill-none stroke-media-fg/8" strokeWidth={1} />
                </pattern>
            </defs>
            <rect width="560" height="240" fill="url(#lab-grid)" />
            {children}
        </svg>
    );
}

/** Robot glyph: body + heading notch, sized for a 560x240 floor. */
function Robot({ className = '', style }: { className?: string; style?: CSSProperties }) {
    return (
        <g className={className} style={style}>
            <circle r={11} className="fill-media-live" />
            <circle r={11} className="fill-none stroke-media-bg" strokeWidth={2} />
            <path d="M 4 0 L -3 -4 L -3 4 Z" className="fill-media-bg" />
        </g>
    );
}

// ── 1. Line following ────────────────────────────────────────────────────

const TAPE = 'M 40 190 C 150 190, 150 60, 260 60 S 400 190, 520 150';

export function LineFollowingLoop() {
    return (
        <Floor label="Top-down view: the robot drives a curved taped route, keeping its camera crop over the line">
            <path d={TAPE} className="fill-none stroke-media-fg/25" strokeWidth={16} strokeLinecap="round" />
            <path d={TAPE} className="fill-none stroke-media-fg/70" strokeWidth={3} strokeDasharray="10 8" strokeLinecap="round" />
            <Robot className="lab-path" style={{ offsetPath: `path('${TAPE}')`, ['--dur' as string]: '9s' }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>tape route</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-live font-mono" fontSize={12}>camera only</text>
        </Floor>
    );
}

// ── 2. Object tracking ───────────────────────────────────────────────────

export function ObjectTrackingLoop() {
    return (
        <Floor label="The robot turns to keep a moving coloured object centred in its camera frame">
            {/* camera frustum from the robot, fixed */}
            <path d="M 280 200 L 150 44 L 410 44 Z" className="fill-media-live/8 stroke-media-live/30" strokeWidth={1} />
            {/* the tracked object sweeps across the frame */}
            <g className="lab-sway" style={{ ['--dur' as string]: '3.4s', ['--amp' as string]: '86px' }}>
                <circle cx={280} cy={86} r={16} className="fill-media-stream" />
                <rect x={256} y={62} width={48} height={48} rx={4}
                    className="fill-none stroke-media-live" strokeWidth={2} strokeDasharray="6 4" />
            </g>
            <Robot style={{ transform: 'translate(280px, 200px)' }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>field of view</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-stream font-mono" fontSize={12}>locked target</text>
        </Floor>
    );
}

// ── 3. Human follower ────────────────────────────────────────────────────

const WALK = 'M 70 150 C 190 90, 330 210, 500 120';

export function HumanFollowerLoop() {
    return (
        <Floor label="The robot trails one walking person at a fixed standoff distance">
            <path d={WALK} className="fill-none stroke-media-fg/25" strokeWidth={3} strokeDasharray="8 8" />
            {/* person leads */}
            <g className="lab-path" style={{ offsetPath: `path('${WALK}')`, ['--dur' as string]: '10s' }}>
                <circle r={7} cy={-10} className="fill-media-stream" />
                <rect x={-5} y={-4} width={10} height={17} rx={4} className="fill-media-stream" />
            </g>
            {/* robot trails: same path, same duration, started 0.9s earlier in the cycle */}
            <Robot className="lab-path" style={{
                offsetPath: `path('${WALK}')`,
                ['--dur' as string]: '10s',
                animationDelay: '-9.1s',
            }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>1.40 m standoff</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-stream font-mono" fontSize={12}>one locked person</text>
        </Floor>
    );
}

// ── 4. Patrolling ────────────────────────────────────────────────────────

const ROUTE = 'M 90 60 L 470 60 L 470 180 L 90 180 Z';
const STOPS: [number, number][] = [[90, 60], [280, 60], [470, 60], [470, 180], [280, 180], [90, 180]];

export function PatrollingLoop() {
    return (
        <Floor label="The robot drives a closed loop of six waypoints, unattended">
            <path d={ROUTE} className="fill-none stroke-media-fg/25" strokeWidth={3} strokeDasharray="8 8" />
            {STOPS.map(([x, y], i) => (
                <g key={i}>
                    <circle cx={x} cy={y} r={3} className="fill-media-fg/40" />
                    <circle cx={x} cy={y} className="fill-media-live lab-wake"
                        style={{ ['--dur' as string]: '12s', animationDelay: `${-12 + i * 2}s` }} />
                    <text x={x} y={y - 14} textAnchor="middle" className="fill-media-fg/50 font-mono" fontSize={12}>
                        {i + 1}
                    </text>
                </g>
            ))}
            <Robot className="lab-path" style={{ offsetPath: `path('${ROUTE}')`, ['--dur' as string]: '12s' }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>6 waypoints</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-live font-mono" fontSize={12}>runs unattended</text>
        </Floor>
    );
}

// ── 5. Uniform — the kidnapped robot ─────────────────────────────────────

/** Particle scatter, deterministic: a fixed lattice jittered by index. */
const PARTICLES = Array.from({ length: 90 }, (_, i) => {
    const gx = 60 + (i % 15) * 31 + ((i * 37) % 11);
    const gy = 40 + Math.floor(i / 15) * 28 + ((i * 53) % 9);
    return [gx, gy] as [number, number];
});

export function UniformLoop() {
    return (
        <Floor label="Particles scattered evenly across every free cell of the map, then collapsing onto the robot's true pose">
            {PARTICLES.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.5} className="fill-media-stream lab-converge"
                    style={{
                        ['--dur' as string]: '6s',
                        ['--tx' as string]: `${300 - x}px`,
                        ['--ty' as string]: `${130 - y}px`,
                        animationDelay: `${-(i % 9) * 0.12}s`,
                    }} />
            ))}
            <Robot style={{ transform: 'translate(300px, 130px)' }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>every free cell equally likely</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-live font-mono" fontSize={12}>first scan match</text>
        </Floor>
    );
}

// ── 6. Exponential — the retry storm ─────────────────────────────────────

export function ExponentialLoop() {
    const fixed = [0, 1, 2, 3].map(i => 150 + i * 0);        // all retry together
    const jittered = [0, 1, 2, 3].map(i => 300 + i * 46);     // spread by jitter

    return (
        <Floor label="Four robots reconnecting: on a fixed timer they all arrive at once; with exponential jitter they spread out">
            <line x1={40} y1={95} x2={520} y2={95} className="stroke-media-fg/25" strokeWidth={2} />
            <line x1={40} y1={175} x2={520} y2={175} className="stroke-media-fg/25" strokeWidth={2} />
            <text x={40} y={78} className="fill-fault font-mono" fontSize={12}>fixed 3 s — all at once</text>
            <text x={40} y={158} className="fill-media-live font-mono" fontSize={12}>exponential jitter — spread</text>

            {fixed.map((x, i) => (
                <circle key={`f${i}`} cx={x} cy={95} r={7} className="fill-fault lab-arrive"
                    style={{ ['--dur' as string]: '4s', animationDelay: `${-i * 0.02}s` }} />
            ))}
            {jittered.map((x, i) => (
                <circle key={`j${i}`} cx={x} cy={175} r={7} className="fill-media-live lab-arrive"
                    style={{ ['--dur' as string]: '4s', animationDelay: `${-i * 0.5}s` }} />
            ))}
            <text x={520} y={222} textAnchor="end" className="fill-media-fg/60 font-mono" fontSize={12}>broker comes back →</text>
        </Floor>
    );
}

// ── 7. Normal — stopping accuracy ────────────────────────────────────────

export function NormalLoop() {
    return (
        <Floor label="The robot drives at a target line and stops slightly short or long each run, scattering around it">
            <line x1={400} y1={40} x2={400} y2={200} className="stroke-media-live/60" strokeWidth={3} strokeDasharray="7 5" />
            <text x={400} y={30} textAnchor="middle" className="fill-media-live font-mono" fontSize={12}>2.00 m target</text>
            <line x1={70} y1={120} x2={400} y2={120} className="stroke-media-fg/25" strokeWidth={2} />
            {/* previous landings cluster around the line */}
            {[-26, -13, -6, 4, 11, 19].map((d, i) => (
                <circle key={i} cx={400 + d} cy={120} r={4} className="fill-media-fg/30" />
            ))}
            <Robot className="lab-run" style={{ ['--dur' as string]: '5s' }} />
            <text x={40} y={222} className="fill-media-fg/60 font-mono" fontSize={12}>50 runs</text>
            <text x={520} y={222} textAnchor="end" className="fill-media-fg/60 font-mono" fontSize={12}>where it actually stops</text>
        </Floor>
    );
}
