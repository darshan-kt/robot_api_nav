// src/components/vision/SourceKindSwitch.tsx
import { useEffect, useState } from 'react';
import { useVisionSource } from '../../lib/vision/VisionSourceContext';
import { useToast } from '../ui/Toast';
import type { SourceKind } from '../../lib/vision/types';

/**
 * The mock/webcam picker. 'live' is rendered as a visibly disabled option
 * — the seam's real 3-way shape stays legible in the UI even though
 * unbuilt, matching the sibling app's precedent of naming unfinished
 * territory rather than hiding it.
 *
 * Switching to 'webcam' triggers VisionSourceProvider to create a fresh
 * WebcamVisionSource (unrequested); the effect below picks up that NEW
 * instance via useVisionSource() and calls requestAccess() on it. On
 * failure, the switch reverts to 'mock' and the specific reason is shown
 * via toast — never leaving the UI in a silently-broken "webcam selected,
 * nothing streams" state.
 */
export function SourceKindSwitch({ className = '' }: { className?: string }) {
  const { source, sourceKind, setSourceKind } = useVisionSource();
  const { showToast } = useToast();
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (sourceKind !== 'webcam') return;
    let cancelled = false;
    setRequesting(true);

    source.requestAccess().then((result) => {
      if (cancelled) return;
      setRequesting(false);
      if (!result.ok) {
        showToast(result.errorMessage ?? 'Could not access the camera.', 'error');
        setSourceKind('mock');
      }
    });

    return () => {
      cancelled = true;
    };
    // source and setSourceKind are stable for a given sourceKind render;
    // re-running only on sourceKind/source change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKind, source]);

  const optionClass = (kind: SourceKind) =>
    `px-3 py-1.5 text-[11px] font-mono font-bold tracking-wider transition-colors ${
      sourceKind === kind ? 'bg-blue-400/15 text-blue-400' : 'text-textDim hover:text-textMuted'
    }`;

  return (
    <div
      data-testid="source-kind-switch"
      className={`inline-flex rounded-xl border border-border/50 overflow-hidden ${className}`}
    >
      <button data-testid="source-kind-option-mock" onClick={() => setSourceKind('mock')} className={optionClass('mock')}>
        MOCK
      </button>
      <button
        data-testid="source-kind-option-webcam"
        onClick={() => setSourceKind('webcam')}
        disabled={requesting}
        className={optionClass('webcam')}
      >
        {requesting ? 'REQUESTING…' : 'WEBCAM'}
      </button>
      <button
        data-testid="source-kind-option-live"
        disabled
        title="Live (robot camera) — not yet available"
        className="px-3 py-1.5 text-[11px] font-mono font-bold tracking-wider text-textDim opacity-40 cursor-not-allowed"
      >
        LIVE
      </button>
    </div>
  );
}
