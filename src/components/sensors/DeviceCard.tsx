// src/components/sensors/DeviceCard.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, SlidersHorizontal, StopCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Button } from '../ui/Layout';
import { useSensorFrame } from '../../hooks/useSensorFrame';
import { DataSourceBanner } from './DataSourceBanner';
import { ParameterPanel } from './ParameterPanel';
import { RunningInstructions } from './RunningInstructions';
import { RawFrameInspector } from './RawFrameInspector';
import { LidarPolarDial } from './LidarPolarDial';
import { DepthRgbDualView } from './DepthRgbDualView';
import { LidarBaudMismatchDemo } from './LidarBaudMismatchDemo';
import { DepthRegistrationToggle } from './DepthRegistrationToggle';
import type { AstraFramePair, DeviceContent, DeviceId, LidarScanFrame, ParameterDef } from '../../lib/sensors/types';

interface DeviceCardProps {
  deviceId: DeviceId;
  displayName: string;
  icon: LucideIcon;
  schema: ParameterDef[];
  content: DeviceContent;
}

const TOPIC_LABEL: Record<DeviceId, string> = {
  rplidar_a2: '/scan',
  astra_pro: '/camera/{depth,color}/image_raw',
};

/**
 * The generic per-device shell: header, always-visible honesty banner,
 * collapsible parameters, collapsible running instructions, an opt-in live
 * visualization (matching this app's established "nothing streams until
 * asked" convention — see useScan.ts), the raw-frame inspector, and the
 * device-specific interactive learning surface.
 */
export function DeviceCard({ deviceId, displayName, icon: Icon, schema, content }: DeviceCardProps) {
  const [liveOn, setLiveOn] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);
  const { frame, connected, measuredHz, sourceKind } = useSensorFrame(deviceId, liveOn);
  const topic = TOPIC_LABEL[deviceId];

  return (
    <div data-testid={`device-card-${deviceId}`}>
      <Card hover={false} theme="teal" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-teal-400/10 text-teal-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-text">{displayName}</h3>
            <p className="text-[10px] font-mono text-textMuted truncate">{topic}</p>
          </div>
        </div>

        <div className="space-y-4">
          <DataSourceBanner
            sourceKind={sourceKind}
            topic={topic}
            measuredHz={measuredHz}
            online={connected}
            deviceId={deviceId}
          />

          <div className="rounded-xl border border-border/50 overflow-hidden">
            <button
              data-testid={`params-toggle-${deviceId}`}
              onClick={() => setParamsOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
            >
              <span className="flex items-center gap-2 text-xs font-mono font-bold text-text tracking-widest">
                <SlidersHorizontal className="w-4 h-4 text-textDim" />
                PARAMETERS ({schema.length})
              </span>
              {paramsOpen ? (
                <ChevronUp className="w-4 h-4 text-textDim" />
              ) : (
                <ChevronDown className="w-4 h-4 text-textDim" />
              )}
            </button>
            {paramsOpen && (
              <div className="border-t border-border/50 p-4">
                <ParameterPanel deviceId={deviceId} schema={schema} />
              </div>
            )}
          </div>

          <RunningInstructions content={content} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono font-bold text-text tracking-widest">LIVE VISUALIZATION</p>
              <Button
                size="sm"
                variant={liveOn ? 'danger' : 'primary'}
                onClick={() => setLiveOn((o) => !o)}
                icon={liveOn ? StopCircle : PlayCircle}
              >
                {liveOn ? 'Stop' : 'Start Live View'}
              </Button>
            </div>

            {liveOn ? (
              deviceId === 'rplidar_a2' ? (
                <div className="flex justify-center py-2">
                  <LidarPolarDial frame={frame as LidarScanFrame | null} />
                </div>
              ) : (
                <DepthRgbDualView frame={frame as AstraFramePair | null} />
              )
            ) : (
              <div className="rounded-xl border border-dashed border-border/50 py-10 text-center">
                <p className="text-xs text-textMuted">Live view is off. Click Start to begin streaming simulated data.</p>
              </div>
            )}
          </div>

          <RawFrameInspector deviceId={deviceId} frame={frame} />

          {deviceId === 'rplidar_a2' ? <LidarBaudMismatchDemo /> : <DepthRegistrationToggle />}
        </div>
      </Card>
    </div>
  );
}
