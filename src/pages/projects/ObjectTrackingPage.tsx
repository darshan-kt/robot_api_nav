import { ProjectTemplate, wobble } from './ProjectTemplate';

export function ObjectTrackingPage() {
    return (
        <ProjectTemplate
            route="/projects/object-tracking"
            summary="Finding a coloured blob is a morning's work. The hard part is deciding the blob you found this frame is the same object you were tracking last frame, and not a second thing of the same colour that just walked into view."
            facts={[
                { label: 'Sensors', value: 'Astra Pro — RGB only' },
                { label: 'Loop rate', value: '30 Hz' },
                { label: 'Controller', value: 'P on bearing and area' },
                { label: 'Top speed', value: '0.28 m/s' },
            ]}
            stages={[
                { name: 'Frame', detail: '640×480 RGB' },
                { name: 'HSV mask', detail: 'hue window + S/V floor' },
                { name: 'Contour', detail: 'largest, area-gated' },
                { name: 'Bearing', detail: 'undistorted, not pixel x' },
                { name: '/cmd_vel', detail: 'turn + close to standoff' },
            ]}
            pipelineCaption={
                <>
                    The gate between stages three and four is what makes this different from the line
                    follower: the largest contour is accepted only if it is consistent with the one accepted
                    last frame, which is the entire difference between tracking an object and tracking a
                    colour.
                </>
            }
            steps={[
                {
                    title: 'Gate on area change, not just on colour',
                    detail:
                        'A blob that nearly doubles between consecutive frames is not the same object getting closer — at 30 Hz and 0.28 m/s it physically cannot be. Rejecting any candidate whose area jumps more than 1.9× rejects a second object entering frame while keeping genuine approach, which tops out near 1.1× per frame.',
                },
                {
                    title: 'Steer on bearing, not on pixel offset',
                    detail:
                        'This is the non-obvious one. Pixel x is not proportional to angle: the same 40 px offset is a larger angle at the frame edge than at the centre, so a controller tuned on pixels is over-damped in the middle and under-damped at the edges — it hunts exactly when the target is about to leave view. Undistorting through the camera intrinsics first makes one gain correct everywhere.',
                },
                {
                    title: 'Close to an area, not to a distance',
                    detail:
                        'Depth is available but unreliable on the small, often shiny objects this tracks, so standoff is held on apparent contour area instead. It is a worse measurement in principle and a more available one in practice, and the deadband is wide enough that the difference does not show.',
                },
                {
                    title: 'A lost target stops the robot',
                    detail:
                        'After 0.6 s with no accepted candidate the node publishes zero velocity and holds it. It does not sweep to search: searching means turning while blind, and the reason the target was lost is frequently that something is now between the camera and it.',
                },
            ]}
            params={[
                { label: 'Hue window', value: '96 – 121' },
                { label: 'Saturation minimum', value: '118' },
                { label: 'Value minimum', value: '66' },
                { label: 'Minimum contour area', value: '400 px' },
                { label: 'Maximum area jump', value: '1.9× per frame' },
                { label: 'Standoff area setpoint', value: '12 800 px' },
                { label: 'Area deadband', value: '±1 900 px' },
                { label: 'Kp angular', value: '0.0031' },
                { label: 'Kp linear', value: '0.000090' },
                { label: 'Lost-target timeout', value: '0.6 s' },
            ]}
            bench={[
                { label: 'Frames retained', value: '88.6 %', imperfect: true },
                { label: 'False locks', value: '2', imperfect: true },
                { label: 'Mean bearing error', value: '2.1°' },
                { label: 'Mean reacquire', value: '0.7 s' },
            ]}
            trace={wobble(120, 2.1, 1.4, [{ at: 44, mag: 9 }, { at: 92, mag: 7.5 }])}
            traceUnit="° bearing error"
            traceCaption={
                <>
                    Bearing error over a two-minute run. The baseline ripple is mask noise moving the
                    centroid a pixel or two. The two excursions are the false locks: in both, the target
                    passed behind a chair and a similarly-coloured object was the largest contour for the
                    four frames before the area gate rejected it. The gate recovered both times — it just
                    did not prevent them, because for those four frames the impostor's area was within
                    1.9× of the real target's.
                </>
            }
            failures={[
                {
                    title: 'The two false locks: same hue, plausible area',
                    detail:
                        'Both happened during a brief occlusion, which is when the area gate has nothing recent to compare against. A second object inside the hue window and within the area ratio is accepted, and the robot steers at it until the real target reappears. Gating on hue histogram shape rather than a hue window would separate two objects that share a nominal colour but not a distribution.',
                },
                {
                    title: 'Specular highlight desaturates the target',
                    detail:
                        'A gloss-finished object under a ceiling light develops a white patch where saturation collapses below the floor of 118. The mask hollows out, the contour splits around the highlight, and each fragment falls under the 400 px minimum. The target is brightly lit and completely invisible, which is a counter-intuitive enough failure that it gets blamed on the camera first.',
                },
                {
                    title: 'Motion blur at speed smears the mask edge',
                    detail:
                        'At 0.28 m/s with a 33 ms exposure, a close target smears several pixels. Saturation drops across the smeared band, the contour shrinks asymmetrically, and the centroid biases against the direction of motion — so the robot consistently under-turns while moving and corrects once stopped.',
                },
            ]}
        />
    );
}
