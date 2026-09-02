// src/components/sensors/RawFrameInspector.tsx
import { useState } from 'react';
import { Braces, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface RawFrameInspectorProps {
  deviceId: string;
  frame: unknown;
}

/**
 * A collapsible dump of the exact JSON frame the device stream is emitting.
 * Needs no sourceKind special-casing at all: sourceKind is a literal field
 * inside every frame, so this is honest by construction — whatever the
 * frame actually says is exactly what's printed.
 */
export function RawFrameInspector({ deviceId, frame }: RawFrameInspectorProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const json = frame ? JSON.stringify(frame, null, 2) : null;

  const copy = async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      showToast('Raw frame copied to clipboard', 'success');
    } catch {
      showToast('Could not copy — clipboard unavailable', 'error');
    }
  };

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        data-testid={`raw-frame-toggle-${deviceId}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-mono font-bold text-text tracking-widest">
          <Braces className="w-4 h-4 text-textDim" />
          RAW FRAME INSPECTOR
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-textDim" /> : <ChevronDown className="w-4 h-4 text-textDim" />}
      </button>

      {open && (
        <div className="border-t border-border/50">
          {json ? (
            <div className="relative">
              <button
                onClick={copy}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-text transition-colors"
                title="Copy raw frame JSON"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <pre
                data-testid={`raw-frame-json-${deviceId}`}
                className="text-[10px] leading-relaxed font-mono text-emerald-300/90 bg-black/40 p-4 overflow-x-auto max-h-80 overflow-y-auto"
              >
                {json}
              </pre>
            </div>
          ) : (
            <p data-testid={`raw-frame-json-${deviceId}`} className="text-xs text-textMuted p-4 font-mono">
              No frame received yet — expand the live visualization above to start streaming.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
