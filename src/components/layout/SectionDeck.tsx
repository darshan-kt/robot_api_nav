import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from './Header';
import { appCount, type AppGroup, type SectionDef } from '../../lib/appCatalog';
import type { ReactNode } from 'react';

/**
 * The one deck component. Every section renders through it.
 *
 * A group with no title becomes a plain tile grid; a group with a title
 * becomes a labelled band. That single rule is why adding a section is a
 * catalog entry rather than another near-identical deck file that starts
 * drifting in spacing and heading treatment a month later.
 */
export function SectionDeck({
    section,
    children,
    footer,
}: {
    section: SectionDef;
    /** Slot above the tiles. */
    children?: ReactNode;
    /** Slot below the tiles — where a deck earns its keep. */
    footer?: ReactNode;
}) {
    const n = appCount(section);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header showBack backTo="/store" title={section.title} icon={section.icon} />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
                <div className="flex items-baseline justify-between gap-6 mb-8">
                    <div className="max-w-2xl min-w-0">
                        <h1 className="text-2xl font-bold text-text">{section.title}</h1>
                    </div>
                    <span className="shrink-0 text-meta font-mono uppercase tracking-widest text-textMuted">
                        {n} {n === 1 ? 'app' : 'apps'}
                    </span>
                </div>

                {children && <div className="mb-10">{children}</div>}

                <div className="space-y-10">
                    {section.groups.map((group, i) => (
                        <DeckGroup key={group.title ?? `g${i}`} group={group} />
                    ))}
                </div>

                {footer && <div className="mt-12">{footer}</div>}
            </main>
        </div>
    );
}

function DeckGroup({ group }: { group: AppGroup }) {
    return (
        <section aria-label={group.title}>
            {group.title && (
                // Left rule reads as a level above the tiles without inventing
                // a new type size for it.
                <div className="border-l-2 border-live/60 pl-3 mb-4">
                    <h2 className="text-title font-bold text-text">{group.title}</h2>
                    {group.description && (
                        <p className="text-body text-textMuted mt-0.5">{group.description}</p>
                    )}
                </div>
            )}
            <AppTileGrid apps={group.apps} />
        </section>
    );
}

/**
 * The single tile implementation. The hub and every deck render through it —
 * two tile components would drift in padding and heading treatment within a
 * month, which is the same failure the one-catalog rule exists to prevent.
 */
export function AppTileGrid({ apps, headingLevel = 3 }: { apps: AppGroup['apps']; headingLevel?: 2 | 3 }) {
    const H = (headingLevel === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 list-none p-0 m-0">
            {apps.map(app => (
                <li key={app.id} className="contents">
                    <Link
                        to={app.route}
                        className="group flex flex-col rounded-2xl border border-border/60 bg-card/70 p-5 min-h-[196px]
                                   hover:border-live/50 transition-colors duration-base ease-standard"
                    >
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <span className="w-11 h-11 rounded-xl bg-overlay/5 border border-border/60 flex items-center justify-center">
                                <app.icon className="w-5 h-5 text-live" />
                            </span>
                            <ArrowRight className="w-4 h-4 text-textMuted group-hover:text-live transition-colors duration-base ease-standard" />
                        </div>

                        <H className="text-title font-bold text-text mb-1.5">{app.title}</H>
                        <p className="text-body text-textMuted leading-relaxed flex-1">{app.blurb}</p>

                        <span className="mt-4 pt-3 border-t border-border/40 text-meta font-mono uppercase tracking-widest text-textMuted">
                            {app.provenance}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
