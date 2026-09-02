// src/hooks/useVisionFrame.ts
import { useEffect, useState } from 'react';
import { useVisionSource } from '../lib/vision/VisionSourceContext';
import type { CameraFrame, DeviceStatus } from '../lib/vision/types';

/**
 * Subscribes to the current VisionDataSource's camera stream. Same opt-in
 * convention as every WebSocket hook in this app family (see useScan.ts /
 * useSensorFrame.ts): nothing streams until `subscribed` is true, and the
 * frame is cleared to null the moment it goes false or the source itself
 * changes (mock <-> webcam) — stale frames left on screen are worse than
 * no frame.
 */
export function useVisionFrame(subscribed: boolean) {
  const { source, sourceKind } = useVisionSource();
  const [frame, setFrame] = useState<CameraFrame | null>(null);
  const [status, setStatus] = useState<DeviceStatus>(() => source.getStatus());

  useEffect(() => {
    if (!subscribed) {
      setFrame(null);
      setStatus(source.getStatus());
      return;
    }

    const unsubscribe = source.subscribeCamera((f) => {
      setFrame(f);
      setStatus(source.getStatus());
    });

    return () => {
      unsubscribe();
      setFrame(null);
      setStatus(source.getStatus());
    };
  }, [source, subscribed]);

  return {
    frame,
    connected: status.online,
    measuredHz: status.measuredHz,
    lastError: status.lastError,
    sourceKind,
  };
}
