import { ProjectTemplate, wobble } from './ProjectTemplate';

export function HumanFollowerPage() {
    return (
        <ProjectTemplate
            route="/projects/human-follower"
            summary="The hard part is not following. It is deciding which person, and refusing to follow anyone else once that decision is made — a follower that re-targets on the nearest body is a machine that changes its mind about who it is walking towards."
            facts={[
                { label: 'Sensors', value: 'Astra Pro — RGB + depth' },
                { label: 'Loop rate', value: '15 Hz' },
                { label: 'Controller', value: 'P with a hard floor' },
                { label: 'Top speed', value: '0.22 m/s' },
            ]}
            stages={[
                { name: 'RGB-D', detail: 'registered pair' },
                { name: 'Detect', detail: 'person boxes' },
                { name: 'Re-ID', detail: 'cosine vs locked' },
                { name: 'Standoff', detail: 'depth-derived range' },
                { name: '/cmd_vel', detail: 'capped below walking' },
            ]}
            pipelineCaption={
                <>
                    Stage three is the one that matters. Without it the pipeline follows whichever person
                    is nearest, which looks identical in an empty corridor and behaves very differently the
                    moment a second person walks past.
                </>
            }
            steps={[
                {
                    title: 'Lock once, then spend every frame verifying the lock',
                    detail:
                        'The target is chosen once — nearest person at start, confirmed over five consecutive frames — and an embedding is stored. From then on the question each frame is not "who should I follow" but "is this still the same person", answered by cosine distance against the stored embedding. Re-asking the first question every frame is what produces a robot that swaps targets in a corridor.',
                },
                {
                    title: 'Take standoff from depth, never from box height',
                    detail:
                        'Bounding-box height is a tempting range proxy and is a function of posture as much as distance. Someone crouching reads as far away and the robot drives at them. The depth median inside the box is noisier and is actually measuring the thing being controlled.',
                },
                {
                    title: 'A lost target halts — it never re-targets',
                    detail:
                        'After 0.5 s without a match above threshold the node publishes zero and stays there until a human restarts it. It does not widen the threshold, and it does not fall back to nearest-person. Both of those recover the demo and both convert "the robot stopped" into "the robot followed a stranger", which is the failure that actually matters.',
                },
                {
                    title: 'Put a speed ceiling below walking pace, under the controller',
                    detail:
                        'The cap of 0.22 m/s is roughly a sixth of walking pace and is applied after the controller, not inside it. The robot therefore cannot chase: if the target walks away it falls behind and eventually loses the lock and stops, which is the intended outcome. A follower that can keep up with someone leaving is a follower that can corner them.',
                },
            ]}
            params={[
                { label: 'Re-ID cosine distance, maximum', value: '0.35' },
                { label: 'Lock confirmation', value: '5 consecutive frames' },
                { label: 'Standoff setpoint', value: '1.40 m' },
                { label: 'Standoff deadband', value: '±0.15 m' },
                { label: 'Kp linear', value: '0.42' },
                { label: 'Kp angular', value: '0.0038' },
                { label: 'Speed ceiling', value: '0.22 m/s — applied after the controller' },
                { label: 'Lost-target timeout', value: '0.5 s' },
                { label: 'Minimum depth samples in box', value: '180 px' },
            ]}
            bench={[
                { label: 'Lock retained', value: '92.4 %' },
                { label: 'Wrong re-locks', value: '1', imperfect: true },
                { label: 'Mean standoff error', value: '0.11 m' },
                { label: 'Protective halts', value: '3' },
            ]}
            trace={wobble(120, 1.4, 0.09, [{ at: 58, mag: 0.42 }])}
            traceUnit="m standoff"
            traceBand={[1.25, 1.55]}
            traceCaption={
                <>
                    Standoff distance over a four-minute follow. The band is the deadband; inside it the
                    controller commands nothing, which is why the trace is flat rather than hunting. The
                    single excursion at the two-minute mark is the target turning a corner: the robot falls
                    to 1.82 m because the speed ceiling will not let it close faster, then recovers over
                    about four seconds. That lag is the cap working as intended, not a tuning problem.
                </>
            }
            extra={
                <div className="rounded-xl border border-fault/30 bg-fault/5 p-5">
                    <h2 className="text-title font-bold text-text mb-3">Why this one is treated differently</h2>
                    <p className="text-body text-textMuted leading-relaxed mb-3">
                        The other three projects fail into a wall, a stopped robot, or a skipped waypoint.
                        This one fails towards a person, and it does so while moving in the direction of
                        someone who has not consented to be followed. Every parameter above is biased
                        towards stopping rather than towards succeeding.
                    </p>
                    <ul className="space-y-2 list-none p-0 m-0">
                        {[
                            'The speed ceiling sits after the controller, so no gain change can raise it.',
                            'The lost-target path halts and requires a human to restart; it cannot re-target.',
                            'The re-ID threshold is deliberately tight, which trades reacquisition for identity.',
                            'The standoff deadband is wide, so the robot spends most of its time commanding nothing.',
                        ].map(t => (
                            <li key={t} className="flex gap-2 text-body text-textMuted leading-relaxed">
                                <span className="text-fault shrink-0" aria-hidden="true">•</span>{t}
                            </li>
                        ))}
                    </ul>
                </div>
            }
            failures={[
                {
                    title: 'The wrong re-lock: two people, dark jackets, 0.31 and 0.33',
                    detail:
                        'The single failed re-lock happened when the target passed a second person in similar dark clothing under low corridor lighting. Both embeddings scored inside the 0.35 threshold — 0.31 for the correct person and 0.33 for the other — and the higher-scoring match was the wrong one. Tightening the threshold would have produced a halt instead, which is the outcome this system should prefer, and would also raise the halt rate on the 92.4 % that currently work.',
                },
                {
                    title: 'Depth drops out on dark clothing',
                    detail:
                        'The structured-light projector gets little back from black fabric, so the depth median inside the box is computed from the few hundred pixels of face and hands that do return. Standoff becomes noisy exactly when the person is wearing the thing that also defeats re-ID, and the two failures correlate rather than covering for each other.',
                },
                {
                    title: 'Turning away shifts the embedding',
                    detail:
                        'The stored embedding is captured from a front view. When the target turns a corner the appearance changes enough to push cosine distance towards the threshold, which is why the trace excursion and the near-misses both cluster at corners. Storing several embeddings across viewpoints during the lock confirmation would reduce it and is not implemented.',
                },
            ]}
        />
    );
}
