// src/components/vision/VisionSourceBanner.tsx
import { AlertTriangle, Radio, Webcam } from 'lucide-react';
import type { SourceKind } from '../../lib/vision/types';

interface VisionSourceBannerProps {
  sourceKind: SourceKind;
  measuredHz?: number | null;
  online?: boolean;
  className?: string;
}

/**
 * The 3-way honesty banner. `mock` reuses the sibling Hardware & Sensors
 * Lab's amber SIMULATED DATA treatment UNCHANGED — the platform's honesty
 * visual language stays one system across apps. `webcam` is real pixels
 * but explicitly NOT the robot: a third, distinct cyan treatment, no
 * diagonal-stripe watermark (that texture is reserved for `mock`
 * specifically so the two states can never be visually confused). `live`
 * reuses the sibling's emerald LIVE pulse idiom, reserved for a future real
 * ROS backend.
 */
export function VisionSourceBanner({ sourceKind, measuredHz, online, className = '' }: VisionSourceBannerProps) {
  if (sourceKind === 'mock') {
    return (
      <div
        data-testid="datasource-banner-vision"
        className={`relative overflow-hidden rounded-xl border border-amber-400/40 bg-amber-400/5 px-4 py-3 ${className}`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgb(251 191 36) 0px, rgb(251 191 36) 2px, transparent 2px, transparent 14px)',
          }}
        />
        <div className="relative flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-widest">SIMULATED DATA</span>
            <p className="text-[11px] text-amber-100/70 mt-1 leading-snug">
              Procedurally generated mock camera feed — no real camera is connected. Every pixel on this card is
              synthetic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sourceKind === 'webcam') {
    return (
      <div
        data-testid="datasource-banner-vision"
        className={`flex items-start gap-3 rounded-xl border border-cyan-400/40 bg-cyan-400/5 px-4 py-3 ${className}`}
      >
        <Webcam className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest">YOUR CAMERA</span>
          <p className="text-[11px] text-cyan-100/70 mt-1 leading-snug">
            Real pixels from your browser's own webcam, processed entirely on this device — not the robot's camera,
            and nothing here leaves your browser.
          </p>
        </div>
      </div>
    );
  }

  // sourceKind === 'live' — reserved for a future real ROS backend. Reuses
  // the sibling app's emerald LIVE pulse idiom so a real backend's data
  // reads as the same visual language users already trust.
  return (
    <div
      data-testid="datasource-banner-vision"
      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
        </span>
        <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest">LIVE</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-textDim">
        {measuredHz != null && (
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3" />
            {measuredHz.toFixed(1)} Hz
          </span>
        )}
        <span className={online ? 'text-emerald-400' : 'text-rose-400'}>{online ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
    </div>
  );
}
