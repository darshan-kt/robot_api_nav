import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TriangleAlert, Cpu, Wrench } from 'lucide-react';
import { Header } from './Header';
import { appMeta } from '../../lib/appCatalog';
import { LivePanel } from './LivePanel';

/**
 * Lab-course layout for the project pages.
 *
 * Deliberately short. The earlier reference layout ran 400-520 words per
 * page; a student standing at the bench needs the objective, the kit list,
 * something moving to look at, and the numbers — not four paragraphs of
 * prose they will not read while the robot is on the floor.
 *
 * Order is fixed: objective, robot in action, tools, live data, watch out.
 */
export function LabProject({
    route, objective, loop, loopCaption, tools, liveHz, liveRate, live, readout, watchOut,
}: {
    route: string;
    /** One sentence. What the robot does, in plain words. */
    objective: string;
    /** The looping "in action" scene. */
    loop: ReactNode;
    loopCaption: string;
    tools: { hardware: string[]; software: string[] };
    liveHz: number;
    liveRate: string;
    live: (tick: number) => ReactNode;
    readout: (tick: number) => ReactNode;
    /** Three short lines. No paragraphs. */
    watchOut: string[];
}) {
    const { app, section } = appMeta(route);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header showBack backTo={section.route} title={app.title} icon={app.icon} />

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex items-center gap-1.5 text-meta font-mono uppercase tracking-widest text-textMuted list-none p-0 m-0 flex-wrap">
                        <li><Link to="/store" className="hover:text-live transition-colors duration-base ease-standard">Store</Link></li>
                        <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                        <li><Link to={section.route} className="hover:text-live transition-colors duration-base ease-standard">{section.title}</Link></li>
                        <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                        <li><span className="text-textMuted" aria-current="page">{app.title}</span></li>
                    </ol>
                </nav>

                {/* ── Objective ─────────────────────────────────────────── */}
                <header className="mb-10">
                    <div className="flex items-start gap-4 mb-4">
                        <span className="shrink-0 w-12 h-12 rounded-xl bg-overlay/5 border border-border/60 flex items-center justify-center">
                            <app.icon className="w-6 h-6 text-live" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-text">{app.title}</h1>
                            <span className="text-meta font-mono uppercase tracking-widest text-textMuted">{app.provenance}</span>
                        </div>
                    </div>
                    <p className="text-readout text-text leading-snug max-w-2xl font-medium">{objective}</p>
                </header>

                <div className="space-y-10">
                    {/* ── Robot in action ───────────────────────────────── */}
                    <section>
                        <h2 className="text-title font-bold text-text mb-4">The robot in action</h2>
                        <div className="rounded-xl border border-border/60 bg-media-bg p-4 overflow-x-auto">
                            {loop}
                        </div>
                        <p className="text-body text-textMuted leading-relaxed mt-3">{loopCaption}</p>
                    </section>

                    {/* ── Tools ─────────────────────────────────────────── */}
                    <section>
                        <h2 className="text-title font-bold text-text mb-4">Tools used</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {([
                                ['Hardware', Wrench, tools.hardware],
                                ['Software', Cpu, tools.software],
                            ] as const).map(([label, Icon, items]) => (
                                <div key={label} className="rounded-xl border border-border/60 bg-card/60 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon className="w-4 h-4 text-live shrink-0" />
                                        <h3 className="text-meta font-mono uppercase tracking-widest text-textMuted">{label}</h3>
                                    </div>
                                    <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                                        {items.map(t => (
                                            <li key={t}
                                                className="px-2.5 py-1 rounded-lg border border-border/60 bg-overlay/5 text-body font-mono text-text">
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Live data ─────────────────────────────────────── */}
                    <LivePanel hz={liveHz} rateLabel={liveRate} readout={readout} quiet>
                        {live}
                    </LivePanel>

                    {/* ── Watch out ─────────────────────────────────────── */}
                    <section className="rounded-xl border border-warning/30 bg-warning/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TriangleAlert className="w-4 h-4 text-warning shrink-0" />
                            <h2 className="text-title font-bold text-text">Watch out</h2>
                        </div>
                        <ul className="space-y-2 list-none p-0 m-0">
                            {watchOut.map(w => (
                                <li key={w} className="flex gap-2 text-body text-textMuted leading-relaxed">
                                    <span className="text-warning shrink-0" aria-hidden="true">•</span>{w}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <p className="mt-12 pt-5 border-t border-border/40 text-meta text-textMuted leading-relaxed">
                    Lab exercise. The scene and the readings are simulated from the behaviour's own model —
                    this console is not connected to the robot on the floor, and nothing here commands hardware.
                </p>
            </main>
        </div>
    );
}
