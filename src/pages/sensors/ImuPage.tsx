import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure, AxisBars } from '../../components/ui/Viz';
import { LivePanel } from '../../components/layout/LivePanel';
import { liveImu } from '../../lib/liveFrames';

export function ImuPage() {
    return (
        <AppPage
            route="/sensors/imu"
            summary="Reports which way the robot is pointing without asking the wheels. Odometry derives heading by integrating wheel rotation, so every slip, every carpet edge and every spin-in-place bleeds into it permanently — the IMU is the only source of orientation that does not accumulate that error."
            facts={[
                { label: 'Output', value: '/imu @ 100 Hz' },
                { label: 'Fusion', value: 'On-chip, NDOF mode' },
                { label: 'Gyro range', value: '±2000 °/s' },
                { label: 'Accel range', value: '±16 g' },
            ]}
        >
            <Panel title="Stationary and level">
                <Figure
                    title="Three axes per sub-sensor, robot at rest on a flat floor"
                    caption={
                        <>
                            This is the one case a reader can check by eye, which is why it is the one drawn.
                            Accelerometer z should read one g and the other two should read near zero — 9.79
                            rather than 9.81 is local gravity plus a small mounting tilt, and is normal.
                            Gyro should read zero on all three; the residual thousandths are bias, and that
                            bias is what a stationary robot slowly rotates by if nothing gates it.
                            Magnetometer x and z are large and y is near zero because the board sits with its
                            y-axis across the chassis — the field it reads is mostly the Earth's, tilted by
                            magnetic inclination.
                        </>
                    }
                >
                    <AxisBars
                        groups={[
                            { label: 'Accelerometer', unit: 'm/s²', span: 12, values: [0.04, -0.02, 9.79] },
                            { label: 'Gyroscope', unit: 'rad/s', span: 0.02, values: [0.001, -0.002, 0.0], decimals: 3 },
                            { label: 'Magnetometer', unit: 'µT', span: 60, values: [21.3, 2.4, -43.1] },
                        ]}
                    />
                </Figure>
            </Panel>

            <LivePanel
                hz={12}
                rateLabel="100 Hz on the real device"
                readout={tick => {
                    const f = liveImu(tick);
                    const yawRate = f.gyro[2];
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Yaw rate', v: `${yawRate.toFixed(4)} rad/s` },
                                { k: 'Accel magnitude', v: `${Math.hypot(...f.accel).toFixed(3)} m/s²` },
                                { k: 'Frame', v: `#${tick}` },
                                { k: 'Topic', v: '/imu' },
                            ].map(x => (
                                <div key={x.k} className="rounded-xl border border-border/60 bg-card/60 px-4 py-3">
                                    <dt className="text-meta font-mono uppercase tracking-widest text-textMuted mb-1">{x.k}</dt>
                                    <dd className="text-body font-mono font-bold text-text m-0 tabular-nums">{x.v}</dd>
                                </div>
                            ))}
                        </dl>
                    );
                }}
            >
                {tick => {
                    const f = liveImu(tick);
                    return (
                        <AxisBars
                            groups={[
                                { label: 'Accelerometer', unit: 'm/s²', span: 12, values: f.accel },
                                { label: 'Gyroscope', unit: 'rad/s', span: 0.02, values: f.gyro, decimals: 4 },
                                { label: 'Magnetometer', unit: 'µT', span: 60, values: f.mag },
                            ]}
                        />
                    );
                }}
            </LivePanel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Part', value: 'Bosch BNO055' },
                            { label: 'Sensing technique', value: 'MEMS accelerometer + gyroscope + magnetometer, fused on a Cortex-M0 in package' },
                            { label: 'Resolution', value: '14-bit accelerometer, 16-bit gyroscope' },
                            { label: 'Heading accuracy, calibrated', value: '±2.5° typical' },
                            { label: 'Heading accuracy, near the motors', value: '±11° observed, direction-dependent' },
                            { label: 'Interface', value: 'I²C at address 0x28, 400 kHz' },
                            { label: 'Power draw', value: '≈ 40 mW in NDOF mode (12.3 mA at 3.3 V)' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The fusion running in-package is the reason this part is used rather than a cheaper
                        6-axis: it outputs an orientation quaternion directly, so the host is not responsible
                        for a filter. The cost is that the fusion is a black box — when the heading is wrong,
                        there is no intermediate state to inspect.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'pub', topic: '/imu', type: 'sensor_msgs/Imu', rate: '100 Hz' },
                            { dir: 'pub', topic: '/imu/mag', type: 'sensor_msgs/MagneticField', rate: '20 Hz' },
                        ]}
                        note={
                            <>
                                A few kilobytes per second — the cheapest sensor on the platform by a wide margin.
                                The subscriber that matters is the odometry filter, which fuses this yaw against
                                wheel odometry. When the IMU stops, that filter falls back to wheel-only heading
                                and the error becomes unbounded on any surface where the wheels can slip, which
                                shows up as the map slowly rotating during a long run.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'The robot\'s own motors distort the magnetometer',
                        detail:
                            'Drive current through the motors and their leads produces a field at the board that is larger than the Earth\'s and changes with throttle. Heading is then a function of how hard the robot is accelerating, which is exactly when a correct heading matters most. It presents as yaw that is stable while parked and swings several degrees the moment the robot moves off.',
                    },
                    {
                        title: 'Gyro bias tracks temperature',
                        detail:
                            'The zero-rate offset moves as the board warms from ambient to its operating temperature, typically over the first ten to fifteen minutes after power-on. A robot calibrated cold and driven warm accumulates yaw drift in one consistent direction, so a square patrol route closes a few degrees off and the error repeats every lap.',
                    },
                    {
                        title: 'Chassis vibration aliases into the accelerometer band',
                        detail:
                            'Wheel and gearbox resonance lands in the same frequency range the accelerometer samples. On a hard floor at speed this folds into the fused output as tilt that is not there, which the filter then partially believes. The tell is orientation noise that scales with drive speed and disappears the moment the robot stops.',
                    },
                ]}
            />
        </AppPage>
    );
}
