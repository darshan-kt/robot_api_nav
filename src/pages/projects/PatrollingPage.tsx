import { LabProject } from '../../components/layout/LabProject';
import { PatrollingLoop } from '../../components/ui/LabLoops';
import { RouteView } from '../../components/ui/LabViews';
import { livePatrol } from '../../lib/liveFrames';
import { Chips } from '../../components/ui/Chips';

export function PatrollingPage() {
    return (
        <LabProject
            route="/projects/patrolling"
            objective="Visit six waypoints around the lab on a loop, unattended, and keep going if one is blocked."
            loop={<PatrollingLoop />}
            loopCaption="Nav2 drives between waypoints on the saved map. The part you write is what happens when a waypoint cannot be reached — skip it and carry on, rather than retrying all night."
            tools={{
                hardware: ['TurtleBot3 Burger', 'RPLIDAR A2', 'Raspberry Pi 5'],
                software: ['ROS 2 Humble', 'Nav2', 'AMCL', 'slam_toolbox map'],
            }}
            liveHz={4}
            liveRate="Nav2 controller at 10 Hz"
            live={tick => {
                const f = livePatrol(tick);
                return <RouteView waypoint={f.waypoint} stops={f.stops} progress={f.progress} lap={f.lap} />;
            }}
            readout={tick => {
                const f = livePatrol(tick);
                return (
                    <Chips
                        items={[
                            { k: 'Waypoint', v: `${f.waypoint} / ${f.stops}` },
                            { k: 'Lap', v: `${f.lap}` },
                            { k: 'ETA to next', v: `${f.etaS} s` },
                            { k: 'Speed cap', v: '0.40 m/s' },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Bound the recovery behaviours — unattended, Nav2 will spin in a doorway until the battery dies.',
                'Skip a waypoint after three failed plans; do not abandon the whole route.',
                'Glass doors return nothing to the lidar, so the lobby maps deeper than it is.',
            ]}
        />
    );
}
