import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure, DepthEnvelope } from '../../components/ui/Viz';

export function AstraProPage() {
    return (
        <AppPage
            route="/sensors/astra-pro"
            summary="Gives the robot a distance for every pixel. The scanner knows the range to things at one height; the Astra is the only sensor on the platform that knows the shape of what is in front of it, which is what lets the robot see a table top, a step, or a box on the floor."
            facts={[
                { label: 'Depth', value: '640 × 480 @ 30 fps' },
                { label: 'Colour', value: '1280 × 720 @ 30 fps' },
                { label: 'Working range', value: '0.6 – 8.0 m' },
                { label: 'Depth FOV', value: '60° H × 49.5° V' },
            ]}
        >
            <Panel title="Usable envelope">
                <Figure
                    title="Side elevation, depth validity by range"
                    caption={
                        <>
                            Below 0.6 m the projected pattern is out of focus for the offset IR camera and the
                            sensor returns zeros — not "close", but the same value it returns for sky. Between
                            0.6 and 4.0 m the factory calibration holds and error stays near the millimetre
                            scale. Past 4.0 m the pattern is spread thin enough that error grows roughly with
                            the square of range, so the far band is usable for "something is over there" and
                            not for measuring it.
                        </>
                    }
                >
                    <DepthEnvelope
                        vfovDeg={49.5}
                        maxM={8}
                        bands={[
                            { from: 0, to: 0.6, label: 'dead zone — returns 0', kind: 'dead' },
                            { from: 0.6, to: 4.0, label: 'calibrated', kind: 'calibrated' },
                            { from: 4.0, to: 8.0, label: 'degraded', kind: 'degraded' },
                        ]}
                    />
                </Figure>
            </Panel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Part', value: 'Orbbec Astra Pro' },
                            { label: 'Sensing technique', value: 'Structured light — IR dot pattern, offset IR camera, disparity per pixel' },
                            { label: 'Depth resolution', value: '640 × 480, 16-bit millimetres' },
                            { label: 'Accuracy at 1.0 m', value: '±1.4 mm' },
                            { label: 'Accuracy at 4.0 m', value: '±21 mm' },
                            { label: 'Interface', value: 'USB 2.0 — two independent identities (UVC colour, OpenNI2 depth)' },
                            { label: 'Power draw', value: '2.4 W typical, 5 V bus-powered' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The two accuracy figures matter more than either alone: the error roughly quadruples
                        between 1 m and 4 m, which is why the navigation stack treats this as a near-field sensor
                        and leaves anything past 4 m to the scanner.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'pub', topic: '/camera/color/image_raw', type: 'sensor_msgs/Image', rate: '30 Hz' },
                            { dir: 'pub', topic: '/camera/color/camera_info', type: 'sensor_msgs/CameraInfo', rate: '30 Hz' },
                            { dir: 'pub', topic: '/camera/depth/image_raw', type: 'sensor_msgs/Image', rate: '30 Hz' },
                            { dir: 'pub', topic: '/camera/depth/camera_info', type: 'sensor_msgs/CameraInfo', rate: '30 Hz' },
                            { dir: 'pub', topic: '/camera/depth_registered/points', type: 'sensor_msgs/PointCloud2', rate: '30 Hz' },
                        ]}
                        note={
                            <>
                                Raw depth alone is 640 × 480 × 2 bytes at 30 fps — about 18.4 MB/s before the
                                colour stream, and the registered point cloud is several times that again. On the
                                Pi 5 this is the single most expensive thing on the bus, which is why the point
                                cloud is left unsubscribed unless something needs it. Nothing in the navigation
                                stack subscribes by default; when the camera stops, Nav2 is unaffected and only
                                the perception nodes go quiet.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'Direct sunlight swamps the projector',
                        detail:
                            'The sensor recovers depth by finding its own IR dots in the scene. Outdoors, or on a floor under a south-facing window, broadband IR in sunlight raises the noise floor above the pattern and whole regions return zero. The failure is not graceful degradation to a noisier reading — it is a hole in the depth image exactly where the light is brightest.',
                    },
                    {
                        title: 'Glass and gloss return nothing, which reads as open floor',
                        detail:
                            'A glass door reflects the dot pattern away from the camera rather than scattering it back, so those pixels come back as zero — the same value as "too close" and as "out of range". Consumed naively, a corridor with a glass wall looks like a corridor with no wall. Anything downstream has to treat zero as unknown rather than as free space.',
                    },
                    {
                        title: 'Colour enumerates and depth does not',
                        detail:
                            'The camera presents two separate USB identities: a standard UVC device for colour, and the OpenNI2 path for depth. They are granted permission and enumerated independently, so the common failure is a running node publishing perfectly good colour frames with the depth topics silent. After an unclean kill the device semaphore can also survive the process, and the next launch blocks until it is cleared.',
                    },
                ]}
            />
        </AppPage>
    );
}
