import { DistributionTemplate } from './DistributionTemplate';

const MU = 0, SIGMA = 0.5;   // AMCL x/y prior from entrypoint_sim.sh: variance 0.25

export function NormalPage() {
    return (
        <DistributionTemplate
            route="/ai/normal"
            summary="Assumes the error you are modelling is the sum of many small independent errors, which is why it turns up everywhere and why it is wrong in exactly the situations that matter. Its tails are thin enough to declare rare events impossible, and sensors produce those events several times a minute."
            facts={[
                { label: 'Parameters', value: 'μ = 0, σ = 0.5 m' },
                { label: 'Mean', value: '0 m' },
                { label: 'Variance', value: '0.25 m²' },
                { label: 'Property', value: 'Inflections at μ ± σ' },
            ]}
            pdf={x => Math.exp(-((x - MU) ** 2) / (2 * SIGMA * SIGMA)) / (SIGMA * Math.sqrt(2 * Math.PI))}
            domain={[-2, 2]}
            markers={[
                { x: -SIGMA, label: '−σ' },
                { x: MU, label: 'μ' },
                { x: SIGMA, label: '+σ' },
            ]}
            curveCaption={
                <>
                    The two dashed markers at ±0.5 sit where the curve changes from bending downward to
                    bending upward — the inflection points, which for a Gaussian are always exactly at
                    μ ± σ. That is the cheapest possible check that a bell curve was computed and not
                    drawn: a traced one puts them in the wrong place and carries tails that are visibly
                    too fat.
                </>
            }
            formula={'f(x) = (1 / (σ·sqrt(2π))) · exp( -(x - μ)² / (2σ²) )'}
            support="(−∞, ∞)"
            drawnWith="μ = 0, σ = 0.5 m"
            moments={[
                { label: 'Mean', value: 'μ = 0 m' },
                { label: 'Variance', value: 'σ² = 0.25 m²' },
                { label: 'Std. deviation', value: 'σ = 0.5 m' },
                { label: 'Median', value: 'μ = 0 m' },
            ]}
            appearsIn={{
                title: 'Where this appears: the AMCL initial-pose covariance',
                body: (
                    <>
                        <p className="m-0">
                            When the simulator seeds AMCL it publishes an initial pose with a diagonal
                            covariance of 0.25 on x and y and 0.0685 on yaw — that is σ = 0.5 m in position
                            and σ = 0.26 rad, about 15°, in heading. Those numbers say the spawn pose is
                            known to roughly half a metre, which is honest for a Gazebo spawn and would be
                            optimistic for a human placing a real robot on a floor by eye.
                        </p>
                        <p className="m-0">
                            The Gaussian buys one specific thing here: it is closed under the filter's
                            update, so the prior stays a covariance matrix rather than becoming a shape
                            nobody can propagate. That tractability is the whole reason it is used, and it
                            is a property of the maths rather than a claim about the robot.
                        </p>
                    </>
                ),
            }}
            breaks={[
                {
                    title: 'The tails are far too thin for real sensors',
                    detail:
                        'A 10σ deviation has a probability around 1 in 10²³ — it should not occur in the lifetime of the universe. A scanner pointed at a glass door produces exactly that scale of error several times a minute, because the return is not a noisy measurement of the wall, it is a correct measurement of something else. Fitting a larger σ does not fix this: it widens the distribution for every good reading in order to accommodate readings that are not from the same process at all.',
                },
                {
                    title: 'The fix belongs before the update, not in σ',
                    detail:
                        'The right response to a return that cannot be explained by the model is to refuse it — gate on Mahalanobis distance and drop the measurement — rather than to soften the model until it accepts everything. A filter that accepts a 10σ outlier has already moved its estimate by the time you notice, and the estimate it reports afterwards carries a covariance claiming high confidence.',
                },
                {
                    title: 'Symmetry that the quantity does not have',
                    detail:
                        'A Gaussian is symmetric and unbounded, so it assigns probability to negative ranges and negative durations. For a bounded, skewed quantity — time-of-flight, battery charge, a range reading near its minimum — a noticeable share of the probability mass sits where the value cannot physically be, and any estimator that integrates over it is biased in a direction you can predict.',
                },
            ]}
            code={`import numpy as np

rng = np.random.default_rng()

# NumPy takes the STANDARD DEVIATION; the covariance message carries the
# VARIANCE. Passing 0.25 where sigma is expected models 0.25 m of error
# instead of 0.5 m, and the mistake makes the filter overconfident rather
# than obviously broken.
variance = 0.25
sigma = np.sqrt(variance)             # 0.5 m
noise = rng.normal(loc=0.0, scale=sigma, size=n)

# Correlated pose noise needs the full matrix, not three independent draws.
cov = np.diag([0.25, 0.25, 0.0685])   # x, y, yaw — as published to /initialpose
dx, dy, dyaw = rng.multivariate_normal(mean=[0, 0, 0], cov=cov)`}
        />
    );
}
