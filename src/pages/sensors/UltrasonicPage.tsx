import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure, BeamCones } from '../../components/ui/Viz';

export function UltrasonicPage() {
    return (
        <AppPage
            route="/sensors/ultrasonic"
            summary="Covers the band the scanner is blind to. The lidar returns one horizontal slice at mounting height; these four transducers look at the floor in front of the robot, which is where a kerb, a step, a dropped box or a pallet fork actually is."
            facts={[
                { label: 'Output', value: '4 × /range_* @ 12 Hz' },
                { label: 'Working range', value: '0.02 – 4.0 m' },
                { label: 'Beam width', value: '15° cone' },
                { label: 'Transducers', value: '4, at ±20° and ±60°' },
            ]}
        >
            <Panel title="Beam coverage">
                <Figure
                    title="One reading cycle — beam cones at true angular width"
                    caption={
                        <>
                            Each cone is drawn at the transducer's real 15° beam width, and the arc across it
                            is where that transducer heard its echo. The front-right unit shows no echo at
                            all, and that is rendered as an absence rather than as a reading at maximum
                            range — the distinction matters, because a stale 4.0 m in a Range message is
                            indistinguishable from "clear" to anything downstream. Note how little of the
                            forward arc four 15° cones actually cover: between them are gaps a chair leg fits
                            through.
                        </>
                    }
                >
                    <BeamCones
                        beamDeg={15}
                        maxM={3}
                        transducers={[
                            { name: 'front-left', mountDeg: -60, echoM: 0.62 },
                            { name: 'centre-left', mountDeg: -20, echoM: 1.85 },
                            { name: 'centre-right', mountDeg: 20, echoM: null },
                            { name: 'front-right', mountDeg: 60, echoM: 0.41 },
                        ]}
                    />
                </Figure>
            </Panel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Part', value: '4 × HC-SR04' },
                            { label: 'Sensing technique', value: '40 kHz acoustic time-of-flight, separate transmit and receive capsules' },
                            { label: 'Resolution', value: '3 mm' },
                            { label: 'Accuracy at 0.5 m', value: '±9 mm' },
                            { label: 'Accuracy at 2.5 m', value: '±31 mm' },
                            { label: 'Interface', value: 'GPIO trigger/echo pair per unit, 5 V logic, level-shifted to 3.3 V' },
                            { label: 'Power draw', value: '15 mA per unit while ranging' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        Speed of sound is temperature-dependent — roughly 0.17 % per °C. The driver assumes
                        20 °C, so a unit run in a cold warehouse reads a few centimetres long at the far end of
                        its range. That is inside the error budget for obstacle stopping and would not be for
                        anything trying to measure.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'pub', topic: '/range_front_left', type: 'sensor_msgs/Range', rate: '12 Hz' },
                            { dir: 'pub', topic: '/range_centre_left', type: 'sensor_msgs/Range', rate: '12 Hz' },
                            { dir: 'pub', topic: '/range_centre_right', type: 'sensor_msgs/Range', rate: '12 Hz' },
                            { dir: 'pub', topic: '/range_front_right', type: 'sensor_msgs/Range', rate: '12 Hz' },
                        ]}
                        note={
                            <>
                                Bandwidth is negligible; the cost here is time, not bytes. Each ping has to wait
                                for its own echoes to decay before the next transducer fires — about 60 ms — so
                                four units in sequence cap the array at roughly 12 Hz. Firing them together would
                                be four times faster and produces cross-talk, which is worse than being slow. At
                                0.4 m/s the robot travels 33 mm between full cycles.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'Soft material absorbs the pulse',
                        detail:
                            'A curtain, an upholstered chair back, a stack of clothing or acoustic foam absorbs most of a 40 kHz pulse instead of reflecting it. The transducer times out with no echo, which is the same output it gives for an empty corridor. The obstacle most likely to be missed is the one softest to hit, which is a poor trade in a building with people in it.',
                    },
                    {
                        title: 'Oblique surfaces bounce the pulse away',
                        detail:
                            'Ultrasound reflects specularly at these wavelengths. A flat wall approached at more than about 30° off normal sends the pulse off to one side and none of it returns, so a corridor taken at an angle reads as open until the robot is nearly square to the wall. Corners are the reverse problem: they retro-reflect strongly and read closer than the nearest actual surface.',
                    },
                    {
                        title: 'Cross-talk between transducers',
                        detail:
                            'All four units transmit at the same frequency, so one can hear another\'s echo and report it as its own. Sequential firing is what prevents it, which means any change that speeds the array up reintroduces it. The signature is a phantom near-field return on one channel that appears only while a neighbouring channel sees a strong close reflector.',
                    },
                ]}
            />
        </AppPage>
    );
}
