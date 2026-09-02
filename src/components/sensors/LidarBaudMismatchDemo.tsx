// src/components/sensors/LidarBaudMismatchDemo.tsx
import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '../ui/Layout';
import { LearningPanelShell } from './LearningPanelShell';

type Submodel = 'a2m7' | 'a2m8' | 'a2m12';
type LaunchStatus = 'idle' | 'launching' | 'success' | 'error';

const LAUNCH_OPTIONS: { value: Submodel; label: string }[] = [
  { value: 'a2m7', label: 'view_rplidar_a2m7_launch.py (256000 baud)' },
  { value: 'a2m8', label: 'view_rplidar_a2m8_launch.py (115200 baud)' },
  { value: 'a2m12', label: 'view_rplidar_a2m12_launch.py (256000 baud)' },
];

// This demo's simulated physical unit is fixed as an A2M8 (115200 baud) —
// the learner has to pick the matching launch file, exactly like on real
// hardware where the label on the unit is the only reliable way to know.
const ACTUAL_UNIT_SUBMODEL: Submodel = 'a2m8';
const LAUNCH_DELAY_MS = 1200;

/**
 * The RPLIDAR learning surface — deliberately NOT routed through
 * SensorDataSource.subscribe. Baud rate is restart-required and physically
 * tied to opening the serial port at driver startup: it cannot honestly be
 * "live-toggled" mid-stream. Instead this is a one-shot, restart-shaped
 * interaction with its own local state machine (see the Hardware & Sensors
 * Lab plan's Architecture Decision 3) — pick a launch config, click Launch,
 * a simulated handshake, then either scan data begins or the exact
 * diagnostic string from the RPLIDAR A2 profile appears.
 */
export function LidarBaudMismatchDemo() {
  // Defaults to a mismatch on purpose — most learners hit the failure on
  // the very first click, exactly as the real device teaches it.
  const [selected, setSelected] = useState<Submodel>('a2m7');
  const [status, setStatus] = useState<LaunchStatus>('idle');

  const handleLaunch = () => {
    setStatus('launching');
    window.setTimeout(() => {
      setStatus(selected === ACTUAL_UNIT_SUBMODEL ? 'success' : 'error');
    }, LAUNCH_DELAY_MS);
  };

  const explanation =
    status === 'success' ? (
      <>
        <strong className="text-emerald-300">Matched.</strong> The {selected} launch file's baud rate (115200)
        matches this simulated unit's real submodel (A2M8). The device-info handshake succeeds and{' '}
        <code>/scan</code> begins publishing.
      </>
    ) : status === 'error' ? (
      <>
        <strong className="text-rose-300">Mismatched.</strong> You launched the {selected} config (
        {selected === 'a2m8' ? '115200' : '256000'} baud) against a simulated A2M8 unit that actually needs 115200.
        The device shows up in <code>dmesg</code>/<code>lsusb</code> and the udev symlink exists — but the initial
        handshake reads bytes framed at the wrong rate. This is why <code>serial_baudrate</code> is tagged{' '}
        <strong>restart</strong> in the parameters panel above: it's read once at driver startup, from whichever
        launch file you use, never from a live reconfigure call.
      </>
    ) : (
      <>
        This simulated unit is (secretly) an A2M8, which needs 115200 baud. Pick a launch config and click Launch —
        on real hardware the only way to know which one is correct is the label printed on the unit itself.
      </>
    );

  return (
    <LearningPanelShell title="TRY IT: the baud rate trap" explanation={explanation}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <select
            data-testid="baud-demo-launch-select-rplidar_a2"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value as Submodel);
              setStatus('idle');
            }}
            className="flex-1 bg-black/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            {LAUNCH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span data-testid="baud-demo-start-rplidar_a2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLaunch}
              disabled={status === 'launching'}
              icon={PlayCircle}
            >
              {status === 'launching' ? 'Launching…' : 'Launch'}
            </Button>
          </span>
        </div>

        <div data-testid="baud-demo-result-rplidar_a2">
          {status === 'idle' && <p className="text-[11px] text-textDim font-mono">No launch attempted yet.</p>}
          {status === 'launching' && (
            <p className="text-[11px] text-amber-300 font-mono">Connecting to the serial port…</p>
          )}
          {status === 'success' && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-3 py-2">
              <p className="text-[11px] font-mono text-emerald-300">/scan publishing — RViz2 opens clean.</p>
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 px-3 py-2">
              <code className="block text-[11px] font-mono text-rose-300">
                Error, operation time out. SL_RESULT_OPERATION_TIMEOUT!
              </code>
            </div>
          )}
        </div>
      </div>
    </LearningPanelShell>
  );
}
