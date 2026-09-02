// src/components/vision/TwistReadout.tsx
import type { TwistCommand } from '../../lib/vision/types';

interface TwistReadoutProps {
  twist: TwistCommand;
  className?: string;
}

/**
 * Numbers only — no gauge, no dial, deliberately plain. Explicitly labeled
 * simulated/non-hardware: this app never publishes a real /cmd_vel
 * anywhere, unlike RemoteControllerPage.tsx's real, safety-critical teleop
 * path elsewhere in this platform.
 */
export function TwistReadout({ twist, className = '' }: TwistReadoutProps) {
  return (
    <div data-testid="twist-readout" className={`rounded-xl border border-border/50 bg-black/20 px-4 py-3 ${className}`}>
      <p className="text-[9px] font-mono text-textDim tracking-widest mb-2">
        /cmd_vel (geometry_msgs/Twist) — computed here, never published anywhere
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-mono text-textDim">linear.x</p>
          <p className="text-lg font-mono font-bold text-text">{twist.linearX.toFixed(3)}</p>
          <p className="text-[9px] font-mono text-textDim">m/s</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-textDim">angular.z</p>
          <p className="text-lg font-mono font-bold text-text">{twist.angularZ.toFixed(3)}</p>
          <p className="text-[9px] font-mono text-textDim">rad/s</p>
        </div>
      </div>
    </div>
  );
}
