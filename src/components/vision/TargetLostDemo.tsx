// src/components/vision/TargetLostDemo.tsx
import { useEffect, useState } from 'react';
import { AlertOctagon, Eye, EyeOff } from 'lucide-react';
import { LearningPanelShell } from '../sensors/LearningPanelShell';
import { useVisionSource } from '../../lib/vision/VisionSourceContext';
import { MockVisionSource } from '../../lib/vision/MockVisionSource';

interface TargetLostDemoProps {
  /** null = never detected yet this session. Driven by TrackPanel's own
   *  hysteresis state machine — NOT computed locally — so this demo shows
   *  the exact same countdown/stop the live pipeline above it is acting
   *  on, not a decorative simulation of its own. */
  secondsSinceLastDetection: number | null;
  targetLostTimeoutSec: number;
  stopped: boolean;
}

/**
 * This app's central safety lesson: unlike the sibling Hardware & Sensors
 * Lab's device-specific demos, this one is mock-only for the TRIGGER
 * (MockVisionSource.setTargetVisible — not on the shared VisionDataSource
 * interface, since a real webcam has no programmatic way to hide its own
 * subject) — webcam users get "cover the lens" instructions instead.
 */
export function TargetLostDemo({ secondsSinceLastDetection, targetLostTimeoutSec, stopped }: TargetLostDemoProps) {
  const { source, sourceKind } = useVisionSource();
  const [hidden, setHidden] = useState(false);
  const isMock = source instanceof MockVisionSource;

  useEffect(() => {
    setHidden(false); // a fresh source instance always starts with the target visible
  }, [source]);

  const handleToggle = () => {
    if (!(source instanceof MockVisionSource)) return;
    const next = !hidden;
    setHidden(next);
    source.setTargetVisible(!next);
  };

  const explanation = stopped ? (
    <>
      <strong className="text-rose-300">STOPPED — not searching.</strong> Project 1 had its own obstacle sensor as
      an independent safety net; this project has NONE at all — the LiDAR is physically present and even publishing{' '}
      <code>/scan</code> via the shared bringup launch, but nothing in this project subscribes to it. A blind
      spin-search would be a real collision risk with nothing to catch a bad guess, so the robot holds still
      instead.
    </>
  ) : secondsSinceLastDetection !== null ? (
    <>
      Holding the last commanded velocity for up to <code>target_lost_timeout_sec</code> (
      {targetLostTimeoutSec.toFixed(1)}s) before the safety timer forces a hard stop — a real, separate 0.1s timer
      in the source, independent of the camera's own frame rate.
    </>
  ) : (
    <>
      {sourceKind === 'mock'
        ? "Hide the target and watch the countdown — this app's central safety lesson."
        : 'Cover your camera lens and watch the countdown — a real webcam has no programmatic way to "hide" its subject.'}
    </>
  );

  return (
    <LearningPanelShell title="TRY IT: STOP not search" icon={AlertOctagon} explanation={explanation}>
      <div className="space-y-2">
        {isMock ? (
          <span data-testid="target-lost-toggle">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide transition-colors ${
                hidden ? 'bg-rose-400/15 text-rose-300' : 'bg-white/5 text-textMuted hover:text-text'
              }`}
            >
              {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {hidden ? 'TARGET HIDDEN — click to restore' : 'Hide the target'}
            </button>
          </span>
        ) : (
          <p className="text-[11px] text-purple-100/70">Cover your webcam lens to trigger this demo.</p>
        )}

        {secondsSinceLastDetection !== null && (
          <div data-testid="target-lost-countdown" className="text-xs font-mono text-text">
            {secondsSinceLastDetection.toFixed(1)}s since last detection / {targetLostTimeoutSec.toFixed(1)}s timeout
          </div>
        )}

        {stopped && (
          <div data-testid="target-lost-warn-log" className="rounded-lg border border-rose-400/30 bg-rose-400/5 px-3 py-2">
            <code className="text-[11px] font-mono text-rose-300">
              [WARN] Target lost for {secondsSinceLastDetection?.toFixed(2)}s (&gt; target_lost_timeout_sec) —
              publishing STOP, not searching
            </code>
          </div>
        )}
      </div>
    </LearningPanelShell>
  );
}
