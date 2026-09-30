import type { ReactNode } from 'react';
import { AppPage, Panel, SpecList, FailureModes, Steps, Readouts } from '../../components/layout/AppPage';
import { Figure, Pipeline, Sparkline, type Stage } from '../../components/ui/Viz';

/**
 * All four projects share a real shape: sensors in, a decision loop, a command
 * out, and a bench run saying how well it held. One template, each project
 * supplying only what differs.
 *
 * `extra` exists so a project can add the one panel the others do not need —
 * without it this either becomes four copy-pasted files or grows a boolean
 * flag per project, and the flag version is worse every time.
 */
export function ProjectTemplate({
    route, summary, facts, stages, pipelineCaption, steps, params,
    bench, trace, traceUnit, traceBand, traceCaption, failures, extra,
}: {
    route: string;
    summary: string;
    facts: { label: string; value: string }[];
    stages: Stage[];
    pipelineCaption: ReactNode;
    steps: { title: string; detail: string }[];
    params: { label: string; value: string }[];
    bench: { label: string; value: string; imperfect?: boolean }[];
    trace: number[];
    traceUnit: string;
    traceBand?: [number, number];
    traceCaption: ReactNode;
    failures: { title: string; detail: string }[];
    /** The one panel this project needs and the others do not. */
    extra?: ReactNode;
}) {
    return (
        <AppPage route={route} summary={summary} facts={facts}>
            <Panel title="The loop">
                <Figure title="Processing chain, sensor to command" caption={pipelineCaption}>
                    <Pipeline stages={stages} />
                </Figure>
            </Panel>

            <Panel title="How the loop runs">
                <Steps steps={steps} />
            </Panel>

            <Panel title="Tuned parameters">
                <SpecList rows={params} />
                <p className="text-body text-textMuted leading-relaxed mt-3">
                    These are the values that get retuned on a new site. Anything round in this list is
                    round because it is a limit somebody chose, not a gain somebody measured.
                </p>
            </Panel>

            <Panel title="Bench run">
                <Readouts items={bench} />
                <div className="mt-5">
                    <Figure title="Trace" caption={traceCaption}>
                        <Sparkline values={trace} unit={traceUnit} band={traceBand} />
                    </Figure>
                </div>
            </Panel>

            {extra}

            <FailureModes modes={failures} />
        </AppPage>
    );
}
