// src/lib/vision/VisionSourceContext.tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { VisionDataSource } from './VisionDataSource';
import type { SourceKind } from './types';
import { MockVisionSource } from './MockVisionSource';
import { WebcamVisionSource } from './WebcamVisionSource';

interface VisionSourceContextValue {
  source: VisionDataSource;
  sourceKind: SourceKind;
  /** Swaps the concrete instance. Rejects 'live' silently (a no-op) — that
   *  kind is reserved/unbuilt; SourceKindSwitch renders it as a visibly
   *  disabled option rather than ever calling this with it. */
  setSourceKind: (kind: SourceKind) => void;
}

/**
 * Differs from the sibling Hardware & Sensors Lab's SensorSourceContext in
 * one structural way this app genuinely needs: the USER picks mock vs
 * webcam at runtime, so this provider owns SourceKind state and swaps the
 * concrete instance on change (the sibling's context never swaps its one
 * MockSensorSource instance). The old instance is disposed before/as the
 * new one takes over, via the effect below keyed on `source` itself.
 */
const VisionSourceContext = createContext<VisionSourceContextValue | null>(null);

function createSource(kind: SourceKind): VisionDataSource {
  if (kind === 'webcam') return new WebcamVisionSource();
  return new MockVisionSource(); // 'mock', and the reserved/unbuilt 'live', both fall back to mock
}

export function VisionSourceProvider({ children }: { children: ReactNode }) {
  const [sourceKind, setSourceKindState] = useState<SourceKind>('mock');
  const source = useMemo<VisionDataSource>(() => createSource(sourceKind), [sourceKind]);

  useEffect(() => {
    return () => source.dispose();
  }, [source]);

  const setSourceKind = (kind: SourceKind) => {
    if (kind === 'live') return;
    setSourceKindState(kind);
  };

  return (
    <VisionSourceContext.Provider value={{ source, sourceKind, setSourceKind }}>
      {children}
    </VisionSourceContext.Provider>
  );
}

export function useVisionSource(): VisionSourceContextValue {
  const ctx = useContext(VisionSourceContext);
  if (!ctx) throw new Error('useVisionSource must be used within VisionSourceProvider');
  return ctx;
}
