// src/lib/sensors/SensorSourceContext.tsx
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { SensorDataSource } from './SensorDataSource';
import { MockSensorSource } from './MockSensorSource';

/**
 * Wires ONE SensorDataSource instance for the whole page. This is the
 * single place a concrete implementation gets chosen — every component
 * below it calls useSensorSource() and never imports MockSensorSource (or,
 * eventually, LiveSensorSource) directly. Swapping sources later means
 * changing the one line marked below, nothing else.
 */
const SensorSourceContext = createContext<SensorDataSource | null>(null);

export function SensorSourceProvider({ children }: { children: ReactNode }) {
  // The one line a future backend swap changes:
  const source = useMemo<SensorDataSource>(() => new MockSensorSource(), []);

  useEffect(() => {
    return () => source.dispose();
  }, [source]);

  return <SensorSourceContext.Provider value={source}>{children}</SensorSourceContext.Provider>;
}

export function useSensorSource(): SensorDataSource {
  const source = useContext(SensorSourceContext);
  if (!source) throw new Error('useSensorSource must be used within SensorSourceProvider');
  return source;
}
