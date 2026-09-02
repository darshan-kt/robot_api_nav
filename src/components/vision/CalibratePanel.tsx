// src/components/vision/CalibratePanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '../ui/Layout';
import { useToast } from '../ui/Toast';
import { useVisionFrame } from '../../hooks/useVisionFrame';
import { useVisionSource } from '../../lib/vision/VisionSourceContext';
import { VisionSourceBanner } from './VisionSourceBanner';
import { HsvTrackbarGroup } from './HsvTrackbarGroup';
import { downsampleFrame } from '../../lib/vision/downsampleFrame';
import { inRangeMask } from '../../lib/vision/visionMath';
import { drawFrameToCanvas, drawMaskToCanvas } from '../../lib/vision/canvasDraw';
import type { HsvTriplet } from '../../lib/vision/types';

const WORKING_WIDTH = 160;
const WORKING_HEIGHT = 120;

// Matches hsv_calibrator.py's own createTrackbar initial values EXACTLY —
// H min=0/max=179, S min=0/max=255, V min=0/max=255 — the full range, so
// the mask starts solid white and the student has to narrow it down, same
// as opening the real tool for the first time.
const INITIAL_LOWER: HsvTriplet = [0, 0, 0];
const INITIAL_UPPER: HsvTriplet = [179, 255, 255];

interface CalibratePanelProps {
  active: boolean;
}

/**
 * Mirrors hsv_calibrator.py exactly: six live trackbars, a Camera preview
 * and a Mask preview, both updating every frame. Trackbar values are pure
 * local component state — they never touch the seam (see
 * VisionDataSource.ts's header comment) — the ONLY bridge to Track mode is
 * the "Copy to Track Config" button, the app's equivalent of pressing 'p'.
 */
export function CalibratePanel({ active }: CalibratePanelProps) {
  const { source } = useVisionSource();
  const { showToast } = useToast();
  const { frame, sourceKind, connected, measuredHz } = useVisionFrame(active);

  const [lower, setLower] = useState<HsvTriplet>(INITIAL_LOWER);
  const [upper, setUpper] = useState<HsvTriplet>(INITIAL_UPPER);

  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const workingFrame = useMemo(
    () => (frame ? downsampleFrame(frame, WORKING_WIDTH, WORKING_HEIGHT) : null),
    [frame]
  );
  const mask = useMemo(
    () =>
      workingFrame ? inRangeMask(workingFrame.pixels, workingFrame.width, workingFrame.height, lower, upper) : null,
    [workingFrame, lower, upper]
  );

  useEffect(() => {
    if (!frame || !cameraCanvasRef.current) return;
    const ctx = cameraCanvasRef.current.getContext('2d');
    if (ctx) drawFrameToCanvas(ctx, frame);
  }, [frame]);

  useEffect(() => {
    if (!mask || !workingFrame || !maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) drawMaskToCanvas(ctx, mask, workingFrame.width, workingFrame.height);
  }, [mask, workingFrame]);

  const handleCopyToTrackConfig = () => {
    source.setParameterValue('hsv_lower', lower);
    source.setParameterValue('hsv_upper', upper);
    showToast('Copied to Track Config — open the Track tab and click Relaunch to apply.', 'success');
  };

  return (
    <div data-testid="calibrate-panel" className="space-y-4">
      <VisionSourceBanner sourceKind={sourceKind} measuredHz={measuredHz} online={connected} />

      <p className="text-xs text-textMuted leading-relaxed">
        Adjust the six sliders until ONLY your target object is white in the Mask preview, under your{' '}
        <strong className="text-text">current, actual</strong> lighting. This mirrors{' '}
        <code>hsv_calibrator.py</code> exactly — trackbar values are read live, every frame; nothing here is staged
        or restart-gated, because the real tool works the same way.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <HsvTrackbarGroup label="hsv_lower (min)" value={lower} onChange={setLower} testIdPrefix="hsv-trackbar-lower" />
        <HsvTrackbarGroup label="hsv_upper (max)" value={upper} onChange={setUpper} testIdPrefix="hsv-trackbar-upper" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">CAMERA</p>
          <canvas
            ref={cameraCanvasRef}
            data-testid="calibrate-camera-preview"
            className="w-full rounded-lg border border-border/50 bg-black/20"
          />
        </div>
        <div>
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">MASK</p>
          <canvas
            ref={maskCanvasRef}
            data-testid="calibrate-mask-preview"
            className="w-full rounded-lg border border-border/50 bg-black/20"
          />
        </div>
      </div>

      <span data-testid="copy-to-track-config">
        <Button variant="primary" icon={Copy} onClick={handleCopyToTrackConfig}>
          Copy to Track Config
        </Button>
      </span>
    </div>
  );
}
