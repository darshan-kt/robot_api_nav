import { LabProject } from '../../components/layout/LabProject';
import { UniformLoop } from '../../components/ui/LabLoops';
import { HistogramView } from '../../components/ui/LabViews';
import { Chips } from '../../components/ui/Chips';
import { uniformSamples, histogram, pdfUniform, stats } from '../../lib/sampling';

const A = 0, B = 6;                       // metres across the lab floor
const samplesAt = (tick: number) => uniformSamples(Math.min(12 + tick * 9, 900), A, B);

export function UniformPage() {
    return (
        <LabProject
            route="/ai/uniform"
            objective="Kidnap the robot: move it while it is not looking, then watch it work out where it is from nothing."
            loop={<UniformLoop />}
            loopCaption="Global localisation scatters particles evenly over every free cell, because before the first scan match no spot is more likely than another. Each scan kills the guesses that do not fit."
            tools={{
                hardware: ['TurtleBot3 Burger', 'RPLIDAR A2', 'A saved map of the lab'],
                software: ['ROS 2 Humble', 'Nav2 / AMCL', 'RViz2', 'reinitialize_global_localization'],
            }}
            liveHz={6}
            liveRate="900 particles"
            live={tick => (
                <HistogramView
                    bars={histogram(samplesAt(tick), 24, [A, B])}
                    domain={[A, B]}
                    pdf={pdfUniform(A, B)}
                    markers={[{ x: 3, label: 'μ' }]}
                    unit="m"
                />
            )}
            readout={tick => {
                const s = samplesAt(tick);
                const { mean, sd } = stats(s);
                return (
                    <Chips
                        items={[
                            { k: 'Particles', v: `${s.length}` },
                            { k: 'Mean x', v: `${mean.toFixed(2)} m` },
                            { k: 'Spread', v: `${sd.toFixed(2)} m` },
                            { k: 'Flat density', v: `${(1 / (B - A)).toFixed(3)} /m` },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Uniform says the truth is inside the bounds — carry the robot off the map and every particle is wrong.',
                'Too few particles and the nearest one can be a metre out, so the filter locks onto the wrong room.',
                'Bounded does not mean uniform: battery charge lives in [0, 1] and is almost never in the middle.',
            ]}
        />
    );
}
