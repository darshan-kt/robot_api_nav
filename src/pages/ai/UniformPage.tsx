import { DistributionTemplate } from './DistributionTemplate';

const A = 0, B = 1;

export function UniformPage() {
    return (
        <DistributionTemplate
            route="/ai/uniform"
            summary="Assumes you know the bounds and nothing else inside them. That is either an honest statement of total ignorance or a claim that the middle is no likelier than the edges — and which one it is depends entirely on what you are modelling."
            facts={[
                { label: 'Parameters', value: 'a = 0, b = 1' },
                { label: 'Mean', value: '0.5' },
                { label: 'Variance', value: '0.0833' },
                { label: 'Property', value: 'Maximum entropy on [a, b]' },
            ]}
            pdf={x => (x >= A && x <= B ? 1 / (B - A) : 0)}
            domain={[-0.25, 1.25]}
            markers={[{ x: A, label: 'a' }, { x: B, label: 'b' }, { x: 0.5, label: 'μ' }]}
            curveCaption={
                <>
                    Flat at 1/(b − a) between the bounds and exactly zero outside them. The vertical walls
                    are the point: this distribution says the difference between 0.999 and 1.001 is the
                    difference between possible and impossible, which is a very strong claim to make by
                    accident.
                </>
            }
            formula={'f(x) = 1 / (b - a)   for a <= x <= b\n       = 0             otherwise'}
            support="[a, b]"
            drawnWith="a = 0, b = 1"
            moments={[
                { label: 'Mean', value: '(a+b)/2 = 0.5' },
                { label: 'Variance', value: '(b−a)²/12 = 0.0833' },
                { label: 'Std. deviation', value: '0.2887' },
                { label: 'Median', value: '0.5' },
            ]}
            appearsIn={{
                title: 'Where this appears: AMCL global localisation',
                body: (
                    <>
                        <p className="m-0">
                            When the robot is asked to localise with no prior — the global-localisation
                            service rather than a seeded pose — AMCL scatters its particles uniformly across
                            the free cells of the map. That is the correct prior precisely because it is the
                            uninformative one: before the first scan match, one open cell really is as likely
                            as any other, and any other distribution would be asserting knowledge that does
                            not exist yet.
                        </p>
                        <p className="m-0">
                            What the uniform prior buys is the guarantee that the true pose is inside the
                            particle set at all. A tighter prior converges faster and can converge to the
                            wrong room, and no amount of subsequent evidence recovers from a hypothesis that
                            was never sampled. It is the one place in the stack where being deliberately
                            vague is the safe option.
                        </p>
                    </>
                ),
            }}
            breaks={[
                {
                    title: 'The support is wrong, so the answer is not in the set',
                    detail:
                        'A uniform prior over the map\'s free cells assumes the robot is on the map. Carry it into an unmapped corridor and every particle is in the wrong place, the filter converges confidently on whichever mapped area best matches the scan, and the resulting pose is precise and false. The distribution cannot express "somewhere else" — that is what the hard zero outside the bounds means.',
                },
                {
                    title: 'Treating a bounded quantity as uniform because bounds exist',
                    detail:
                        'Knowing a value lies in [0, 1] does not make it uniform on [0, 1]. Battery state of charge is bounded and spends most of its life nowhere near the middle. Using uniform as a default for anything bounded quietly asserts maximum entropy about a quantity you often know a great deal about.',
                },
                {
                    title: 'Particle count against area',
                    detail:
                        'Uniform coverage of a 384 × 384 cell map at 0.05 m per cell is a lot of free space to cover. With too few particles the scatter is uniform in distribution and sparse in practice, so the nearest particle to the truth can be a metre away and the filter converges to a local match. The failure looks like bad sensor data and is a sampling problem.',
                },
            ]}
            code={`import numpy as np

# Scatter particles over the map's free cells. rng.uniform is half-open
# on [low, high) — the upper bound is never drawn, which matters if you
# are indexing cells rather than sampling a continuum.
rng = np.random.default_rng(seed=7)
xs = rng.uniform(x_min, x_max, size=n_particles)
ys = rng.uniform(y_min, y_max, size=n_particles)
yaws = rng.uniform(-np.pi, np.pi, size=n_particles)   # +pi never drawn

# Rejection-sample against occupancy: a uniform prior over the bounding
# box is not a uniform prior over free space.
keep = occupancy_grid[to_cell(xs, ys)] == FREE
xs, ys, yaws = xs[keep], ys[keep], yaws[keep]`}
        />
    );
}
