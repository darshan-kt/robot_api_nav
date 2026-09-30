import { ProjectTemplate, wobble } from './ProjectTemplate';

export function PatrollingPage() {
    return (
        <ProjectTemplate
            route="/projects/patrolling"
            summary="Driving a waypoint list is ordinary Nav2. The hard part is what the robot does at 03:00 when a fire door has narrowed a corridor below its footprint, there is nobody in the building, and the only wrong answer is to keep trying forever."
            facts={[
                { label: 'Sensors', value: 'RPLIDAR A2 + odometry' },
                { label: 'Loop rate', value: 'Nav2 controller at 10 Hz' },
                { label: 'Controller', value: 'NavigateThroughPoses' },
                { label: 'Top speed', value: '0.40 m/s' },
            ]}
            stages={[
                { name: 'Waypoints', detail: '6-pose loop' },
                { name: 'Planner', detail: 'global path' },
                { name: 'Controller', detail: 'local, 10 Hz' },
                { name: 'Recovery', detail: 'bounded, max 2' },
                { name: 'Next / skip', detail: 'skip after 3 fails' },
            ]}
            pipelineCaption={
                <>
                    The last two stages are the project. The first three are Nav2 doing what Nav2 does; the
                    decision about when to stop trying and move on is the part that has to be written, and
                    it is the part that determines whether an unattended run ends with a completed loop or
                    a robot spinning in a doorway until the battery goes.
                </>
            }
            steps={[
                {
                    title: 'Give up on a waypoint, never on the route',
                    detail:
                        'A waypoint that fails three planning attempts is skipped and logged, and the robot proceeds to the next one. The alternative — abort the patrol — means one blocked corridor ends the night\'s coverage. Skipping keeps five of six areas covered and produces a log line naming the one that was not.',
                },
                {
                    title: 'Bound the recovery behaviours, explicitly',
                    detail:
                        'This is the non-obvious one and the reason the project exists. Nav2 will happily clear costmaps, spin and back up indefinitely if you let it, and unattended that is how a robot is found in the morning having rotated in the same doorway for six hours. Two recoveries per waypoint, then the waypoint is a failure.',
                },
                {
                    title: 'Time out on transit, not only on planning',
                    detail:
                        'A waypoint can plan successfully and never be reached — the robot inches forward against a costmap that keeps re-marking the same phantom obstacle. The 95 s per-waypoint transit timeout catches the case where progress is technically being made and is not going to finish.',
                },
                {
                    title: 'Inflate for the footprint you have, not the one on the drawing',
                    detail:
                        'Inflation radius is 0.35 m against a 0.55 m footprint, which is generous and deliberately so. Tightening it lets the robot through narrow gaps and also lets it plan paths where a 2 cm localisation error puts a wheel into a door frame.',
                },
            ]}
            params={[
                { label: 'Waypoints in loop', value: '6' },
                { label: 'Goal tolerance, position', value: '0.25 m' },
                { label: 'Goal tolerance, yaw', value: '0.20 rad' },
                { label: 'Per-waypoint transit timeout', value: '95 s' },
                { label: 'Maximum recoveries per waypoint', value: '2' },
                { label: 'Skip after', value: '3 failed planning attempts' },
                { label: 'Speed cap', value: '0.40 m/s' },
                { label: 'Inflation radius', value: '0.35 m' },
                { label: 'Robot footprint', value: '0.55 m diameter' },
            ]}
            bench={[
                { label: 'Waypoints reached', value: '47 / 48', imperfect: true },
                { label: 'Mean transit', value: '41.7 s' },
                { label: 'Recoveries invoked', value: '3' },
                { label: 'Waypoints skipped', value: '1', imperfect: true },
            ]}
            trace={wobble(96, 41.7, 5.2, [{ at: 62, mag: 53 }])}
            traceUnit="s per waypoint"
            traceCaption={
                <>
                    Transit time per waypoint across eight loops of six. The baseline spread is traffic —
                    doors, a bin left in a corridor, the odd person. The spike at waypoint 62 is the one
                    that was skipped: three planning attempts and two recoveries consumed 94.7 s before the
                    skip fired, which is the timeout doing its job and also the reason a skip costs more
                    than twice a normal transit.
                </>
            }
            failures={[
                {
                    title: 'The skipped waypoint: a fire door narrowed the corridor',
                    detail:
                        'A door held open during the day was closed overnight, narrowing the passage to 0.62 m. Against a 0.55 m footprint plus 0.35 m inflation the planner correctly found no valid path and the waypoint was skipped after three attempts. The robot behaved exactly as designed; the patrol simply did not cover that wing. Nothing in the system distinguishes "temporarily blocked" from "permanently blocked", so it will spend the same 95 s there every loop, all night.',
                },
                {
                    title: 'Glass lobby doors map as open space',
                    detail:
                        'The scanner is the only sensor feeding the costmap, and glass returns nothing to it — so the lobby maps several metres deeper than it is and the planner will route through the doors. This is the same physical failure documented on the RPLIDAR page, and it is why that stretch of the route is waypointed tightly rather than left to the planner.',
                },
                {
                    title: 'A scanner dropout leaves a confidently wrong costmap',
                    detail:
                        'If the USB link drops, the costmap does not clear — it holds its last marked cells. The robot keeps planning against a snapshot that ages, avoiding obstacles that have gone and driving into ones that arrived. Unattended, the tell is a patrol that completes normally while the log fills with recoveries in places nothing is.',
                },
            ]}
        />
    );
}
