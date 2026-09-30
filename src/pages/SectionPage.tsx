import { Navigate, useParams } from 'react-router-dom';
import { SectionDeck } from '../components/layout/SectionDeck';
import { sectionById } from '../lib/appCatalog';
import { CoverageMatrix } from '../components/ui/Viz';

/**
 * One route serves every section deck — the catalog says what to render, so a
 * new section needs a catalog entry and nothing else.
 *
 * Footers are the exception: a deck that is only tiles is a menu, so each
 * section can contribute one panel that answers the question its tiles raise.
 */
export function SectionPage() {
    const { sectionId } = useParams();
    const section = sectionId ? sectionById(sectionId) : undefined;

    if (!section) return <Navigate to="/store" replace />;

    return <SectionDeck section={section} footer={FOOTERS[section.id]} />;
}

const FOOTERS: Record<string, React.ReactNode> = {
    control: <ControlAuthority />,
    sensors: <SensorCoverage />,
    projects: <ProjectRisk />,
};

/**
 * Risk is not difficulty. The comparison exists to make that distinction
 * explicit, because it is the one place the section can carry an engineering
 * judgement rather than four summaries.
 */
function ProjectRisk() {
    const rows = [
        {
            project: 'Line following', sensors: 'RGB', speed: '0.34 m/s', loop: '30 Hz', risk: 'low',
            why: 'Fixed taped route, nothing to reach but floor. Fiddliest of the four to tune.',
        },
        {
            project: 'Object tracking', sensors: 'RGB', speed: '0.28 m/s', loop: '30 Hz', risk: 'low',
            why: 'Approaches an object it chose; stops rather than searching when the lock drops.',
        },
        {
            project: 'Human follower', sensors: 'RGB-D', speed: '0.22 m/s', loop: '15 Hz', risk: 'high',
            why: 'Moves toward a person who has not consented. Simplest controller here.',
        },
        {
            project: 'Patrolling', sensors: 'LIDAR + odom', speed: '0.40 m/s', loop: '10 Hz', risk: 'medium',
            why: 'Ordinary Nav2 — running unattended, at night, in an occupied building.',
        },
    ];
    const riskStyle: Record<string, string> = {
        low: 'bg-live/15 text-live border-live/40',
        medium: 'bg-warning/15 text-warning border-warning/40',
        high: 'bg-fault/15 text-fault border-fault/40',
    };

    return (
        <section>
            <h2 className="text-title font-bold text-text mb-2">What a failure can physically reach</h2>
            <p className="text-body text-textMuted leading-relaxed mb-5 max-w-3xl">
                The risk column is not how hard the project is to build. It is what a failure can touch.
            </p>

            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                    <caption className="sr-only">Projects compared by sensors, speed, loop rate and risk</caption>
                    <thead>
                        <tr>
                            {['Project', 'Sensors', 'Speed', 'Loop', 'Risk', 'Why'].map(h => (
                                <th key={h} scope="col" className="text-left text-meta font-mono uppercase tracking-widest text-textMuted pb-3 pr-4">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.project} className="border-t border-border/40 align-top">
                                <th scope="row" className="text-left py-3 pr-4 text-body font-medium text-text whitespace-nowrap">{r.project}</th>
                                <td className="py-3 pr-4 text-body font-mono text-textMuted whitespace-nowrap">{r.sensors}</td>
                                <td className="py-3 pr-4 text-body font-mono text-textMuted whitespace-nowrap">{r.speed}</td>
                                <td className="py-3 pr-4 text-body font-mono text-textMuted whitespace-nowrap">{r.loop}</td>
                                <td className="py-3 pr-4">
                                    <span className={`inline-block px-2 py-0.5 rounded-full border text-meta font-mono uppercase tracking-widest ${riskStyle[r.risk]}`}>
                                        {r.risk}
                                    </span>
                                </td>
                                <td className="py-3 pr-4 text-body text-textMuted">{r.why}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-body text-textMuted leading-relaxed mt-6 max-w-3xl">
                Read the first and third rows together. Line following is by a wide margin the hardest of
                these to get working — the thresholding alone takes longer than the other three controllers
                combined — and it is the safest thing on the list, because the worst it can do is drive off
                a strip of tape at walking-pace-over-six. The human follower has the simplest controller
                here, a proportional term on one distance, and it is the only one that moves toward a
                person. Difficulty is what it costs you to build. Risk is what it costs someone else when
                it is wrong, and the two are not correlated.
            </p>
        </section>
    );
}

/**
 * Four tiles left ~440px of dead canvas and, worse, did not answer the
 * question the tiles raise: these all "control the robot", so what does each
 * one actually command and what makes it stop?
 */
function ControlAuthority() {
    const rows = [
        {
            app: 'Dashboard',
            commands: 'Configuration writes — speed and turn-rate limits',
            onLoss: 'Readings go stale; nothing is in motion to lose',
            stop: 'Not a motion surface',
            moves: false,
        },
        {
            app: 'Simple route planner',
            commands: 'A goal pose, dispatched as NavigateThroughPoses',
            onLoss: 'Nav2 keeps driving the accepted goal on the robot',
            stop: 'cmd/cancel_nav, or the E-Stop',
            moves: true,
        },
        {
            app: 'Remote controller',
            commands: '/cmd_vel at 10 Hz while an input is held',
            onLoss: 'Bridge deadman zeroes /cmd_vel after 500 ms',
            stop: 'Release the input, or the E-Stop',
            moves: true,
        },
        {
            app: 'Emergency stop',
            commands: 'A global halt to every active controller',
            onLoss: 'Last will flips robot_alive to false',
            stop: 'It is the stop',
            moves: false,
        },
    ];

    return (
        <section>
            <h2 className="text-title font-bold text-text mb-2">What each surface can actually do</h2>
            <p className="text-body text-textMuted leading-relaxed mb-5 max-w-3xl">
                All four are grouped as control, but only two of them can put the robot in motion — and
                those two stop in opposite ways.
            </p>

            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                    <caption className="sr-only">Command authority and stop behaviour per control surface</caption>
                    <thead>
                        <tr>
                            {['Surface', 'What it commands', 'On link loss', 'What stops it'].map(h => (
                                <th key={h} scope="col"
                                    className="text-left text-meta font-mono uppercase tracking-widest text-textMuted pb-3 pr-4">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.app} className="border-t border-border/40 align-top">
                                <th scope="row" className="text-left py-3 pr-4">
                                    <span className="block text-body font-medium text-text whitespace-nowrap">{r.app}</span>
                                    <span className={`text-meta font-mono uppercase tracking-widest ${r.moves ? 'text-warning' : 'text-textMuted'}`}>
                                        {r.moves ? 'can move it' : 'cannot move it'}
                                    </span>
                                </th>
                                <td className="py-3 pr-4 text-body text-textMuted">{r.commands}</td>
                                <td className="py-3 pr-4 text-body text-textMuted">{r.onLoss}</td>
                                <td className="py-3 pr-4 text-body text-textMuted">{r.stop}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-body text-textMuted leading-relaxed mt-6 max-w-3xl">
                The asymmetry in the third column is the part worth knowing. Teleop stops by absence — the
                bridge watches for frames and zeroes the wheels 500 ms after they stop arriving, so dropping
                the browser tab is itself a stop. Navigation is the opposite: the goal is accepted once and
                owned by Nav2 on the robot, so closing the planner stops nothing and the robot finishes the
                route it was given. Only an explicit cancel or the E-Stop ends it.
            </p>
        </section>
    );
}

function SensorCoverage() {
    return (
        <section>
            <h2 className="text-title font-bold text-text mb-2">Why the platform carries four sensors</h2>
            <p className="text-body text-textMuted leading-relaxed mb-5 max-w-3xl">
                Range bands across the top, one row per ranging sensor. Filled means it returns something
                usable in that band, half means it returns something you should not trust, empty means it
                returns nothing at all.
            </p>

            <CoverageMatrix
                bands={['0 – 0.15 m', '0.15 – 0.6 m', '0.6 – 4 m', '4 – 8 m', '8 – 12 m']}
                // Row order follows the tiles above, so the deck reads as one
                // list rather than two orderings of the same four sensors.
                rows={[
                    { sensor: 'RPLIDAR A2', cells: ['none', 'full', 'full', 'full', 'partial'] },
                    { sensor: 'Orbbec Astra Pro', cells: ['none', 'none', 'full', 'partial', 'none'] },
                    { sensor: 'Ultrasonic array', cells: ['partial', 'full', 'full', 'none', 'none'] },
                ]}
            />

            <div className="mt-6 space-y-3 max-w-3xl">
                <p className="text-body text-textMuted leading-relaxed">
                    The IMU is not in the table because it does not measure range at all — it answers a
                    different question, and putting it in a range matrix would imply a coverage it never
                    claims. Below 0.15 m only the ultrasonic array returns anything, and inside 0.02 m
                    nothing does: the robot is blind to whatever is already touching it. Past 8 m only the
                    scanner reports, and it does so with a 48 mm error.
                </p>
                <p className="text-body text-textMuted leading-relaxed">
                    The band worth worrying about is 0.6 – 4 m, where the table reads as fully covered by
                    three sensors and is not. Both the scanner and the depth camera are optical, and a glass
                    door defeats both in the same way for the same reason — the beam reflects away instead of
                    scattering back, and both report open space. The only sensor that hears the glass is the
                    ultrasonic array, and it is looking at the floor. Three ticks in a column do not mean
                    three independent opinions.
                </p>
            </div>
        </section>
    );
}
