import { AppPage, Panel, SpecList, FailureModes, Interfaces, TwoUp } from '../../components/layout/AppPage';
import { Figure, PolarScan } from '../../components/ui/Viz';
import { LivePanel } from '../../components/layout/LivePanel';
import { liveScanRanges } from '../../lib/liveFrames';

export function RplidarA2Page() {
    return (
        <AppPage
            route="/sensors/rplidar-a2"
            summary="The only sensor that returns a range in every direction at once. SLAM builds the map from it, AMCL localises against it, and the costmap obstacle layer marks cells from it — if this stops, the robot is not navigating, it is dead reckoning."
            facts={[
                { label: 'Output', value: '/scan @ 10 rev/s' },
                { label: 'Sample rate', value: '8 k samples/s' },
                { label: 'Working range', value: '0.15 – 12.0 m' },
                { label: 'Coverage', value: '360° planar, 0.45°' },
            ]}
        >
            <Panel title="One frame">
                <Figure
                    title="Polar plot — 6.0 × 4.0 m room, scanner at (2.2, 2.0)"
                    caption={
                        <>
                            This is ray-cast from real geometry rather than sketched, so the artefacts are the
                            ones you would actually see. The four straight runs are the walls. The gap in the
                            upper right is a 0.9 m doorway — beams that enter it never come back, and the
                            correct rendering of that is an absence, not a maximum-range point. The small arc
                            breaking the right-hand wall is a 0.30 m pillar, and the wedge of missing returns
                            behind it is its shadow: the scanner cannot see through it and does not pretend to.
                        </>
                    }
                >
                    <PolarScan beams={360} maxM={6} />
                </Figure>
            </Panel>

            <LivePanel
                hz={10}
                rateLabel="10 rev/s"
                readout={tick => {
                    const r = liveScanRanges(tick, 360);
                    const hits = r.filter(v => v !== null) as number[];
                    const nearest = Math.min(...hits);
                    return (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 m-0">
                            {[
                                { k: 'Beams returning', v: `${hits.length} / ${r.length}` },
                                { k: 'Nearest', v: `${nearest.toFixed(2)} m` },
                                { k: 'Frame', v: `#${tick}` },
                                { k: 'Topic', v: '/scan' },
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
                {tick => <PolarScan ranges={liveScanRanges(tick, 360)} maxM={6} />}
            </LivePanel>

            <TwoUp>
                <Panel title="Hardware">
                    <SpecList
                        rows={[
                            { label: 'Part', value: 'Slamtec RPLIDAR A2 — submodels A2M6 / A2M7 / A2M8 / A2M12' },
                            { label: 'Sensing technique', value: 'Laser triangulation, rotating head' },
                            { label: 'Angular resolution', value: '0.45° at 10 rev/s (8 k samples/s ÷ 600 rpm)' },
                            { label: 'Accuracy at 1.0 m', value: '±11 mm' },
                            { label: 'Accuracy at 6.0 m', value: '±48 mm' },
                            { label: 'Interface', value: 'CP2102 USB-UART bridge — vendor 10c4, product ea60' },
                            { label: 'Baud rate', value: '115200 (A2M8) · 256000 (A2M12) — set via serial_baudrate' },
                            { label: 'Power draw', value: '2.5 W typical — motor plus sensor, 5 V' },
                        ]}
                    />
                    <p className="text-body text-textMuted leading-relaxed mt-3">
                        The submodel matters more than anything else on this page. The three A2 variants are
                        physically interchangeable and electrically are not: they differ in baud rate, and the
                        driver has one compiled-in default that is correct for none of them.
                    </p>
                </Panel>

                <Panel title="Interfaces">
                    <Interfaces
                        rows={[
                            { dir: 'pub', topic: '/scan', type: 'sensor_msgs/LaserScan', rate: '10 Hz' },
                        ]}
                        note={
                            <>
                                About 800 ranges per frame at four bytes each is roughly 32 kB/s — three orders of
                                magnitude cheaper than the depth camera, which is why this is the sensor the whole
                                navigation stack is built on. Subscribers are slam_toolbox or AMCL plus both
                                costmaps. When it stops, the costmaps do not clear themselves: they hold the last
                                marked cells, so the robot keeps planning around obstacles that may no longer be
                                there and fails to see ones that now are.
                            </>
                        }
                    />
                </Panel>
            </TwoUp>

            <FailureModes
                modes={[
                    {
                        title: 'The baud-rate trap',
                        detail:
                            'The driver\'s compiled-in default of 1,000,000 bps matches no A2 submodel, so launching the node directly — or through a custom launch file that never overrides serial_baudrate — frames every byte at the wrong rate. The device still appears in lsusb and the udev symlink still resolves, which is what makes this confusing: it fails at the device-info handshake with "SL_RESULT_OPERATION_TIMEOUT" before a single scan is published, rather than producing garbled data.',
                    },
                    {
                        title: 'It is planar, so it cannot see a table',
                        detail:
                            'Every return lies in one horizontal plane at the mounting height. A table top at 0.72 m, an open drawer, a pallet fork and the lip of a loading dock are all invisible — the scanner reports clear floor underneath them and the costmap agrees. This is the single most dangerous property of the sensor and the reason the ultrasonic array exists.',
                    },
                    {
                        title: 'Specular surfaces reflect the beam away',
                        detail:
                            'Glass, a mirror, and polished floor at a shallow angle all send the pulse somewhere other than back, so the beam reads as no return and the frame shows open space. A glass-walled corridor maps as wider than it is, and the robot will plan a path straight into it.',
                    },
                ]}
            />
        </AppPage>
    );
}
