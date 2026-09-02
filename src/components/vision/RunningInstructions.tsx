// src/components/vision/RunningInstructions.tsx
import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import type { TrackingLabContent } from '../../lib/vision/types';

interface RunningInstructionsProps {
  content: TrackingLabContent;
}

/**
 * Vision-local, not reused from src/components/sensors/RunningInstructions.tsx
 * — discovered during implementation that TrackingLabContent isn't actually
 * assignable to that component's DeviceContent prop type (DeviceId is the
 * narrow 'rplidar_a2'|'astra_pro' union, and DeviceContent requires
 * failureModes, which this app's content doesn't have — checkpoints live in
 * CheckpointsAndQuiz.tsx instead). Rather than widen the sibling's shared
 * type (cross-app coupling this platform's Lab apps deliberately avoid) or
 * misrepresent this app's deviceId, this is a small adapted variant: setup
 * steps + expected output only, no failure-modes sub-section.
 */
export function RunningInstructions({ content }: RunningInstructionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        data-testid="running-instructions-toggle-color_tracker"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-mono font-bold text-text tracking-widest">
          <Terminal className="w-4 h-4 text-textDim" />
          RUNNING INSTRUCTIONS
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-textDim" /> : <ChevronDown className="w-4 h-4 text-textDim" />}
      </button>

      {open && (
        <div className="border-t border-border/50 p-4 space-y-4">
          <p className="text-[10px] font-mono text-textDim">Source: {content.provenance}</p>

          <ol className="space-y-3">
            {content.setupSteps.map((step, i) => (
              <li key={i}>
                <p className="text-xs font-semibold text-text mb-1.5">{step.title}</p>
                <pre className="text-[11px] font-mono text-emerald-300/90 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                  {step.commands.join('\n')}
                </pre>
                {step.note && <p className="text-[11px] text-textMuted mt-1.5 leading-snug">{step.note}</p>}
              </li>
            ))}
          </ol>

          <div className="flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-mono font-bold text-emerald-400 tracking-widest mb-1">EXPECTED OUTPUT</p>
              <p className="text-[11px] text-emerald-100/80 leading-snug">{content.expectedOutput}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
