// src/components/sensors/DataSourceBanner.tsx
import { AlertTriangle, Radio } from 'lucide-react';
import type { SourceKind } from '../../lib/sensors/types';

interface DataSourceBannerProps {
  sourceKind: SourceKind;
  topic?: string;
  measuredHz?: number | null;
  online?: boolean;
  deviceId: string;
  className?: string;
}

/**
 * THE honesty component. Every value this app shows while MockSensorSource
 * is in use has to read as unmistakably simulated — not a subtle badge, a
 * real visual treatment. Driven purely by `sourceKind`, so the day a real
 * LiveSensorSource exists, this exact component flips to the live
 * treatment as a data-source swap, not a UI rewrite.
 *
 * The `live` treatment deliberately reuses the emerald "LIVE" pulse idiom
 * already established in DashboardPage.tsx's SensorCard — so a future real
 * backend's data reads as the same visual language users already trust,
 * not a new invention.
 */
export function DataSourceBanner({ sourceKind, topic, measuredHz, online, deviceId, className = '' }: DataSourceBannerProps) {
  if (sourceKind === 'mock') {
    return (
      <div
        data-testid={`datasource-banner-${deviceId}`}
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest">SIMULATED DATA</span>
            </div>
            <p className="text-[11px] text-amber-100/70 mt-1 leading-snug">
              Procedurally generated mock data — no hardware is connected. Every value on this card is synthetic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`datasource-banner-${deviceId}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
        </span>
        <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest">LIVE</span>
        {topic && <span className="text-[11px] font-mono text-textMuted">{topic}</span>}
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
