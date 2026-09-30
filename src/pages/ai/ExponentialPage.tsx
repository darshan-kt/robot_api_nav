import { LabProject } from '../../components/layout/LabProject';
import { ExponentialLoop } from '../../components/ui/LabLoops';
import { HistogramView } from '../../components/ui/LabViews';
import { Chips } from '../../components/ui/Chips';
import { exponentialSamples, histogram, pdfExponential, stats } from '../../lib/sampling';

const LAMBDA = 0.667;                      // mean 1.5 s
const samplesAt = (tick: number) => exponentialSamples(Math.min(10 + tick * 8, 800), LAMBDA);

export function ExponentialPage() {
    return (
        <LabProject
            route="/ai/exponential"
            objective="Pull the broker's plug, bring it back, and measure how the fleet stampedes — then add jitter and measure again."
            loop={<ExponentialLoop />}
            loopCaption="On a fixed 3 s timer every robot retries at the same instant and knocks the broker over a second time. Drawing each wait from an exponential spreads the arrivals out."
            tools={{
                hardware: ['3 × TurtleBot3', 'Lab Wi-Fi', 'MQTT broker host'],
                software: ['hive_mqtt_bridge', 'paho-mqtt', 'ROS 2 Humble', 'tcpdump'],
            }}
            liveHz={6}
            liveRate="λ = 0.667 s⁻¹"
            live={tick => (
                <HistogramView
                    bars={histogram(samplesAt(tick), 26, [0, 8])}
                    domain={[0, 8]}
                    pdf={pdfExponential(LAMBDA)}
                    markers={[{ x: Math.LN2 / LAMBDA, label: 'median' }, { x: 1 / LAMBDA, label: 'μ' }]}
                    unit="s"
                />
            )}
            readout={tick => {
                const s = samplesAt(tick);
                const { mean } = stats(s);
                return (
                    <Chips
                        items={[
                            { k: 'Retries drawn', v: `${s.length}` },
                            { k: 'Mean wait', v: `${mean.toFixed(2)} s` },
                            { k: 'Median', v: `${(Math.LN2 / LAMBDA).toFixed(2)} s` },
                            { k: 'Longest', v: `${Math.max(...s).toFixed(1)} s`, warn: Math.max(...s) > 9 },
                        ]}
                    />
                );
            }}
            watchOut={[
                'Memoryless means waiting longer tells you nothing — wrong for a service that reboots on a fixed timer.',
                'The tail is unbounded: clamp the draw, or a robot sits out an outage that ended immediately.',
                'Add the jitter to the delay, not after the ceiling, or everyone syncs up again at the top of the backoff.',
            ]}
        />
    );
}
