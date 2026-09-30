import { ProjectTemplate, wobble } from './ProjectTemplate';

export function LineFollowingPage() {
    return (
        <ProjectTemplate
            route="/projects/line-following"
            summary="The hard part is not the steering — a proportional term on cross-track error handles that in an afternoon. The hard part is deciding the line is gone, because a controller that keeps turning on its last error drives a confident arc into a wall."
            facts={[
                { label: 'Sensors', value: 'Astra Pro — RGB only' },
                { label: 'Loop rate', value: '30 Hz' },
                { label: 'Controller', value: 'PI, derivative disabled' },
                { label: 'Top speed', value: '0.34 m/s' },
            ]}
            stages={[
                { name: 'Crop', detail: 'lower 25% of frame' },
                { name: 'HSV mask', detail: 'threshold, not RGB' },
                { name: 'Centroid', detail: 'largest contour' },
                { name: 'PI', detail: 'cross-track → yaw' },
                { name: '/cmd_vel', detail: '30 Hz, zero on loss' },
            ]}
            pipelineCaption={
                <>
                    Five stages, and only the fourth is control. Three quarters of the work is deciding
                    which pixels are the line, which is where every hour of tuning actually goes.
                </>
            }
            steps={[
                {
                    title: 'Look only where the line can be',
                    detail:
                        'The crop to the bottom quarter of the frame is not an optimisation, though it does cut per-frame work to roughly a quarter. It is there because the top of the frame contains ceiling lights, and a fluorescent tube thresholds identically to white tape. Cropping removes the entire class of failure rather than filtering it later.',
                },
                {
                    title: 'Threshold in HSV, not RGB',
                    detail:
                        'This is the choice most implementations get wrong first. In RGB, tape and floor separate cleanly at the exposure you tuned at and stop separating once afternoon sun raises the floor\'s brightness toward the tape\'s. Hue barely moves under that change; value moves a lot. Thresholding hue and using value only as a floor survives the light shifting.',
                },
                {
                    title: 'Set the derivative gain to zero and leave it there',
                    detail:
                        'The centroid moves by a pixel or two between frames from mask noise alone. At 30 Hz a derivative term turns that jitter into wheel chatter you can hear across the room, and it steers on noise. The loop runs fast enough that proportional plus a small integral holds the line; D is in the parameter list at 0.0 so nobody re-adds it hopefully.',
                },
                {
                    title: 'When the line is gone, stop — do not guess',
                    detail:
                        'After 0.40 s with no contour above the minimum area, the node publishes zero velocity and keeps publishing it. The tempting alternative is to hold the last steering command and sweep to reacquire, which works on a gentle curve and, at a gap in the tape near a wall, turns a stop into a collision.',
                },
            ]}
            params={[
                { label: 'Kp (cross-track → yaw)', value: '0.0042' },
                { label: 'Ki', value: '0.00018' },
                { label: 'Kd', value: '0.0 — deliberately disabled' },
                { label: 'Hue window', value: '18 – 34' },
                { label: 'Saturation minimum', value: '92' },
                { label: 'Value minimum', value: '74' },
                { label: 'Minimum blob area', value: '420 px' },
                { label: 'Crop fraction', value: '0.25 of frame height' },
                { label: 'Lost-line timeout', value: '0.40 s' },
                { label: 'Speed cap', value: '0.34 m/s' },
            ]}
            bench={[
                { label: 'Laps completed', value: '24 / 25', imperfect: true },
                { label: 'Mean cross-track', value: '18.4 mm' },
                { label: 'Worst cross-track', value: '71 mm' },
                { label: 'Mean lap time', value: '48.3 s' },
            ]}
            trace={wobble(120, 18, 7, [{ at: 31, mag: 44 }, { at: 79, mag: 39 }])}
            traceUnit="mm cross-track"
            traceBand={[10, 26]}
            traceCaption={
                <>
                    Cross-track error across one clean lap. The band is the steady-state envelope. The two
                    spikes are the 90° corners: the stripe leaves the crop window before the turn completes,
                    so the centroid is computed from the shrinking tail of the line and error grows until
                    the robot comes back around onto it. Both spikes recover inside 0.6 s, which is why the
                    controller was left alone rather than tuned to flatten them.
                </>
            }
            failures={[
                {
                    title: 'The lap that failed: glare read as tape',
                    detail:
                        'Lap 17 ended with the robot 0.4 m off the route and timed out. The polished section on the far corner threw a specular highlight that thresholded inside the hue window and was larger than the minimum area, so the centroid jumped to the reflection and the controller steered at it. A second gate on contour aspect ratio would have caught it — the highlight was almost round and the tape never is.',
                },
                {
                    title: 'Floor expansion joints threshold as dark',
                    detail:
                        'A dark joint running across the route splits the contour in two. Each fragment is under the 420 px minimum, so the frame reports no line at all, and a run of three such frames trips the lost-line timeout and halts the robot mid-route. It reads as a random stop on a route that worked yesterday.',
                },
                {
                    title: 'Worn tape narrows below the area threshold',
                    detail:
                        'Tape scuffed by traffic loses both width and saturation. The mask thins, the contour drops under the minimum area intermittently rather than consistently, and the robot alternates between following and halting. This degrades gradually over weeks, so it presents as the route becoming unreliable rather than as a fault.',
                },
            ]}
        />
    );
}
