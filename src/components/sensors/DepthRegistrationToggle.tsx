// src/components/sensors/DepthRegistrationToggle.tsx
import { useState } from 'react';
import { useSensorSource } from '../../lib/sensors/SensorSourceContext';
import { LearningPanelShell } from './LearningPanelShell';

/**
 * The Astra Pro learning surface — unambiguous and explicitly requested as
 * a LIVE toggle (unlike the RPLIDAR baud demo, which is a one-shot
 * restart-shaped interaction; see LidarBaudMismatchDemo.tsx). Routed
 * through SensorDataSource.setParameterValue, which — per
 * depth_registration's 'investigate' tag in parameterSchemas.ts — applies
 * immediately in the mock. The explanation text is explicit that this
 * instant response is a simulator convenience, not a confirmed real-
 * hardware behaviour.
 */
export function DepthRegistrationToggle() {
  const source = useSensorSource();
  const [registered, setRegistered] = useState<boolean>(
    () => Boolean(source.getParameterValue('astra_pro', 'depth_registration'))
  );

  const handleToggle = () => {
    const next = !registered;
    setRegistered(next);
    source.setParameterValue('astra_pro', 'depth_registration', next);
  };

  return (
    <LearningPanelShell
      title="TRY IT: depth_registration"
      explanation={
        registered ? (
          <>
            <strong className="text-emerald-300">Aligned.</strong> With <code>depth_registration</code> true, the
            depth grid is explicitly aligned to the RGB frame — the point cloud on{' '}
            <code>depth_registered/points</code> is genuinely pixel-aligned RGB-D. In this simulator the change is
            instant. On real hardware, whether this parameter can be changed without restarting the driver is
            unconfirmed from the source read for this course — investigate before wiring a live backend.
          </>
        ) : (
          <>
            <strong className="text-amber-300">Misaligned — and this is the real driver's actual default.</strong>{' '}
            The point-cloud topic is still named <code>depth_registered/points</code>, but{' '}
            <code>depth_registration</code> defaults to <code>false</code>, so nothing has actually aligned the two
            streams. The topic name alone never confirms alignment happened — only this parameter does. Look at the
            overlay above: the depth blobs sit off the RGB shapes they belong to.
          </>
        )
      }
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={registered}
          data-testid="depth-registration-toggle-astra_pro"
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            registered ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              registered ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-xs font-mono font-bold text-text">
          depth_registration: {registered ? 'true' : 'false'}
        </span>
      </div>
    </LearningPanelShell>
  );
}
