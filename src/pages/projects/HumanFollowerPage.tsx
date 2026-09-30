import { LabProject } from '../../components/layout/LabProject';
import { HumanFollowerLoop } from '../../components/ui/LabLoops';
import { StandoffView } from '../../components/ui/LabViews';
import { liveFollow } from '../../lib/liveFrames';
import { Chips } from '../../components/ui/Chips';

export function HumanFollowerPage() {
    return (
        <LabProject
            route="/projects/human-follower"
            objective="Follow one chosen person at 1.4 m, and stop rather than switch to anyone else."
            loop={<HumanFollowerLoop />}
            loopCaption="The robot locks onto one person at the start and checks every frame that it is still them. Lose the lock and it halts — it never re-targets the nearest body."
            tools={{
                hardware: ['TurtleBot3 Burger', 'Orbbec Astra Pro (RGB-D)', 'Raspberry Pi 5'],
                software: ['ROS 2 Humble', 'Person detector', 'Re-ID embedding', 'OpenCV'],
            }}
            liveHz={8}
            liveRate="15 Hz on the robot"
            live={tick => {
                const f = liveFollow(tick);
                return <StandoffView standoffM={f.standoffM} inDeadband={f.inDeadband} />;
            }}
            readout={tick => {
                const f = liveFollow(tick);
                return (
                    <Chips
                        items={[
                            { k: 'Standoff', v: `${f.standoffM.toFixed(2)} m` },
                            { k: 'Error', v: `${f.errM > 0 ? '+' : ''}${f.errM.toFixed(2)} m` },
                            { k: 'Speed cap', v: '0.22 m/s' },
                            { k: 'Lock', v: f.inDeadband ? 'holding' : 'closing', warn: !f.inDeadband },
                        ]}
                    />
                );
            }}
            watchOut={[
                'This is the only project that drives toward a person — cap the speed below walking pace.',
                'Losing the target must halt, never fall back to following the nearest person.',
                'Dark clothing defeats both depth and re-ID at once, so the two failures arrive together.',
            ]}
        />
    );
}
