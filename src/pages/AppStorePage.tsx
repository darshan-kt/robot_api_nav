import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Skeleton } from '../components/ui/Layout';
import { AppTileGrid } from '../components/layout/SectionDeck';
import { SECTIONS, appCount } from '../lib/appCatalog';

export function AppStorePage() {
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
                        Robotics appstore
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

                {/* Sections — every heading, tile and count below is read from
                    src/lib/appCatalog.ts. Adding a section is an entry there. */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[196px] rounded-2xl" />)}
                    </div>
                ) : (
                    <div className="space-y-14">
                        {SECTIONS.map(section => {
                            const n = appCount(section);
                            return (
                                <section key={section.id} aria-labelledby={`sec-${section.id}`} className="animate-fade-up">
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h2 id={`sec-${section.id}`} className="text-2xl font-bold text-text">
                                                    {section.title}
                                                </h2>
                                                <Link
                                                    to={section.route}
                                                    className="inline-flex items-center gap-1 text-meta font-mono uppercase tracking-widest text-textMuted hover:text-live transition-colors duration-base ease-standard"
                                                >
                                                    Open section
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-meta font-mono uppercase tracking-widest text-textMuted pt-1">
                                            {n} {n === 1 ? 'app' : 'apps'}
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {section.groups.map((group, gi) => (
                                            <div key={group.title ?? `g${gi}`}>
                                                {group.title && (
                                                    <div className="border-l-2 border-live/60 pl-3 mb-4">
                                                        <h3 className="text-title font-bold text-text">{group.title}</h3>
                                                        {group.description && (
                                                            <p className="text-body text-textMuted mt-0.5">{group.description}</p>
                                                        )}
                                                    </div>
                                                )}
                                                <AppTileGrid apps={group.apps} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

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
