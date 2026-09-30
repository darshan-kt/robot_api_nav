import { DistributionTemplate } from './DistributionTemplate';

const LAMBDA = 0.667;   // mean 1.5 s

export function ExponentialPage() {
    return (
        <DistributionTemplate
            route="/ai/exponential"
            summary="Memoryless — having waited ten minutes tells you nothing about how much longer you will wait. That is either exactly right or badly wrong depending on what you are modelling, and the tell is whether the thing you are waiting for has any notion of progress."
            facts={[
                { label: 'Parameter', value: 'λ = 0.667 s⁻¹' },
                { label: 'Mean', value: '1.50 s' },
                { label: 'Variance', value: '2.25 s²' },
                { label: 'Property', value: 'Memoryless' },
            ]}
            pdf={x => (x >= 0 ? LAMBDA * Math.exp(-LAMBDA * x) : 0)}
            domain={[0, 8]}
            markers={[
                { x: Math.LN2 / LAMBDA, label: 'median' },
                { x: 1 / LAMBDA, label: 'μ' },
            ]}
            curveCaption={
                <>
                    The median sits at ln2/λ = 1.04 s and the mean at 1/λ = 1.50 s, and the median being
                    the smaller of the two is the whole character of the distribution: most waits are short,
                    and the mean is dragged right by a tail that never quite ends. If those two markers
                    coincided, the curve would have been drawn rather than evaluated.
                </>
            }
            formula={'f(x) = λ · exp(-λx)   for x >= 0\n       = 0              otherwise'}
            support="[0, ∞)"
            drawnWith="λ = 0.667 s⁻¹"
            moments={[
                { label: 'Mean', value: '1/λ = 1.50 s' },
                { label: 'Variance', value: '1/λ² = 2.25 s²' },
                { label: 'Std. deviation', value: '1.50 s' },
                { label: 'Median', value: 'ln2/λ = 1.04 s' },
            ]}
            appearsIn={{
                title: 'Where this appears: reconnect backoff — and where it does not',
                body: (
                    <>
                        <p className="m-0">
                            The gateway's MQTT client backs off multiplicatively on a lost broker
                            connection, growing its delay by 1.5× up to a 15 s ceiling. That handles one
                            client politely. What it does not handle is many clients: if a broker restarts
                            and forty clients were all disconnected by the same event, they all wake on the
                            same schedule and arrive together, which is the load that knocks the broker over
                            a second time.
                        </p>
                        <p className="m-0">
                            Exponential jitter is the fix — add a draw with mean equal to the current backoff
                            so retries spread out instead of synchronising. Being honest about this codebase:
                            the browser-side WebSocket reconnects in the remote controller use a flat 3 s
                            timer with no jitter at all, so every open browser tab retries in lockstep. With
                            the handful of operators this runs for today that costs nothing; it is a real
                            edge waiting at a larger deployment, not a bug that bites now.
                        </p>
                    </>
                ),
            }}
            breaks={[
                {
                    title: 'The thing you are waiting for has memory',
                    detail:
                        'Memorylessness says the hazard rate is constant — a broker that has been down ten minutes is exactly as likely to come back in the next second as one that just died. That is a reasonable model for an unknown outage and a poor one for a service restarting on a fixed timer, where the probability climbs sharply as you approach its known boot time. Modelling the second with an exponential produces retry schedules that are least aggressive exactly when success becomes most likely.',
                },
                {
                    title: 'Unbounded support meets a bounded timer',
                    detail:
                        'The distribution has no maximum. Sampled naively for a backoff it will occasionally return 9 or 12 seconds, and if that draw is not clamped a client can sit out an outage that resolved almost immediately. The clamp is not a detail — without it the tail that gives the distribution its useful spread also produces its worst individual outcomes.',
                },
                {
                    title: 'Jitter added to the ceiling rather than the delay',
                    detail:
                        'A common implementation adds jitter after clamping to the 15 s maximum, which means every client past the ceiling draws from the same distribution around the same number and the synchronisation the jitter was meant to break is reintroduced at the top of the backoff — the exact regime where the most clients are waiting.',
                },
            ]}
            code={`import numpy as np

rng = np.random.default_rng()

# NumPy parameterises by SCALE = 1/lambda, not by lambda. Passing the rate
# where the scale is expected inverts the mean silently: lambda = 0.667
# becomes a mean of 0.667 s instead of 1.5 s, and nothing raises.
mean_delay = 1.5                      # seconds  (= 1 / 0.667)
jitter = rng.exponential(scale=mean_delay)

# Clamp: the tail is unbounded and the retry budget is not.
delay = min(jitter, 15.0)

# Python's stdlib takes the RATE, so the two libraries disagree on the
# meaning of the single argument.
import random
delay = min(random.expovariate(0.667), 15.0)`}
        />
    );
}
