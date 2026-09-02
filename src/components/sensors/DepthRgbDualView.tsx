// src/components/sensors/DepthRgbDualView.tsx
import { useEffect, useRef, useState } from 'react';
import { Columns, Layers } from 'lucide-react';
import type { AstraFramePair } from '../../lib/sensors/types';

interface DepthRgbDualViewProps {
  frame: AstraFramePair | null;
  className?: string;
}

const CANVAS_W = 280;
const CANVAS_H = 200;
const DEPTH_NEAR_M = 0.6;
const DEPTH_FAR_M = 8.0;

function depthToColor(depthM: number): string {
  const t = Math.max(0, Math.min(1, (depthM - DEPTH_NEAR_M) / (DEPTH_FAR_M - DEPTH_NEAR_M)));
  return `hsl(${t * 240}, 80%, 50%)`; // near = red (0deg), far = blue (240deg)
}

function drawRgb(ctx: CanvasRenderingContext2D, frame: AstraFramePair | null) {
  ctx.fillStyle = '#0a1418';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const rgb = frame?.rgb;
  if (!rgb) return;
  for (const shape of rgb.pattern.shapes) {
    ctx.beginPath();
    ctx.arc(shape.x * CANVAS_W, shape.y * CANVAS_H, shape.r * CANVAS_W, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${shape.hue}, 70%, 55%)`;
    ctx.fill();
  }
}

function drawDepth(ctx: CanvasRenderingContext2D, frame: AstraFramePair | null) {
  ctx.fillStyle = '#0a1418';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const depth = frame?.depth;
  if (!depth) return;
  const rows = depth.depthGridM.length;
  const cols = depth.depthGridM[0]?.length ?? 0;
  const cellW = CANVAS_W / cols;
  const cellH = CANVAS_H / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = depthToColor(depth.depthGridM[row][col]);
      ctx.fillRect(col * cellW, row * cellH, cellW + 1, cellH + 1);
    }
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, frame: AstraFramePair | null) {
  ctx.fillStyle = '#0a1418';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const rgb = frame?.rgb;
  const depth = frame?.depth;
  if (!rgb || !depth) return;

  // RGB shapes at full opacity first...
  for (const shape of rgb.pattern.shapes) {
    ctx.beginPath();
    ctx.arc(shape.x * CANVAS_W, shape.y * CANVAS_H, shape.r * CANVAS_W, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${shape.hue}, 70%, 55%)`;
    ctx.fill();
  }

  // ...then semi-transparent depth blobs on top. When depth_registration is
  // false, these visibly do NOT sit on top of the RGB shapes they belong to
  // — that gap IS the finding this device's profile calls the most
  // instructive failure mode either device produces.
  const rows = depth.depthGridM.length;
  const cols = depth.depthGridM[0]?.length ?? 0;
  const cellW = CANVAS_W / cols;
  const cellH = CANVAS_H / rows;
  ctx.globalAlpha = 0.55;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const d = depth.depthGridM[row][col];
      if (d > DEPTH_NEAR_M + 0.4) continue; // only draw the "near" blobs, not the background
      ctx.fillStyle = depthToColor(d);
      ctx.fillRect(col * cellW, row * cellH, cellW + 1, cellH + 1);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * The Astra Pro's real two-stream architecture, rendered as two canvases
 * (or one overlay) — reflecting that this is genuinely one ROS node with
 * two independent driver components (OpenNI2 depth, UVC RGB), not two
 * separate node graphs.
 */
export function DepthRgbDualView({ frame, className = '' }: DepthRgbDualViewProps) {
  const [mode, setMode] = useState<'side-by-side' | 'overlay'>('overlay');
  const rgbRef = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === 'side-by-side') {
      const rgbCtx = rgbRef.current?.getContext('2d');
      const depthCtx = depthRef.current?.getContext('2d');
      if (rgbCtx) drawRgb(rgbCtx, frame);
      if (depthCtx) drawDepth(depthCtx, frame);
    } else {
      const overlayCtx = overlayRef.current?.getContext('2d');
      if (overlayCtx) drawOverlay(overlayCtx, frame);
    }
  }, [frame, mode]);

  return (
    <div className={className} data-testid="depth-rgb-dual-view">
      <div className="flex items-center justify-end gap-1.5 mb-2">
        <button
          onClick={() => setMode('side-by-side')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-colors ${
            mode === 'side-by-side' ? 'bg-emerald-400/15 text-emerald-400' : 'text-textDim hover:text-textMuted'
          }`}
        >
          <Columns className="w-3 h-3" />
          SIDE BY SIDE
        </button>
        <button
          onClick={() => setMode('overlay')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-colors ${
            mode === 'overlay' ? 'bg-emerald-400/15 text-emerald-400' : 'text-textDim hover:text-textMuted'
          }`}
        >
          <Layers className="w-3 h-3" />
          OVERLAY
        </button>
      </div>

      {mode === 'side-by-side' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">RGB · /camera/color/image_raw</p>
            <canvas ref={rgbRef} width={CANVAS_W} height={CANVAS_H} className="w-full rounded-lg border border-border/50" />
          </div>
          <div>
            <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">DEPTH · /camera/depth/image_raw</p>
            <canvas ref={depthRef} width={CANVAS_W} height={CANVAS_H} className="w-full rounded-lg border border-border/50" />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[9px] font-mono text-textDim tracking-widest mb-1">
            RGB + DEPTH OVERLAY — misaligned when depth_registration is off
          </p>
          <canvas
            ref={overlayRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-lg border border-border/50"
          />
        </div>
      )}
    </div>
  );
}
