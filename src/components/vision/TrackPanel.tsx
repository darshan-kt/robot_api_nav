// src/components/vision/TrackPanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useVisionFrame } from '../../hooks/useVisionFrame';
import { useVisionSource } from '../../lib/vision/VisionSourceContext';
import { VisionSourceBanner } from './VisionSourceBanner';
import { VisionParameterPanel } from './VisionParameterPanel';
import { RunningInstructions } from './RunningInstructions';
import { PipelineStages } from './PipelineStages';
import { TwistReadout } from './TwistReadout';
import { RobotSandbox2D } from './RobotSandbox2D';
import { TargetLostDemo } from './TargetLostDemo';
import { CheckpointsAndQuiz } from './CheckpointsAndQuiz';
import { RawFrameInspector } from '../sensors/RawFrameInspector';
import { downsampleFrame } from '../../lib/vision/downsampleFrame';
import { computeSteering, detectTarget } from '../../lib/vision/visionMath';
import { COLOR_TRACKER_PARAMETERS } from '../../lib/vision/parameterSchemas';
import { COLOR_TRACKER_CONTENT } from '../../lib/vision/content/colorTracker.content';
import type { HsvTriplet, TwistCommand } from '../../lib/vision/types';

const WORKING_WIDTH = 160;
const WORKING_HEIGHT = 120;
const ZERO_TWIST: TwistCommand = { linearX: 0, angularZ: 0 };
// Mirrors the real node's separate 0.1s safety_check timer period.
const SAFETY_TICK_MS = 100;
// Stable fallback references (module-level, not recreated per render) —
// BaseVisionSource always seeds hsv_lower/hsv_upper from the schema
// defaults, so this branch is unreachable in practice; it exists only so
// useMemo's dependency array below never sees a fresh array literal.
const FALLBACK_HSV_LOWER: HsvTriplet = [0, 120, 70];
const FALLBACK_HSV_UPPER: HsvTriplet = [10, 255, 255];

interface TrackPanelProps {
  active: boolean;
}

/**
 * Mirrors color_tracker_node.py's real architecture, not just its output:
 * a per-frame detection callback plus a SEPARATE, frame-rate-independent
 * safety timer. lastDetection holds the most recent valid twist; the
 * safety tick (below) is what decides whether that's still current or the
 * timeout has elapsed — reproducing the real hysteresis (hold last command
 * during the grace period, hard-zero only after) rather than naively
 * zeroing the instant one frame has no detection.
 */
export function TrackPanel({ active }: TrackPanelProps) {
  const { source } = useVisionSource();
  const { frame, sourceKind, connected, measuredHz } = useVisionFrame(active);
  const [paramsOpen, setParamsOpen] = useState(false);

  // Applied (not staged) parameter values — what the real node would be
  // running right now, post any Relaunch.
  const hsvLower = (source.getParameterValue('hsv_lower') as HsvTriplet) ?? FALLBACK_HSV_LOWER;
  const hsvUpper = (source.getParameterValue('hsv_upper') as HsvTriplet) ?? FALLBACK_HSV_UPPER;
  const minContourAreaPx2 = Number(source.getParameterValue('min_contour_area') ?? 500);
  const centroidDeadzonePx = Number(source.getParameterValue('centroid_deadzone_px') ?? 40);
  const angularGain = Number(source.getParameterValue('angular_gain') ?? 0.005);
  const maxLinearSpeed = Number(source.getParameterValue('max_linear_speed') ?? 0.12);
  const maxAngularSpeed = Number(source.getParameterValue('max_angular_speed') ?? 0.4);
  const targetLostTimeoutSec = Number(source.getParameterValue('target_lost_timeout_sec') ?? 1.0);

  const workingFrame = useMemo(
    () => (frame ? downsampleFrame(frame, WORKING_WIDTH, WORKING_HEIGHT) : null),
    [frame]
  );
  const detection = useMemo(
    () => (workingFrame ? detectTarget(workingFrame, hsvLower, hsvUpper, minContourAreaPx2) : null),
    [workingFrame, hsvLower, hsvUpper, minContourAreaPx2]
  );

  const [lastDetection, setLastDetection] = useState<{ twist: TwistCommand; time: number } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNowTick(Date.now()), SAFETY_TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!detection?.contourFound || detection.offsetPx === null) return; // no /cmd_vel update this frame, exactly like the real image_callback's early return
    const twist = computeSteering(detection.offsetPx, { centroidDeadzonePx, angularGain, maxLinearSpeed, maxAngularSpeed });
    setLastDetection({ twist, time: Date.now() });
  }, [detection, centroidDeadzonePx, angularGain, maxLinearSpeed, maxAngularSpeed]);

  const secondsSinceLastDetection = lastDetection ? (nowTick - lastDetection.time) / 1000 : null;
  const stopped = secondsSinceLastDetection !== null && secondsSinceLastDetection > targetLostTimeoutSec;
  const displayedTwist: TwistCommand = !lastDetection || stopped ? ZERO_TWIST : lastDetection.twist;

  // RawFrameInspector JSON.stringify's whatever it's given, on every
  // render. A raw CameraFrame's `pixels` buffer is 300KB+ at native
  // resolution and a NEW object every ~66ms while streaming — stringifying
  // that continuously would freeze the tab the instant a student opened
  // this panel. Summarize instead: keeps sourceKind honest (the actual
  // point of this inspector) without the unusable, expensive pixel dump.
  const frameSummary = useMemo(
    () =>
      frame
        ? {
            sourceKind: frame.sourceKind,
            receivedAt: frame.receivedAt,
            topic: frame.topic,
            msgType: frame.msgType,
            width: frame.width,
            height: frame.height,
            pixels: `Uint8ClampedArray(${frame.pixels.length}) — omitted, too large to usefully render as JSON`,
          }
        : null,
    [frame]
  );

  return (
    <div data-testid="track-panel" className="space-y-4">
      <VisionSourceBanner sourceKind={sourceKind} measuredHz={measuredHz} online={connected} />

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <button
          data-testid="params-toggle-color_tracker"
          onClick={() => setParamsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
        >
          <span className="flex items-center gap-2 text-xs font-mono font-bold text-text tracking-widest">
            <SlidersHorizontal className="w-4 h-4 text-textDim" />
            PARAMETERS ({COLOR_TRACKER_PARAMETERS.length})
          </span>
          {paramsOpen ? <ChevronUp className="w-4 h-4 text-textDim" /> : <ChevronDown className="w-4 h-4 text-textDim" />}
        </button>
        {paramsOpen && (
          <div className="border-t border-border/50 p-4">
            <VisionParameterPanel schema={COLOR_TRACKER_PARAMETERS} active={active} />
          </div>
        )}
      </div>

      <RunningInstructions content={COLOR_TRACKER_CONTENT} />

      <div>
        <p className="text-xs font-mono font-bold text-text tracking-widest mb-2">LIVE PIPELINE</p>
        <PipelineStages
          frame={frame}
          workingFrame={workingFrame}
          detection={detection}
          centroidDeadzonePx={centroidDeadzonePx}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TwistReadout twist={displayedTwist} />
        <RobotSandbox2D twist={displayedTwist} />
      </div>

      <RawFrameInspector deviceId="color_tracker" frame={frameSummary} />

      <TargetLostDemo
        secondsSinceLastDetection={secondsSinceLastDetection}
        targetLostTimeoutSec={targetLostTimeoutSec}
        stopped={stopped}
      />

      <CheckpointsAndQuiz content={COLOR_TRACKER_CONTENT} />
    </div>
  );
}
