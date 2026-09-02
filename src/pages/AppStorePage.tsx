import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRight, OctagonX, Smartphone, Route, CircuitBoard } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge, Skeleton } from '../components/ui/Layout';

export function AppStorePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        // Simulate loading for animations
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // RGB triplets drive the per-card spotlight / beam / shadow via --glow
    const glows: Record<string, string> = {
        emerald: '52 211 153',
        rose:    '244 63 94',
        purple:  '167 139 250',
        amber:   '251 191 36',
        teal:    '45 212 191',
    };

    const themeStyles: Record<string, string> = {
        emerald: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
        rose:    'bg-rose-400/10 text-rose-400 ring-rose-400/20',
        purple:  'bg-purple-400/10 text-purple-400 ring-purple-400/20',
        amber:   'bg-amber-400/10 text-amber-400 ring-amber-400/20',
        teal:    'bg-teal-400/10 text-teal-400 ring-teal-400/20',
    };

    const primaryApps = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: LayoutDashboard,
            theme: 'emerald' as const,
            tag: 'Core',
            description: 'Robot info, sensors, configuration & system monitoring',
            version: 'v3.1.2',
            path: '/dashboard'
        },
        {
            id: 'emergency-stop',
            title: 'Emergency Stop',
            icon: OctagonX,
            theme: 'rose' as const,
            tag: 'Safety',
            description: 'Instantly halt all robot operations with global software E-Stop',
            version: 'v1.0.0',
            path: '/emergency-stop'
        },
        {
            id: 'remote-controller',
            title: 'Remote Controller',
            icon: Smartphone,
            theme: 'purple' as const,
            tag: 'Manual',
            description: 'Manual teleop controls with keyboard steering and radar HUD',
            version: 'v1.0.0',
            path: '/remote-controller'
        },
        {
            id: 'simple-route-planner',
            title: 'Simple Route Planner',
            icon: Route,
            theme: 'amber' as const,
            tag: 'Planning',
            description: 'Design and edit robot navigation routes on a map canvas',
            version: 'v1.0.0',
            path: '/simple-route-planner'
        },
        {
            id: 'hardware-sensors-lab',
            title: 'Hardware & Sensors Lab',
            icon: CircuitBoard,
            theme: 'teal' as const,
            tag: 'Lab',
            description: 'Tune RPLIDAR A2 and Orbbec Astra Pro parameters, read the verified setup steps, and watch simulated live data respond in real time',
            version: 'v1.0.0',
            path: '/hardware-sensors-lab'
        },
    ];

    // Decorative system ticker — purely visual flavour
    const tickerItems = [
        'ALL SYSTEMS NOMINAL', 'ROS 2 HUMBLE', 'DDS DOMAIN 0', 'RMW: CYCLONEDDS',
        'GATEWAY :1717 ONLINE', 'NAV2 STACK READY', 'LIDAR 360° SWEEP ACTIVE',
        'AMCL LOCALIZED', 'BEHAVIOR TREES LOADED', 'TELEOP DEADMAN ARMED',
    ];

    // Ambient floating motes (deterministic layout, pure decoration)
    const motes = [
        { left: '8%',  top: '22%', dur: '6s',  delay: '0s'   },
        { left: '16%', top: '64%', dur: '8s',  delay: '1.2s' },
        { left: '27%', top: '35%', dur: '7s',  delay: '0.6s' },
        { left: '41%', top: '75%', dur: '9s',  delay: '2s'   },
        { left: '55%', top: '28%', dur: '6.5s', delay: '0.3s' },
        { left: '66%', top: '58%', dur: '8.5s', delay: '1.6s' },
        { left: '78%', top: '30%', dur: '7.5s', delay: '0.9s' },
        { left: '88%', top: '68%', dur: '6.8s', delay: '2.4s' },
        { left: '93%', top: '40%', dur: '9.5s', delay: '0.2s' },
        { left: '48%', top: '50%', dur: '7.2s', delay: '1.9s' },
    ];

    // 3D tilt + cursor spotlight — writes CSS vars/transform straight to the card
    const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.transform =
            `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-4px)`;
    };

    const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = '';
    };

    const utc = clock.toISOString().slice(11, 19);

    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative isolate overflow-hidden">
            {/* Ambient background: aurora glows + grid floor + floating motes */}
            <div className="absolute top-[12%] left-[-12%] w-[520px] h-[520px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none -z-10 animate-pulse-gentle" />
            <div className="absolute bottom-[18%] right-[-10%] w-[620px] h-[620px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none -z-10 animate-pulse-gentle" style={{ animationDelay: '1.5s' }} />
            <div className="hub-grid-floor -z-10" />
            {motes.map((m, i) => (
                <span
                    key={i}
                    className="hub-float absolute w-1 h-1 rounded-full bg-emerald-300/60 pointer-events-none -z-10"
                    style={{ left: m.left, top: m.top, '--dur': m.dur, animationDelay: m.delay } as React.CSSProperties}
                />
            ))}

            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 relative">
                {/* Hero */}
                <div className="mb-8 animate-fade-up">
                    <div className="flex items-center gap-3 mb-4 font-mono text-[10px] tracking-[0.3em] text-textMuted uppercase">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-status" />
                            Mission deck
                        </span>
                        <span className="text-textDim">·</span>
                        <span>UTC {utc}</span>
                        <span className="text-textDim">·</span>
                        <span>OPERATOR SESSION</span>
                    </div>

                    <h1 className="hub-headline text-4xl md:text-6xl font-mono font-extrabold tracking-tight uppercase leading-none mb-4">
                        My appstore
                        <span className="hub-cursor text-emerald-400">_</span>
                    </h1>

                    <p className="text-sm md:text-base text-textMuted max-w-2xl leading-relaxed">
                        Deploy telemetry monitors, control manual driving operations, or engage
                        safety systems from your centralized robot dashboard.
                    </p>
                </div>

                {/* System status ticker */}
                <div className="mb-12 border-y border-border/30 py-2.5 overflow-hidden animate-fade-up" aria-hidden="true">
                    <div className="hub-ticker flex w-max whitespace-nowrap font-mono text-[10px] tracking-[0.25em] text-textDim uppercase">
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <span key={i} className="flex items-center">
                                <span className="hover:text-emerald-400/80 transition-colors">{item}</span>
                                <span className="mx-6 text-emerald-500/40">✦</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Primary Apps */}
                <div className="mb-14">
                    <div className="flex items-center gap-4 mb-8 animate-fade-up">
                        <h2 className="text-md md:text-lg font-mono font-bold text-text uppercase tracking-widest">Active Applications</h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/30 via-emerald-500/5 to-transparent" />
                        <Badge type="emerald">CORE CONTROLS</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {loading ? (
                            [1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-[320px] rounded-2xl" />
                            ))
                        ) : (
                            primaryApps.map((app, i) => (
                                <div
                                    key={app.id}
                                    onClick={() => navigate(app.path)}
                                    onMouseMove={handleTilt}
                                    onMouseLeave={resetTilt}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(app.path); }}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Launch ${app.title}`}
                                    style={{ '--glow': glows[app.theme] } as React.CSSProperties}
                                    className={`hub-card stagger-${i + 1} opacity-0 animate-fade-up group relative flex flex-col
                                        min-h-[320px] rounded-2xl cursor-pointer bg-card/80 backdrop-blur
                                        border border-white/5 overflow-hidden`}
                                >
                                    {/* cursor spotlight + rotating border beam */}
                                    <div className="hub-spotlight" />
                                    <div className="hub-beam-wrap rounded-2xl"><div className="hub-beam" /></div>

                                    {/* ghost index numeral */}
                                    <span className="absolute top-4 right-5 font-mono font-extrabold text-6xl leading-none text-white/[0.04] group-hover:text-white/[0.08] transition-colors select-none">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>

                                    <div className="p-6 md:p-7 flex-1 relative">
                                        {/* icon tile with orbiting satellite dot */}
                                        <div className="relative w-14 h-14 mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-1 transition-transform duration-300 group-hover:scale-110 ${themeStyles[app.theme]}`}>
                                                <app.icon className="w-7 h-7" />
                                            </div>
                                            <div className="absolute inset-[-6px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow pointer-events-none">
                                                <span
                                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                                                    style={{ background: `rgb(${glows[app.theme]})` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                                            <h3 className="text-lg font-bold text-text">{app.title}</h3>
                                            <Badge type={app.theme}>{app.tag}</Badge>
                                        </div>

                                        <p className="text-xs md:text-sm text-textMuted leading-relaxed">
                                            {app.description}
                                        </p>
                                    </div>

                                    <div className="px-6 md:px-7 py-3.5 bg-black/20 border-t border-border/30 flex items-center justify-between relative">
                                        <span className="text-[10px] font-mono text-textMuted">{app.version}</span>
                                        <div className="flex items-center gap-2 text-xs font-semibold transition-all group-hover:gap-3"
                                            style={{ color: `rgb(${glows[app.theme]})` }}>
                                            <span className="tracking-widest font-mono">LAUNCH</span>
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-8 px-4 border-t border-border/30 text-center relative">
                <p className="text-xs font-mono text-textMuted flex items-center justify-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400/60 animate-pulse-status" />
                    &copy; 2026 ROBOSTORE SYSTEMS · ALL RIGHTS RESERVED
                </p>
            </footer>
        </div>
    );
}
