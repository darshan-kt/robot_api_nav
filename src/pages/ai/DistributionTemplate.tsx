import type { ReactNode } from 'react';
import { AppPage, Panel, FailureModes, Readouts } from '../../components/layout/AppPage';
import { Figure, Curve, type Marker } from '../../components/ui/Viz';

/**
 * Shared by the three distribution pages. They differ only in the maths and
 * in where the assumption is relied on; the shape is identical, so this is a
 * template rather than three files.
 */
export function DistributionTemplate({
    route, summary, facts, pdf, domain, markers, curveCaption,
    formula, support, drawnWith, moments, appearsIn, breaks, code,
}: {
    route: string;
    summary: string;
    facts: { label: string; value: string }[];
    /** Evaluated over the domain — never hand-traced. */
    pdf: (x: number) => number;
    domain: [number, number];
    markers: Marker[];
    curveCaption: ReactNode;
    formula: string;
    support: string;
    drawnWith: string;
    moments: { label: string; value: string }[];
    appearsIn: { title: string; body: ReactNode };
    breaks: { title: string; detail: string }[];
    code: string;
}) {
    return (
        <AppPage route={route} summary={summary} facts={facts}>
            <Panel title="Density">
                <Figure title="Probability density, evaluated at 240 points" caption={curveCaption}>
                    <Curve pdf={pdf} domain={domain} markers={markers} samples={240} />
                </Figure>
            </Panel>

            <Panel title="Definition">
                <pre className="rounded-xl border border-border/60 bg-media-bg p-4 overflow-x-auto text-body font-mono text-media-fg m-0">
                    {formula}
                </pre>
                <dl className="mt-3 space-y-1 m-0">
                    <div className="flex flex-wrap gap-x-3 text-body">
                        <dt className="text-textMuted">Support</dt>
                        <dd className="font-mono text-text m-0">{support}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-body">
                        <dt className="text-textMuted">Drawn above with</dt>
                        <dd className="font-mono text-text m-0">{drawnWith}</dd>
                    </div>
                </dl>
            </Panel>

            <Panel title="Moments">
                <Readouts items={moments} />
            </Panel>

            <Panel title={appearsIn.title}>
                <div className="space-y-3 text-body text-textMuted leading-relaxed">{appearsIn.body}</div>
            </Panel>

            <FailureModes modes={breaks} />

            <Panel title="Drawing samples">
                <pre className="rounded-xl border border-border/60 bg-media-bg p-4 overflow-x-auto text-body font-mono text-media-fg m-0">
                    {code}
                </pre>
            </Panel>
        </AppPage>
    );
}
