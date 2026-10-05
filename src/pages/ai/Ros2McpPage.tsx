import { Link } from 'react-router-dom';
import { AppPage, Panel } from '../../components/layout/AppPage';
import { Figure, GatedArchitecture } from '../../components/ui/Viz';
import { LivePanel } from '../../components/layout/LivePanel';
import { GateTrace } from '../../components/ui/AgentViz';
import { GATE_CHAIN, liveGateCall } from '../../lib/liveFrames';

type Kind = 'read' | 'plan' | 'act';

const KIND_STYLE: Record<Kind, string> = {
    read: 'bg-live/15 text-live border-live/40',
    plan: 'bg-stream/15 text-stream border-stream/40',
    act: 'bg-warning/15 text-warning border-warning/40',
};

const TOOLS: { kind: Kind; name: string; maps: string; tier: string }[] = [
    { kind: 'read', name: 'get_health', maps: 'hive/<id>/health', tier: 'observe' },
    { kind: 'read', name: 'get_pose', maps: 'hive/<id>/localisation', tier: 'observe' },
    { kind: 'read', name: 'get_scan', maps: 'hive/<id>/scan', tier: 'observe' },
    { kind: 'plan', name: 'preview_route', maps: 'planner only — publishes nothing', tier: 'propose' },
    { kind: 'act', name: 'goto_waypoint', maps: 'cmd/goal → NavigateThroughPoses', tier: 'commit' },
    { kind: 'act', name: 'cancel_navigation', maps: 'cmd/cancel_nav', tier: 'always' },
    { kind: 'act', name: 'stop', maps: 'cmd/velocity zero + E-Stop latch', tier: 'always' },
];

const TIERS = [
    { name: 'observe', rule: 'No approval.', detail: 'Reads state. Cannot change anything, so gating it only adds latency to the model\'s understanding of the world.' },
    { name: 'propose', rule: 'No approval, no effect.', detail: 'Runs a planner and returns a route without publishing it. The model can think out loud in the robot\'s own terms and nothing moves.' },
    { name: 'commit', rule: 'A human confirms.', detail: 'Anything that reaches the drive stack. The confirmation names the destination in the operator\'s language, not the tool call.' },
    { name: 'always', rule: 'Never gated, never rate-limited, never queued.', detail: 'Stopping. A gate that can refuse a stop is a worse failure than one that lets a bad action through, so this tier bypasses the gate entirely.' },
];

const WITHHELD = [
    {
        title: 'Raw velocity (cmd/velocity)',
        why: 'A model asked for a number will produce one. It has no model of mass, floor friction or how far 0.4 m/s carries in the 500 ms before the next frame. The model may name a destination; turning that into wheel speeds is the navigation stack\'s job and it is better at it.',
    },
    {
        title: 'Pose setters (cmd/set_pose)',
        why: 'Writing /initialpose teleports the robot\'s belief about where it is. There is no safe rollback — the previous estimate is gone, and every subsequent scan match is interpreted against the new one. A wrong call here is not a wrong action, it is a wrong world.',
    },
    {
        title: 'Map writes',
        why: 'A map edit is silent. Nothing visibly happens until the robot is somewhere unexpected, possibly days later, and by then the change is indistinguishable from a localisation fault. Actions whose consequences are deferred and untraceable are the worst possible fit for an agent that cannot be asked what it was thinking.',
    },
    {
        title: 'Camera frames (cmd/webrtc_offer)',
        why: 'Footage leaving the site is a decision about people, not about robots. Whether a frame containing a colleague is sent to a third-party inference endpoint is a question a human answers once as policy, not one a model answers per request.',
    },
];

export function Ros2McpPage() {
    return (
        <AppPage
            route="/ai/ros2-mcp"
            summary="Wiring a model to the robot over MCP is an afternoon of protocol plumbing. The interesting problem is deciding what the model is allowed to call — and making the things it must never be able to block sit somewhere it cannot reach."
            facts={[
                { label: 'Transport', value: 'MCP over stdio' },
                { label: 'Tools exposed', value: '7' },
                { label: 'Permission tiers', value: '4' },
                { label: 'Implemented', value: 'No — design only' },
            ]}
        >
            <Panel title="The argument, in three claims">
                <p className="text-body text-textMuted leading-relaxed max-w-3xl mb-5">
                    Connecting a model to a robot is a solved piece of engineering: MCP over stdio, a tool
                    schema, a day's work. What is not solved is <em>which tools go in the schema</em> — and
                    that list is the entire boundary. Anything in it, the model can eventually be talked into
                    calling. Anything outside it, no amount of talking reaches. Everything below is a proposal
                    for where to draw that line on the robot this console already drives.
                </p>

                <ol className="grid md:grid-cols-3 gap-4 list-none p-0 m-0">
                    {[
                        {
                            n: 'The safety layer must not be callable',
                            d: 'The E-Stop latch and the 500 ms velocity deadman have no tool, no schema and no name a tool call can reference. A safety layer the model can address is one it can be talked into addressing.',
                        },
                        {
                            n: 'Withheld is not the same as denied',
                            d: 'The four capabilities at the bottom of this page are absent from the schema rather than refused by the gate. A refusal is a decision that can be mis-made; an absence is not a decision at all.',
                        },
                        {
                            n: 'Weight the surface towards stopping',
                            d: 'Seven tools: three read, one plans without publishing, and of the three that act, two are ways to halt. The calls that are safe to get wrong outnumber the ones that are not.',
                        },
                    ].map((c, i) => (
                        <li key={c.n} className="rounded-xl border border-border/60 bg-card/60 p-4">
                            <span className="text-meta font-mono font-bold text-live">{i + 1}</span>
                            <h3 className="text-body font-bold text-text mt-1 mb-1.5">{c.n}</h3>
                            <p className="text-body text-textMuted leading-relaxed m-0">{c.d}</p>
                        </li>
                    ))}
                </ol>
            </Panel>

            <Panel title="Where the gate sits">
                <Figure
                    title="Model to robot, with the safety layer underneath"
                    caption={
                        <>
                            Every arrow along the top can fail: the model can hallucinate a tool, the server
                            can mis-marshal an argument, the gate can be misconfigured. The band underneath
                            must not, and the way it is made not to is that nothing in it is callable — the
                            E-Stop latch and the bridge's 500 ms velocity deadman are not tools, have no
                            schema, and cannot be named in a tool call. A safety layer the model can address
                            is a safety layer the model can be talked into addressing.
                        </>
                    }
                >
                    <GatedArchitecture
                        chain={['Model', 'MCP server', 'Policy gate', 'MQTT bridge', 'ROS 2 / Nav2']}
                        floor="E-Stop latch · cmd_vel deadman · speed ceiling"
                    />
                </Figure>
            </Panel>

            <LivePanel
                hz={2}
                rateLabel="one hop per frame"
                caveat="A walkthrough of the design on this page, not a recording of anything. There is no MCP server, no model and no gate — the sequence is a pure function of the frame index, so pausing and stepping replays it exactly."
                readout={tick => {
                    const { call, stepIndex, step } = liveGateCall(tick);
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Tool', v: call.tool, bad: false },
                                { k: 'Tier', v: call.tier, bad: call.tier === 'not exposed' },
                                { k: 'Stage', v: GATE_CHAIN[step.stage], bad: false },
                                { k: 'Verdict', v: step.status, bad: step.status === 'refused' || step.status === 'hold' },
                            ].map(x => (
                                <div key={x.k}
                                    className={`rounded-xl border px-4 py-3 ${x.bad ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-card/60'}`}>
                                    <dt className="text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{x.k}</dt>
                                    <dd className={`text-body font-mono font-bold m-0 break-words ${x.bad ? 'text-warning' : 'text-text'}`}>
                                        {x.v}
                                    </dd>
                                </div>
                            ))}
                            <span className="sr-only">Step {stepIndex + 1}</span>
                        </dl>
                    );
                }}
            >
                {tick => {
                    const t = liveGateCall(tick);
                    return (
                        <GateTrace chain={GATE_CHAIN} call={t.call} step={t.step}
                            reached={t.reached} callIndex={t.callIndex} total={t.total} />
                    );
                }}
            </LivePanel>

            <Panel title="What the five calls show">
                <p className="text-body text-textMuted leading-relaxed max-w-3xl">
                    The sequence above is the whole design in about fifteen seconds, which is why it is here
                    rather than only in the tables below. A read crosses every stage unchallenged. A proposal
                    runs the planner and stops — it returns a route and publishes nothing, so there is nothing
                    to approve. A commit halts at the gate and waits for a person, and the question that person
                    is asked names a place in the building rather than a function signature. The fourth call is
                    the interesting one: <span className="font-mono">set_velocity</span> dies at the MCP server
                    because no such tool exists, so the gate is never consulted and there is no decision to get
                    wrong. The fifth is routed <em>around</em> the gate deliberately — a gate that can refuse a
                    stop is a worse failure than one that lets a bad action through.
                </p>
            </Panel>

            <Panel title="Tool surface">
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse">
                        <caption className="sr-only">Tools exposed to the model, what each maps to, and its permission tier</caption>
                        <thead>
                            <tr>
                                {['Kind', 'Tool', 'Maps to', 'Tier'].map(h => (
                                    <th key={h} scope="col" className="text-left text-meta font-mono uppercase tracking-widest text-textMuted pb-3 pr-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TOOLS.map(t => (
                                <tr key={t.name} className="border-t border-border/40">
                                    <td className="py-3 pr-4">
                                        <span className={`inline-block px-2 py-0.5 rounded-full border text-meta font-mono uppercase tracking-widest ${KIND_STYLE[t.kind]}`}>
                                            {t.kind}
                                        </span>
                                    </td>
                                    <th scope="row" className="text-left py-3 pr-4 text-body font-mono text-text whitespace-nowrap">{t.name}</th>
                                    <td className="py-3 pr-4 text-body font-mono text-textMuted break-all">{t.maps}</td>
                                    <td className="py-3 pr-4 text-body font-mono text-textMuted">{t.tier}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-body text-textMuted leading-relaxed mt-3">
                    Three reads, one plan, three acts — and two of the three acts are ways to stop. That
                    ratio is deliberate: the surface is weighted towards observing and halting, because
                    those are the calls that are safe to get wrong.
                </p>
            </Panel>

            <Panel title="Permission tiers">
                <ul className="space-y-3 list-none p-0 m-0">
                    {TIERS.map(t => (
                        <li key={t.name} className={`rounded-xl border p-4 ${t.name === 'always' ? 'border-fault/40 bg-fault/5' : 'border-border/60 bg-card/60'}`}>
                            <div className="flex flex-wrap items-baseline gap-x-3 mb-1">
                                <span className={`text-body font-mono font-bold ${t.name === 'always' ? 'text-fault' : 'text-text'}`}>{t.name}</span>
                                <span className="text-meta font-mono uppercase tracking-widest text-textMuted">{t.rule}</span>
                            </div>
                            <p className="text-body text-textMuted leading-relaxed m-0">{t.detail}</p>
                        </li>
                    ))}
                </ul>
            </Panel>

            <Panel title="Deliberately not exposed">
                <ul className="space-y-4 list-none p-0 m-0">
                    {WITHHELD.map(w => (
                        <li key={w.title}>
                            <h3 className="text-body font-bold text-text mb-1 font-mono">{w.title}</h3>
                            <p className="text-body text-textMuted leading-relaxed m-0">{w.why}</p>
                        </li>
                    ))}
                </ul>
            </Panel>

            <Panel title="Open questions">
                <ol className="space-y-4 list-none p-0 m-0">
                    {[
                        {
                            q: 'Who confirms a commit at 03:00?',
                            body: 'The commit tier assumes a human is present. The patrol runs unattended overnight, which is exactly when an autonomous agent is most useful and least supervised. Queuing commits until morning makes the agent useless; auto-approving them deletes the tier. Neither answer is obviously right and we have not chosen one.',
                        },
                        {
                            q: 'What is the model told when a call fails?',
                            body: 'Returning the raw error invites retry loops — a model that sees "connection refused" will try again, and again, faster. Returning nothing invites hallucination, because the model fills the gap with a plausible account of what probably happened. The middle ground is a small vocabulary of typed outcomes, and nobody has designed that vocabulary yet.',
                        },
                        {
                            q: 'Are sensor returns hostile input?',
                            body: 'A scan, a pose and a camera frame all reach the model with the same status as the system prompt once they are in the context window. Anything an attacker can place in front of the robot is a channel into that window — a printed sign is a prompt injection with a physical delivery mechanism. No design here handles that, and marking observations as untrusted in the prompt is a mitigation rather than a fix.',
                        },
                    ].map((o, i) => (
                        <li key={o.q} className="flex gap-4">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-overlay/5 border border-border/60 flex items-center justify-center text-meta font-mono font-bold text-live">{i + 1}</span>
                            <div className="min-w-0">
                                <h3 className="text-body font-bold text-text mb-1">{o.q}</h3>
                                <p className="text-body text-textMuted leading-relaxed m-0">{o.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
                <p className="text-body text-textMuted leading-relaxed mt-5 max-w-3xl">
                    These are the questions to bring to a room rather than answer in a document. A design that
                    names what it has not settled is easier to argue with than one that reads as finished.
                </p>
            </Panel>

            <Panel title="The other half of this">
                <p className="text-body text-textMuted leading-relaxed max-w-3xl">
                    Everything on this page is mechanical: what is in the schema, what the gate does, what sits
                    underneath and cannot be reached. It bounds the worst case and says nothing about how often
                    the model makes a bad call inside that boundary. Reducing that rate is the job of the
                    prompt, and it is a different kind of work with much weaker guarantees — which is covered
                    in{' '}
                    <Link to="/ai/prompting" className="text-live underline underline-offset-2 hover:text-liveStrong transition-colors duration-base ease-standard">
                        Prompting robotics
                    </Link>. Read in order, the two pages are one argument: the tool surface decides what is
                    possible, the prompt decides what is likely, and neither of them is the safety system.
                </p>
            </Panel>
        </AppPage>
    );
}
