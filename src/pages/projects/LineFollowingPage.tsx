import { LabProject } from '../../components/layout/LabProject';
import { LineFollowingLoop } from '../../components/ui/LabLoops';
import { LineView } from '../../components/ui/LabViews';
import { liveLine } from '../../lib/liveFrames';
import { Chips } from '../../components/ui/Chips';

export function LineFollowingPage() {
    return (
        <LabProject
            route="/projects/line-following"
            objective="Drive a taped route on the lab floor without leaving it, using the camera alone."
            loop={<LineFollowingLoop />}
            loopCaption="The robot steers on where the tape sits in the bottom of its camera frame. No map, no lidar — if the tape disappears, it stops."
            tools={{
                hardware: ['TurtleBot3 Burger', 'Orbbec Astra Pro (RGB)', 'Raspberry Pi 5'],
                software: ['ROS 2 Humble', 'OpenCV', 'cv_bridge', 'Python'],
            }}
            liveHz={10}
            liveRate="30 Hz on the robot"
            live={tick => {
                const f = liveLine(tick);
                return <LineView centroidX={f.centroidX} errMm={f.errMm} locked={f.locked} />;
            }}
            readout={tick => {
                const f = liveLine(tick);
                return (
                    <Chips
                        items={[
                            { k: 'Cross-track', v: `${f.errMm > 0 ? '+' : ''}${f.errMm} mm` },
                            { k: 'Yaw command', v: `${f.yawRate} rad/s` },
                            { k: 'Kp', v: '0.0042' },
                            { k: 'Line', v: f.locked ? 'locked' : 'lost', warn: !f.locked },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Threshold in HSV, not RGB — after noon, sunlit floor matches white tape in RGB.',
                'Crop to the bottom of the frame, or ceiling lights threshold as tape.',
                'Leave the D gain at zero: at 30 Hz it steers on centroid jitter and chatters the wheels.',
            ]}
        />
    );
}
