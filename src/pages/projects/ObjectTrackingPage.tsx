import { LabProject } from '../../components/layout/LabProject';
import { ObjectTrackingLoop } from '../../components/ui/LabLoops';
import { TrackView } from '../../components/ui/LabViews';
import { liveTrack } from '../../lib/liveFrames';
import { Chips } from '../../components/ui/Chips';

export function ObjectTrackingPage() {
    return (
        <LabProject
            route="/projects/object-tracking"
            objective="Keep a coloured ball centred in the camera and hold a set distance from it."
            loop={<ObjectTrackingLoop />}
            loopCaption="The robot turns to put the ball back in the middle of its frame. Distance is judged from how big the blob looks, not from depth."
            tools={{
                hardware: ['TurtleBot3 Burger', 'Orbbec Astra Pro (RGB)', 'Coloured target'],
                software: ['ROS 2 Humble', 'OpenCV', 'HSV threshold', 'Python'],
            }}
            liveHz={10}
            liveRate="30 Hz on the robot"
            live={tick => {
                const f = liveTrack(tick);
                return <TrackView objectX={f.objectX} bearingDeg={f.bearingDeg} areaPx={f.areaPx} locked={f.locked} />;
            }}
            readout={tick => {
                const f = liveTrack(tick);
                return (
                    <Chips
                        items={[
                            { k: 'Bearing', v: `${f.bearingDeg > 0 ? '+' : ''}${f.bearingDeg}°` },
                            { k: 'Blob area', v: `${f.areaPx.toLocaleString()} px` },
                            { k: 'Hue window', v: '96 – 121' },
                            { k: 'Lock', v: f.locked ? 'held' : 'dropped', warn: !f.locked },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Gate on area change — a blob that doubles between frames is a different object.',
                'Steer on bearing, not pixel x: the same offset is a bigger angle at the frame edge.',
                'A gloss highlight desaturates the target and the mask hollows out mid-track.',
            ]}
        />
    );
}
