// src/components/sensors/RunningInstructions.tsx
import { useState } from 'react';
import { AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { Badge } from '../ui/Layout';
import type { DeviceContent } from '../../lib/sensors/types';

interface RunningInstructionsProps {
  content: DeviceContent;
}

/**
 * The real, course-verified setup commands and failure-mode diagnostics —
 * collapsed/expandable inline, not a link out. Every string here is copied
 * verbatim from src/lib/sensors/content/*.content.ts, which cites its exact
 * source section — see that file's header comment for the "app and course
 * must never disagree" rule this exists to satisfy.
 */
export function RunningInstructions({ content }: RunningInstructionsProps) {
  const [open, setOpen] = useState(false);
  const [failuresOpen, setFailuresOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        data-testid={`running-instructions-toggle-${content.deviceId}`}
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

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setFailuresOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-black/10 hover:bg-black/20 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-[10px] font-mono font-bold text-textMuted tracking-widest">
                <AlertOctagon className="w-3.5 h-3.5" />
                {content.failureModes.length} KNOWN FAILURE MODES
              </span>
              {failuresOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-textDim" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-textDim" />
              )}
            </button>

            {failuresOpen && (
              <ul className="divide-y divide-border/30">
                {content.failureModes.map((fm, i) => (
                  <li key={i} className="px-3 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge type="rose">{i + 1}</Badge>
                      <p className="text-xs font-semibold text-text">{fm.title}</p>
                    </div>
                    <code className="block text-[10px] font-mono text-rose-300/90 bg-black/30 rounded px-2 py-1.5 mb-1.5 whitespace-pre-wrap">
                      {fm.diagnosticSignature}
                    </code>
                    <p className="text-[11px] text-textMuted leading-snug">{fm.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
