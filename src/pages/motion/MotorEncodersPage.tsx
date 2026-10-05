import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure } from '../../components/ui/Viz';
import { QuadratureFigure, EncoderView } from '../../components/ui/MotorViz';
import { LivePanel } from '../../components/layout/LivePanel';
import { MOTOR, liveEncoder } from '../../lib/liveFrames';

const COUNTS_M = Math.round(MOTOR.COUNTS_PER_M);
/** Velocity quantum: one count inside one 20 ms control period. */
const QUANTUM = 1 / (MOTOR.COUNTS_PER_M * 0.02);

export function MotorEncodersPage() {
    return (
        <AppPage
            route="/motion/motor-encoders"
            summary="The same motor with two more wires back from the shaft. That one addition turns every open-loop guess on the previous two pages into a measurement: the controller can hold a speed it was asked for across a floor it was not told about, and the robot can finally publish an /odom that AMCL and Nav2 are entitled to believe."
            facts={[
                { label: 'Counts per rev', value: `${MOTOR.COUNTS_PER_REV} (11 × 4 × 34)` },
                { label: 'Resolution', value: `${COUNTS_M} counts/m · 0.137 mm` },
                { label: 'Loop', value: 'PI at 50 Hz' },
                { label: 'Velocity quantum', value: `${QUANTUM.toFixed(4)} m/s` },
            ]}
        >
            <Panel title="Two channels, four counts, one direction">
                <Figure
                    title="Channels A and B a quarter-period apart, and the count they drive"
                    caption={
                        <>
                            A single channel can only tell you something moved. The second channel, offset 90°, is
                            what makes the signal directional: the two bits step through 10 → 11 → 01 → 00 going
                            forward and through the same four states in the opposite order going back, so every
                            transition carries a sign as well as a tick. Counting all four transitions rather than
                            just the rising edges of A is also where the resolution comes from — 11 pulses per motor
                            revolution becomes 44 counts, and the 1:34 gearbox makes that {MOTOR.COUNTS_PER_REV} counts
                            per turn of the wheel. One bench check settles whether the decoder is right: turn the
                            wheel one full revolution by hand and read the total. {MOTOR.COUNTS_PER_REV} means all
                            four edges are counted; {MOTOR.COUNTS_PER_REV / 4} means only one is, and every distance
                            the robot reports will be a quarter of the truth.
                        </>
                    }
                >
                    <QuadratureFigure cycles={4} />
                </Figure>
            </Panel>

            <LivePanel
                hz={12}
                rateLabel="50 Hz control period"
                readout={tick => {
                    const { frame } = liveEncoder(tick);
                    const err = frame.cmd - frame.meas;
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Commanded', v: `${frame.cmd.toFixed(2)} m/s`, bad: false },
                                { k: 'Measured', v: `${frame.meas.toFixed(3)} m/s`, bad: false },
                                { k: 'Error', v: `${err >= 0 ? '+' : ''}${err.toFixed(3)} m/s`, bad: Math.abs(err) > 0.02 },
                                { k: 'Duty held', v: `${(frame.duty * 100).toFixed(0)} %`, bad: false },
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
                    const { frame, phase, cyclesPerS } = liveEncoder(tick);
                    return (
                        <EncoderView
                            phase={phase}
                            cmd={frame.cmd}
                            meas={frame.meas}
                            duty={frame.duty}
                            floor={frame.floor}
                            countsPerPeriod={frame.countsPerPeriod}
                            cyclesPerS={cyclesPerS}
                        />
                    );
                }}
            </LivePanel>

            <Panel title="What the loop found out on its own">
                <p className="text-body text-textMuted leading-relaxed max-w-3xl">
                    Watch the moment the floor label changes to carpet. The commanded speed does not move, the
                    measured speed dips about 10%, and the duty bar climbs from 53% to 65% and stays there until the
                    speed is back where it was asked to be. That 65% is the interesting number: it is exactly the
                    duty the carpet curve on the Single motor page predicts for 0.30 m/s. The controller was never
                    told which floor it was on and has no model of either — it found that operating point from
                    nothing but counted edges and an integral term. The open-loop version of this robot would have
                    simply slowed down and reported that it had not.
                </p>
            </Panel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Encoder', value: 'Magnetic quadrature on the motor shaft, 11 pulses per channel per revolution' },
                            { label: 'Decoding', value: 'Both edges of both channels — ×4, so 44 counts per motor revolution' },
                            { label: 'Counts per wheel revolution', value: `${MOTOR.COUNTS_PER_REV}` },
                            { label: 'Counts per metre', value: `${COUNTS_M} on a 65 mm wheel` },
                            { label: 'Linear resolution', value: '0.137 mm per count' },
                            { label: 'Decoder', value: 'RP2040 PIO state machine, one per wheel' },
                            { label: 'Control period', value: '20 ms, PI with a clamped integral' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The decoder runs in PIO rather than on GPIO interrupts for a reason worth knowing. At the
                        platform's top speed each wheel emits about 5,100 counts per second, so two wheels put
                        roughly 10,300 edges per second in front of the CPU. An interrupt per edge is survivable
                        until something else wants the core — the radio stack, a flash write — and then counts are
                        simply lost. Nothing reports that: the position is quietly wrong from then on, and it stays
                        wrong, because there is no absolute reference to recover against. Counting in hardware moves
                        that failure out of the software's reach entirely.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'sub', topic: '/cmd_vel', type: 'geometry_msgs/Twist', rate: '20 Hz' },
                            { dir: 'pub', topic: '/joint_states', type: 'sensor_msgs/JointState', rate: '50 Hz' },
                            { dir: 'pub', topic: '/odom', type: 'nav_msgs/Odometry', rate: '50 Hz' },
                        ]}
                        note={
                            <>
                                Now <span className="font-mono">/joint_states</span> carries a measurement rather than a
                                command, which is the single difference between this page and the previous one — and it
                                is what earns the right to publish <span className="font-mono">/odom</span> at all. Be
                                careful with the covariance on it. AMCL uses this as a motion model weighted by the
                                confidence you declare, so an over-confident covariance on a wheel that can slip is
                                worse than no odometry: the filter trusts the dead reckoning and begins discounting the
                                laser scan that was about to correct it. The IMU in the Perception kit is the other half
                                of this — take heading from there and distance from these counts, and neither sensor's
                                failure mode is load-bearing on its own.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'Counts measure the motor, not the floor',
                        detail:
                            'The encoder is on the motor shaft, ahead of the wheel and the surface entirely. A wheel spinning freely on spilled water or lifted off the ground reports brisk, confident, perfectly consistent forward progress, and because the signal looks healthy there is nothing in it to flag. This is the failure that puts a robot on the wrong side of a map in a few seconds, and no amount of encoder resolution helps: the fix is cross-checking distance against a sensor that watches the room rather than the shaft.',
                    },
                    {
                        title: 'Swapped encoder cables survive a straight-line test',
                        detail:
                            'Exchange the two encoder connectors while leaving the motor wiring alone and driving straight works perfectly — both wheels run at the same speed, so it does not matter which controller reads which. The fault appears only when the wheels differ: each wheel\'s loop is now correcting on the other wheel\'s error, which is positive feedback, and a gentle commanded turn becomes a tightening spiral. Because the symptom is turn-only and the obvious tests are straight-line, this one usually ships.',
                    },
                    {
                        title: 'Differentiating counts over too short a window',
                        detail:
                            `One count inside the 20 ms control period is ${QUANTUM.toFixed(4)} m/s, which is fine. Shorten the window to 1 ms to get a "faster" velocity estimate and the same single count becomes 0.137 m/s of pure quantisation noise, which a PI loop faithfully amplifies into duty chatter you can hear from across the room. The instinct is to add filtering or back off the gains; the actual fix is to count over a fixed, long-enough period, because the problem is the measurement and not the controller.`,
                    },
                ]}
            />
        </AppPage>
    );
}
