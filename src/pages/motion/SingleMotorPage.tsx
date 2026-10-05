import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure } from '../../components/ui/Viz';
import { DutyResponse, MotorTrace } from '../../components/ui/MotorViz';
import { LivePanel } from '../../components/layout/LivePanel';
import { MOTOR, deadbandDuty, rpmForDuty, liveSingleMotor } from '../../lib/liveFrames';

export function SingleMotorPage() {
    return (
        <AppPage
            route="/motion/single-motor"
            summary="One brushed gearmotor driven open loop: a PWM duty cycle goes in, a shaft speed comes out. Everything built on top of it — differential drive, odometry, Nav2 — quietly assumes that mapping is proportional and repeatable. It is neither, and the two places it breaks are visible on a bench in about a minute."
            facts={[
                { label: 'Supply', value: '12 V, 20 kHz PWM' },
                { label: 'Deadband', value: `${Math.round(deadbandDuty() * 100)}% duty (0.40 A)` },
                { label: 'Full duty', value: `${MOTOR.RPM_FULL} rpm out` },
                { label: 'Stall', value: '2.2 A — driver rated 1.2 A' },
            ]}
        >
            <Panel title="Duty is not speed">
                <Figure
                    title="Output speed against duty cycle, swept in 5% steps on two floors"
                    caption={
                        <>
                            Two things are wrong with the dashed line, and both matter. Below {Math.round(deadbandDuty() * 100)}%
                            duty the motor turns at zero rpm while drawing 0.27 A — it is energised, warming, and
                            stationary, because 12 V across 5.4 Ω cannot produce the 0.40 A of winding current the
                            gearbox needs to break stiction. Above that the response is linear but its slope depends
                            on the floor: the same 50% duty gives 90 rpm on sealed concrete and 55 rpm on carpet
                            tile. Check it by ear rather than by eye — set 12% duty and the motor hums audibly
                            without the shaft moving, which is the single most useful thing to have heard before
                            writing a controller.
                        </>
                    }
                >
                    <DutyResponse
                        topRpm={MOTOR.RPM_FULL}
                        curves={[
                            { label: 'sealed concrete', rpm: d => rpmForDuty(d, 'hard'), deadband: deadbandDuty('hard'), tone: 'live' },
                            { label: 'carpet tile', rpm: d => rpmForDuty(d, 'carpet'), deadband: deadbandDuty('carpet'), tone: 'stream' },
                        ]}
                    />
                </Figure>
            </Panel>

            <LivePanel
                hz={12}
                rateLabel="50 Hz on the real controller"
                readout={tick => {
                    const { frame } = liveSingleMotor(tick);
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Duty', v: `${(frame.duty * 100).toFixed(0)} %` },
                                { k: 'Output', v: `${frame.rpm.toFixed(1)} rpm` },
                                { k: 'Current', v: `${frame.amps.toFixed(3)} A` },
                                { k: 'State', v: frame.stalled ? 'Stalled' : frame.rpm > 0 ? 'Turning' : 'Idle' },
                            ].map(x => (
                                <div key={x.k}
                                    className={`rounded-xl border px-4 py-3 ${x.k === 'State' && frame.stalled
                                        ? 'border-fault/40 bg-fault/5' : 'border-border/60 bg-card/60'}`}>
                                    <dt className="text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{x.k}</dt>
                                    <dd className={`text-body font-mono font-bold m-0 tabular-nums ${x.k === 'State' && frame.stalled ? 'text-fault' : 'text-text'}`}>
                                        {x.v}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    );
                }}
            >
                {tick => {
                    const { frames, index } = liveSingleMotor(tick);
                    return <MotorTrace frames={frames} index={index} />;
                }}
            </LivePanel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Part', value: 'JGA25-371 brushed DC gearmotor, 12 V' },
                            { label: 'Gearbox', value: '1:34 spur, 6 mm output shaft' },
                            { label: 'No-load output speed', value: `${MOTOR.RPM_FULL} rpm measured at 12.0 V` },
                            { label: 'Terminal resistance', value: '5.4 Ω — the number the deadband comes from' },
                            { label: 'Breakaway current', value: '0.40 A on concrete, 0.60 A on carpet tile' },
                            { label: 'Driver', value: 'TB6612FNG H-bridge, 1.2 A continuous, 3.2 A peak' },
                            { label: 'PWM', value: '20 kHz, 11-bit resolution' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The 20 kHz carrier is chosen for two unrelated reasons. It is above hearing, so the robot
                        does not whine; and its 50 µs period is far shorter than the winding's 0.6 ms electrical
                        time constant, so the current barely ripples and the motor responds to the average voltage
                        rather than the switching. That second reason is why a single straight line can describe
                        the response at all. At 1 kHz the same fit still holds, but the ripple current heats the
                        winding for no mechanical work and the gearbox sings.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'sub', topic: '/motor/duty', type: 'std_msgs/Float32', rate: '20 Hz' },
                            { dir: 'pub', topic: '/joint_states', type: 'sensor_msgs/JointState', rate: '50 Hz' },
                        ]}
                        note={
                            <>
                                Read the second row carefully. The velocity field is computed from the commanded duty
                                through the curve above — it is a model output wearing the type signature of a
                                measurement, and nothing on this motor can contradict it. Jam the shaft with a finger
                                and the topic keeps reporting the speed it believes. Every subscriber downstream,
                                including <span className="font-mono">robot_state_publisher</span>, will build on that
                                number without any way to know. Closing that gap takes one more wire, and that is the
                                third app in this section.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'The slow command is the dangerous one',
                        detail:
                            'A duty below 18% puts 0.27 A through a stationary winding. There is no rotation, so there is no fan effect and no airflow over the can, and all of that power becomes heat in a part designed to be cooled by its own movement. A controller that creeps toward a setpoint by reducing duty therefore spends its longest intervals in the one state that damages the motor, and because nothing is turning there is no sound or movement to suggest anything is happening. Clamp the output to zero below the deadband rather than letting it ramp through it.',
                    },
                    {
                        title: '"Stop" means two different distances',
                        detail:
                            'Setting duty to zero with both H-bridge inputs low disconnects the winding and the motor coasts; setting both inputs high shorts the winding across itself and the back-EMF brakes it hard. On this gearbox that is the difference between roughly 40 cm of roll-on and roughly 4 cm, decided by one register write that no part of the ROS graph can see. Pick one deliberately and know which you picked, because an emergency stop that coasts is not a stop.',
                    },
                    {
                        title: 'The driver gives out before the motor does',
                        detail:
                            'Stall current is 2.2 A and the TB6612FNG is rated 1.2 A continuous per channel, so a wheel held against a wall at full duty is outside the driver\'s envelope long before it is outside the motor\'s. The failure is thermal shutdown, which is silent and self-clearing: the output stops, the package cools, the output comes back. From the outside that reads as an intermittent connector or a flaky power rail, and people replace both before suspecting the part that is actually protecting itself correctly.',
                    },
                ]}
            />
        </AppPage>
    );
}
