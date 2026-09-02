// src/hooks/useSensorFrame.ts
import { useEffect, useState } from 'react';
import { useSensorSource } from '../lib/sensors/SensorSourceContext';
import type { DeviceId, DeviceStatus, FrameForDevice } from '../lib/sensors/types';

/**
 * Subscribes to one device's stream through the current SensorDataSource,
 * following the same opt-in convention every WebSocket hook in this app
 * already uses (see useScan.ts): nothing streams until `subscribed` is
 * true, and the frame is cleared to null the moment it goes false or the
 * component unmounts — stale data left on screen is worse than no data.
 */
export function useSensorFrame<D extends DeviceId>(deviceId: D, subscribed: boolean) {
  const source = useSensorSource();
  const [frame, setFrame] = useState<FrameForDevice<D> | null>(null);
  const [status, setStatus] = useState<DeviceStatus>(() => source.getStatus(deviceId));

  useEffect(() => {
    if (!subscribed) {
      setFrame(null);
      setStatus(source.getStatus(deviceId));
      return;
    }

    const unsubscribe = source.subscribe(deviceId, (f) => {
      setFrame(f);
      setStatus(source.getStatus(deviceId));
    });

    return () => {
      unsubscribe();
      setFrame(null);
      setStatus(source.getStatus(deviceId));
    };
  }, [source, deviceId, subscribed]);

  return {
    frame,
    connected: status.online,
    measuredHz: status.measuredHz,
    lastError: status.lastError,
    sourceKind: source.kind,
  };
}
