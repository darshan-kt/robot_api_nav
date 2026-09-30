import { LabProject } from '../../components/layout/LabProject';
import { NormalLoop } from '../../components/ui/LabLoops';
import { HistogramView } from '../../components/ui/LabViews';
import { Chips } from '../../components/ui/Chips';
import { normalSamples, histogram, pdfNormal, stats } from '../../lib/sampling';

const MU = 2.0, SIGMA = 0.05;              // command 2.00 m, sigma from the bench
const samplesAt = (tick: number) => normalSamples(Math.min(6 + tick * 4, 400), MU, SIGMA);

export function NormalPage() {
    return (
        <LabProject
            route="/ai/normal"
            objective="Send the robot 2.00 m fifty times and measure where it actually stops. Plot it — that is your σ."
            loop={<NormalLoop />}
            loopCaption="Wheel slip, encoder rounding, floor texture and a late stop command are all small and independent. Add enough of them together and the landings pile up in a bell around the target."
            tools={{
                hardware: ['TurtleBot3 Burger', 'Tape measure or a lidar fix', 'Floor tape at 2.00 m'],
                software: ['ROS 2 Humble', '/odom echo', 'NumPy', 'Matplotlib'],
            }}
            liveHz={5}
            liveRate="σ = 0.05 m"
            live={tick => (
                <HistogramView
                    bars={histogram(samplesAt(tick), 26, [1.82, 2.18])}
                    domain={[1.82, 2.18]}
                    pdf={pdfNormal(MU, SIGMA)}
                    markers={[
                        { x: MU - SIGMA, label: '−σ' },
                        { x: MU, label: 'μ' },
                        { x: MU + SIGMA, label: '+σ' },
                    ]}
                    unit="m"
                />
            )}
            readout={tick => {
                const s = samplesAt(tick);
                const { mean, sd } = stats(s);
                return (
                    <Chips
                        items={[
                            { k: 'Runs', v: `${s.length}` },
                            { k: 'Mean stop', v: `${mean.toFixed(3)} m` },
                            { k: 'Measured σ', v: `${sd.toFixed(3)} m` },
                            { k: 'Worst miss', v: `${Math.max(...s.map(v => Math.abs(v - MU))).toFixed(3)} m` },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Your measured σ is what AMCL should be told — the sim seeds /initialpose with 0.5 m, far looser than this.',
                'The tails are a lie: a 10σ miss should never happen, and a lidar pointed at glass does it every few minutes.',
                'Gate outliers before the filter update. Widening σ to swallow them makes every good reading worse.',
            ]}
        />
    );
}
