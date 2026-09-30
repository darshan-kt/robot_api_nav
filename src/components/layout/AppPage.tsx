import { Link } from 'react-router-dom';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { appMeta } from '../../lib/appCatalog';

/**
 * Shared frame for every reference page.
 *
 * Carries the breadcrumb, the header, the facts strip and the provenance
 * caveat. The caveat is stated here ONCE rather than repeated on each page —
 * seventeen copies of the same disclaimer stop being read after the second.
 */
export function AppPage({
    route,
    summary,
    facts,
    children,
}: {
    /** Must be registered in the catalog — appMeta throws if it is not. */
    route: string;
    /** One sentence: what this gives the robot that nothing else does. */
    summary: string;
    /** Exactly four. The numbers someone wants before choosing the part. */
    facts: { label: string; value: string }[];
    children: ReactNode;
}) {
    const { app, section } = appMeta(route);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header showBack backTo={section.route} title={app.title} icon={app.icon} />

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
                <nav aria-label="Breadcrumb" className="mb-6">
                    <ol className="flex items-center gap-1.5 text-meta font-mono uppercase tracking-widest text-textDim list-none p-0 m-0 flex-wrap">
                        <li><Link to="/store" className="hover:text-live transition-colors duration-base ease-standard">Store</Link></li>
                        <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                        <li><Link to={section.route} className="hover:text-live transition-colors duration-base ease-standard">{section.title}</Link></li>
                        <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
                        <li><span className="text-textMuted" aria-current="page">{app.title}</span></li>
                    </ol>
                </nav>

                <header className="mb-8">
                    <div className="flex items-start gap-4 mb-3">
                        <span className="shrink-0 w-12 h-12 rounded-xl bg-overlay/5 border border-border/60 flex items-center justify-center">
                            <app.icon className="w-6 h-6 text-live" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-text">{app.title}</h1>
                            <span className="text-meta font-mono uppercase tracking-widest text-textDim">{app.provenance}</span>
                        </div>
                    </div>
                    <p className="text-body text-textMuted leading-relaxed max-w-3xl">{summary}</p>
                </header>

                {/* Facts strip. Values wrap rather than truncate — a spec that
                    is cut off is worse than one that takes two lines. */}
                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 m-0">
                    {facts.map(f => (
                        <div key={f.label} className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
                            <dt className="text-meta font-mono uppercase tracking-widest text-textDim mb-1">{f.label}</dt>
                            <dd className="text-body font-mono font-bold text-text m-0 break-words">{f.value}</dd>
                        </div>
                    ))}
                </dl>

                <div className="space-y-10">{children}</div>

                <p className="mt-12 pt-5 border-t border-border/40 text-meta text-textDim leading-relaxed">
                    Reference page. Figures are drawn from datasheets and captured frames, not from the
                    robot attached to this console — nothing here reads a live sensor, and nothing here
                    can command hardware.
                </p>
            </main>
        </div>
    );
}

/** A titled content panel. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="text-title font-bold text-text mb-4">{title}</h2>
            {children}
        </section>
    );
}

/** Label in sans, value in mono — the hardware-panel convention. */
export function SpecList({ rows }: { rows: { label: string; value: string }[] }) {
    return (
        <dl className="rounded-xl border border-border/60 bg-card/60 divide-y divide-border/40 m-0 overflow-hidden">
            {rows.map(r => (
                <div key={r.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-3">
                    <dt className="text-body text-textMuted sm:w-56 shrink-0">{r.label}</dt>
                    <dd className="text-body font-mono text-text m-0 break-words min-w-0">{r.value}</dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * The most important panel on a reference page. A page that only lists
 * capabilities is a datasheet excerpt; the failure modes are what an engineer
 * needs and what shows the author has used the part.
 */
export function FailureModes({ modes }: { modes: { title: string; detail: string }[] }) {
    return (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-center gap-2 mb-4">
                <TriangleAlert className="w-4 h-4 text-warning shrink-0" />
                <h2 className="text-title font-bold text-text">Where it fails</h2>
            </div>
            <ul className="space-y-4 list-none p-0 m-0">
                {modes.map(m => (
                    <li key={m.title}>
                        <h3 className="text-body font-bold text-text mb-1">{m.title}</h3>
                        <p className="text-body text-textMuted leading-relaxed m-0">{m.detail}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Publish/subscribe interfaces, visually distinguished by direction. */
export function Interfaces({ rows, note }: { rows: { dir: 'pub' | 'sub'; topic: string; type: string; rate: string }[]; note: ReactNode }) {
    return (
        <>
            <ul className="rounded-xl border border-border/60 bg-card/60 divide-y divide-border/40 list-none p-0 m-0 overflow-hidden">
                {rows.map(r => (
                    <li key={r.topic} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                        <span className={`text-meta font-mono font-bold uppercase tracking-widest shrink-0 w-14 ${r.dir === 'pub' ? 'text-live' : 'text-stream'}`}>
                            {r.dir}
                        </span>
                        <span className="text-body font-mono text-text break-all">{r.topic}</span>
                        <span className="text-meta font-mono text-textMuted break-all">{r.type}</span>
                        <span className="text-meta font-mono text-textDim ml-auto shrink-0">{r.rate}</span>
                    </li>
                ))}
            </ul>
            <p className="text-body text-textMuted leading-relaxed mt-3">{note}</p>
        </>
    );
}

/**
 * Side-by-side panels from xl up. The sensor pages read as one very long
 * column at 1440 when the hardware and interfaces panels are each half the
 * width they could be; below xl they stack, because two columns at 1024 is
 * two columns of wrapped fragments.
 */
export function TwoUp({ children }: { children: ReactNode }) {
    return <div className="grid xl:grid-cols-2 gap-8 items-start">{children}</div>;
}

/** Numbered decision list — "how the loop runs". */
export function Steps({ steps }: { steps: { title: string; detail: string }[] }) {
    return (
        <ol className="space-y-5 list-none p-0 m-0 counter-reset">
            {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-overlay/5 border border-border/60 flex items-center justify-center text-meta font-mono font-bold text-live">
                        {i + 1}
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-body font-bold text-text mb-1">{s.title}</h3>
                        <p className="text-body text-textMuted leading-relaxed m-0">{s.detail}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

/** Four headline readouts — bench-run results, moments, and the like. */
export function Readouts({ items }: { items: { label: string; value: string; imperfect?: boolean }[] }) {
    return (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 m-0">
            {items.map(it => (
                <div key={it.label}
                    className={`rounded-xl border px-4 py-3 ${it.imperfect ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-card/60'}`}>
                    <dt className="text-meta font-mono uppercase tracking-widest text-textDim mb-1">{it.label}</dt>
                    <dd className={`text-body font-mono font-bold m-0 break-words ${it.imperfect ? 'text-warning' : 'text-text'}`}>
                        {it.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
