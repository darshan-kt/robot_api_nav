import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure } from '../../components/ui/Viz';
import { OpenLoopDrift, DifferentialView } from '../../components/ui/MotorViz';
import { LivePanel } from '../../components/layout/LivePanel';
import { MOTOR, liveDualMotors } from '../../lib/liveFrames';

/** The straight-line test: both wheels commanded 0.300 m/s, the right one 4% fast. */
const TEST = { vL: 0.300, vR: 0.312, arcLenM: 3.0 };

export function DualMotorsPage() {
    return (
        <AppPage
            route="/motion/dual-motors"
            summary="Two of the same motor on one chassis. Forward speed is their average and turn rate is their difference, which is the whole of differential-drive kinematics and takes one line of algebra. The hard part is that nothing here measures a wheel, so a command is a hope — and two gearmotors off the same reel are different enough that the first thing to look at is a straight line that is not straight."
            facts={[
                { label: 'Track width', value: `${(MOTOR.TRACK_M * 1000).toFixed(0)} mm` },
                { label: 'Drive', value: 'Differential, open loop' },
                { label: 'Speed match', value: '4.1% at equal duty' },
                { label: 'After 3 m', value: '1.05 m off, 42° round' },
            ]}
        >
            <Panel title="Equal duty is not a straight line">
                <Figure
                    title="Both wheels commanded 53% duty for three metres of travel"
                    caption={
                        <>
                            Nothing is broken here. Both motors received the identical duty, both are working
                            correctly, and the right one happens to run 4% faster — comfortably inside what two
                            units from the same batch differ by. That 12 mm/s of difference across a 160 mm track
                            is 0.075 rad/s of unwanted rotation, which over ten seconds of driving integrates into
                            a 4.08 m arc: the robot finishes 1.05 m to one side and pointing 42° away from where it
                            started. Worth running in the lab, because the number is larger than anyone guesses —
                            tape a 3 m line, command both wheels together, and measure where the robot actually
                            stops.
                        </>
                    }
                >
                    <OpenLoopDrift vL={TEST.vL} vR={TEST.vR} trackM={MOTOR.TRACK_M} arcLenM={TEST.arcLenM} />
                </Figure>
            </Panel>

            <LivePanel
                hz={12}
                rateLabel="20 Hz /cmd_vel"
                readout={tick => {
                    const f = liveDualMotors(tick);
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Commanded ω', v: `${f.cmdW.toFixed(3)} rad/s`, bad: false },
                                { k: 'Actual ω', v: `${f.w.toFixed(3)} rad/s`, bad: Math.abs(f.w - f.cmdW) > 0.02 },
                                { k: 'Wheel duty', v: `${Math.round(f.dutyL * 100)} / ${Math.round(f.dutyR * 100)} %`, bad: false },
                                { k: 'Heading drift', v: `${f.driftDegS > 0 ? '+' : ''}${f.driftDegS} °/s`, bad: Math.abs(f.driftDegS) > 1 },
                            ].map(x => (
                                <div key={x.k}
                                    className={`rounded-xl border px-4 py-3 ${x.bad ? 'border-warning/40 bg-warning/5' : 'border-border/60 bg-card/60'}`}>
                                    <dt className="text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{x.k}</dt>
                                    <dd className={`text-body font-mono font-bold m-0 tabular-nums ${x.bad ? 'text-warning' : 'text-text'}`}>
                                        {x.v}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    );
                }}
            >
                {tick => {
                    const f = liveDualMotors(tick);
                    return <DifferentialView vL={f.vL} vR={f.vR} trackM={MOTOR.TRACK_M} label={f.label} />;
                }}
            </LivePanel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Motors', value: '2 × JGA25-371, 1:34, 12 V' },
                            { label: 'Driver', value: 'TB6612FNG dual H-bridge, one channel per wheel' },
                            { label: 'Wheel', value: `65 mm diameter, ${(MOTOR.WHEEL_CIRCUM_M * 1000).toFixed(1)} mm circumference` },
                            { label: 'Track width', value: `${(MOTOR.TRACK_M * 1000).toFixed(0)} mm, contact patch to contact patch` },
                            { label: 'Speed match at 53% duty', value: '4.1% over 20 trials, right motor fast' },
                            { label: 'Speed match at 30% duty', value: '11% — the spread widens as duty falls' },
                            { label: 'Feedback', value: 'None' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The two matching figures are the useful part, and the fact that they differ is the reason a
                        single trim constant does not work. Near the deadband the usable duty range is small, and
                        two motors differ in breakaway current by more than they differ in running friction — so
                        their deadbands land a couple of percent of duty apart, and at 30% duty a couple of percent
                        is a sizeable fraction of everything above the threshold. Trim calibrated while driving
                        fast is wrong while driving slowly, which is exactly when a robot is placing itself.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'sub', topic: '/cmd_vel', type: 'geometry_msgs/Twist', rate: '20 Hz' },
                            { dir: 'pub', topic: '/wheel_duty', type: 'std_msgs/Float32MultiArray', rate: '20 Hz' },
                            { dir: 'pub', topic: '/joint_states', type: 'sensor_msgs/JointState', rate: '50 Hz' },
                        ]}
                        note={
                            <>
                                The third row is the most expensive thing in this kit. It carries the commanded wheel
                                velocity with the correct type and the correct rate, so anything downstream will
                                subscribe to it happily and <span className="font-mono">robot_state_publisher</span> will
                                build a TF tree on top of it. Every drift in the figure above is invisible to all of
                                them: the arc happens in the room while the topic reports a straight line. Publishing a
                                command on a feedback topic is worse than publishing nothing, because nothing is at
                                least honest about what it does not know.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'The mismatch is not a constant, so trim does not fix it',
                        detail:
                            'The 4% is a measurement at one voltage, one temperature and one direction of travel, and it moves with all three. A per-motor trim calibrated on a freshly charged pack is wrong by the end of a session as the rail sags, wrong again once the gearboxes warm and their grease thins, and wrong in reverse because brush contact is not symmetric. Trim converts a consistent error you could have characterised into an inconsistent one you cannot, which is why the honest fix is feedback rather than a better constant.',
                    },
                    {
                        title: 'One battery couples the two wheels together',
                        detail:
                            'Both H-bridge channels sit on one pack with real internal resistance. When one wheel climbs a cable or catches a carpet edge its current rises, the rail drops a few hundred millivolts, and the other wheel slows too even though nothing asked it to. The robot answers a one-wheel disturbance by changing both wheels, and open loop there is nothing in the system that can observe either half of that.',
                    },
                    {
                        title: 'Small heading corrections are the least reliable command',
                        detail:
                            'A pivot asks both motors for equal and opposite speeds, so a slow pivot asks both to sit just above breakaway at once. Below roughly 30% duty one motor reliably breaks free before the other, and for a few hundred milliseconds the robot arcs on one wheel instead of spinning about its centre. The practical consequence is that the smallest heading change you ask for is the one you are least likely to get, and asking for it repeatedly accumulates position error rather than correcting it.',
                    },
                ]}
            />
        </AppPage>
    );
}
