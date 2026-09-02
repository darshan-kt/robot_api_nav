// src/components/vision/PipelineStages.tsx
import { useEffect, useRef } from 'react';
import { drawFrameToCanvas, drawMaskToCanvas } from '../../lib/vision/canvasDraw';
import type { CameraFrame, DetectionResult } from '../../lib/vision/types';

interface PipelineStagesProps {
  /** Full-resolution frame, for the raw and contour-overlay displays. */
  frame: CameraFrame | null;
  /** The downsampled frame detection was actually run against — its
   *  dimensions are the coordinate space detection.centroid/mask live in. */
  workingFrame: CameraFrame | null;
  detection: DetectionResult | null;
  centroidDeadzonePx: number;
}

/**
 * Purely presentational — every value here is computed by TrackPanel
 * (which owns the pipeline math) and handed down as props. Four stages,
 * matching the real color_tracker_node.py's own pipeline shape exactly:
 * raw frame -> HSV mask -> contour+centroid -> the steering decision.
 */
export function PipelineStages({ frame, workingFrame, detection, centroidDeadzonePx }: PipelineStagesProps) {
  const rawCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!frame || !rawCanvasRef.current) return;
    const ctx = rawCanvasRef.current.getContext('2d');
    if (ctx) drawFrameToCanvas(ctx, frame);
  }, [frame]);

  useEffect(() => {
    if (!detection || !workingFrame || !maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) drawMaskToCanvas(ctx, detection.mask, workingFrame.width, workingFrame.height);
  }, [detection, workingFrame]);

  useEffect(() => {
    if (!frame || !workingFrame || !contourCanvasRef.current) return;
    const ctx = contourCanvasRef.current.getContext('2d');
    if (!ctx) return;

    drawFrameToCanvas(ctx, frame);

    // Reference centre line — same role as the deadzone in the real node's
    // steering law.
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(frame.width / 2, 0);
    ctx.lineTo(frame.width / 2, frame.height);
    ctx.stroke();

    if (detection?.contourFound && detection.centroid) {
      const scaleX = frame.width / workingFrame.width;
      const scaleY = frame.height / workingFrame.height;
      const cx = detection.centroid.cx * scaleX;
      const cy = detection.centroid.cy * scaleY;

      ctx.strokeStyle = 'rgb(34, 197, 94)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgb(239, 68, 68)';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frame, workingFrame, detection]);

  const offset = detection?.offsetPx ?? null;
  const decision =
    offset === null
      ? 'No target detected this frame.'
      : Math.abs(offset) <= centroidDeadzonePx
        ? `CENTERED (offset ${offset.toFixed(0)}px) -> FORWARD`
        : offset > 0
          ? `offset ${offset.toFixed(0)}px -> TURN RIGHT`
          : `offset ${offset.toFixed(0)}px -> TURN LEFT`;

  return (
    <div data-testid="pipeline-stages" className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div data-testid="pipeline-stage-raw">
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">1. RAW FRAME</p>
          <canvas ref={rawCanvasRef} className="w-full rounded-lg border border-border/50 bg-black/20" />
        </div>
        <div data-testid="pipeline-stage-mask">
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">2. HSV MASK</p>
          <canvas ref={maskCanvasRef} className="w-full rounded-lg border border-border/50 bg-black/20" />
        </div>
        <div data-testid="pipeline-stage-contour">
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">3. CONTOUR + CENTROID</p>
          <canvas ref={contourCanvasRef} className="w-full rounded-lg border border-border/50 bg-black/20" />
        </div>
      </div>
      <div data-testid="pipeline-stage-steering" className="rounded-lg border border-border/50 bg-black/10 px-3 py-2.5">
        <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">4. STEERING DECISION</p>
        <p className="text-[11px] font-mono text-text">
          {detection?.contourFound && `area=${detection.areaPx2}px² · `}
          {decision}
        </p>
      </div>
    </div>
  );
}
