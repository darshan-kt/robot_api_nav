// src/components/vision/HsvTrackbarGroup.tsx
import type { HsvTriplet } from '../../lib/vision/types';

interface HsvTrackbarGroupProps {
  label: string;
  value: HsvTriplet;
  onChange: (next: HsvTriplet) => void;
  testIdPrefix: string;
  disabled?: boolean;
}

const CHANNELS = ['H', 'S', 'V'] as const;
// OpenCV's own trackbar ranges, matching hsv_calibrator.py's
// cv2.createTrackbar calls exactly: H is 0-179, S and V are 0-255.
const CHANNEL_MAX = [179, 255, 255] as const;

/**
 * One HSV triplet's worth of live sliders — the shared control atom.
 * CalibratePanel renders two instances (lower + upper) to reproduce
 * hsv_calibrator.py's six trackbars; VisionParameterPanel renders one per
 * hsv_lower/hsv_upper row, since those are two separate ROS parameters,
 * each a single 3-element array.
 */
export function HsvTrackbarGroup({ label, value, onChange, testIdPrefix, disabled }: HsvTrackbarGroupProps) {
  const handleChannelChange = (channelIndex: number, next: number) => {
    const nextTriplet = [...value] as HsvTriplet;
    nextTriplet[channelIndex] = next;
    onChange(nextTriplet);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono font-bold text-textDim tracking-widest">{label}</p>
      {CHANNELS.map((channel, i) => (
        <div key={channel} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-textMuted w-3">{channel}</span>
          <input
            type="range"
            min={0}
            max={CHANNEL_MAX[i]}
            value={value[i]}
            disabled={disabled}
            onChange={(e) => handleChannelChange(i, Number(e.target.value))}
            data-testid={`${testIdPrefix}-${channel.toLowerCase()}`}
            className="flex-1 accent-blue-400"
          />
          <span className="text-[10px] font-mono text-text w-8 text-right">{value[i]}</span>
        </div>
      ))}
    </div>
  );
}
