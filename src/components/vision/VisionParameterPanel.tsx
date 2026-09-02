// src/components/vision/VisionParameterPanel.tsx
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Badge, Button } from '../ui/Layout';
import { useToast } from '../ui/Toast';
import { useVisionSource } from '../../lib/vision/VisionSourceContext';
import { HsvTrackbarGroup } from './HsvTrackbarGroup';
import type { HsvTriplet, ParamValue, ParameterDef, ReconfigureKind } from '../../lib/vision/types';

interface VisionParameterPanelProps {
  schema: ParameterDef[];
  /** Whether the Track tab is currently active — used to re-sync this
   *  panel's displayed values from the source whenever it becomes visible
   *  again (see the effect below for why this matters). */
  active: boolean;
}

const RECONFIGURE_BADGE: Record<ReconfigureKind, { type: 'emerald' | 'amber' | 'purple'; label: string }> = {
  live: { type: 'emerald', label: 'live' },
  restart: { type: 'amber', label: 'restart' },
  investigate: { type: 'purple', label: 'investigate' },
};

/**
 * Vision-local, not shared with the sibling Hardware & Sensors Lab's
 * ParameterPanel.tsx — deliberate duplication, not an oversight. Each Lab
 * app's seam is meant to stay independently deletable, and this panel also
 * needs one control type (hsvTriplet) the sibling's doesn't have. See the
 * plan's Architecture Decision 6 for the full reasoning; see
 * src/components/sensors/ParameterPanel.tsx for the sibling this mirrors.
 *
 * The `active`-keyed re-sync effect below exists for a real, source-
 * grounded reason: CalibratePanel's "Copy to Track Config" button stages
 * hsv_lower/hsv_upper directly on the source, bypassing this component
 * entirely. Without re-deriving from source.getPendingValue() whenever
 * this tab becomes visible, this panel would keep showing a stale value
 * while a different one is actually about to be applied on Relaunch.
 */
export function VisionParameterPanel({ schema, active }: VisionParameterPanelProps) {
  const { source } = useVisionSource();
  const { showToast } = useToast();
  const [restarting, setRestarting] = useState(false);

  const seedDraft = (): Record<string, ParamValue> => {
    const next: Record<string, ParamValue> = {};
    for (const def of schema) {
      next[def.key] = source.getPendingValue(def.key) ?? source.getParameterValue(def.key) ?? def.default;
    }
    return next;
  };

  const [draft, setDraft] = useState<Record<string, ParamValue>>(seedDraft);

  useEffect(() => {
    if (active) setDraft(seedDraft());
    // Only re-sync on the active transition itself, not on every render —
    // this panel's own edits already update `draft` directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const isPending = (def: ParameterDef) => source.getPendingValue(def.key) !== undefined;
  const pendingCount = schema.filter(isPending).length;

  const handleChange = (def: ParameterDef, value: ParamValue) => {
    setDraft((d) => ({ ...d, [def.key]: value }));
    source.setParameterValue(def.key, value);
  };

  const handleRelaunch = async () => {
    setRestarting(true);
    try {
      const result = await source.restartDevice();
      showToast(
        result.ok ? 'Relaunched — staged parameters applied.' : result.errorMessage ?? 'Relaunch failed.',
        result.ok ? 'success' : 'error'
      );
      setDraft(seedDraft());
    } finally {
      setRestarting(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="params-panel-color_tracker">
      {schema.map((def) => (
        <VisionParameterRow
          key={def.key}
          def={def}
          value={draft[def.key]}
          pending={isPending(def)}
          onChange={(v) => handleChange(def, v)}
        />
      ))}

      {pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/5 px-4 py-3">
          <p className="text-xs text-amber-200/80">
            {pendingCount} parameter{pendingCount > 1 ? 's' : ''} staged — restart-required, not yet applied.
          </p>
          <span data-testid="relaunch-color_tracker">
            <Button size="sm" variant="outline" onClick={handleRelaunch} disabled={restarting} icon={RotateCw}>
              {restarting ? 'Relaunching…' : 'Relaunch'}
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}

function VisionParameterRow({
  def,
  value,
  pending,
  onChange,
}: {
  def: ParameterDef;
  value: ParamValue;
  pending: boolean;
  onChange: (value: ParamValue) => void;
}) {
  const badge = RECONFIGURE_BADGE[def.reconfigure];

  return (
    <div
      data-testid={`param-row-color_tracker-${def.key}`}
      className={`rounded-xl border px-4 py-3 transition-colors ${
        pending ? 'border-amber-400/40 bg-amber-400/5' : 'border-border/50 bg-black/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <label className="text-xs font-semibold text-text block">{def.label}</label>
          <code className="text-[10px] font-mono text-textDim">{def.key}</code>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {def.unit && <span className="text-[10px] font-mono text-textDim">{def.unit}</span>}
          <Badge type={badge.type}>{badge.label}</Badge>
        </div>
      </div>

      {def.type === 'hsvTriplet' && (
        <HsvTrackbarGroup
          label={def.key}
          value={value as HsvTriplet}
          onChange={onChange}
          testIdPrefix={`param-hsv-${def.key}`}
        />
      )}

      {def.type === 'number' && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={def.min}
            max={def.max}
            step={def.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-blue-400"
          />
          <span className="text-xs font-mono text-text w-16 text-right">{Number(value)}</span>
        </div>
      )}

      {def.type === 'boolean' && (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-emerald-500' : 'bg-white/10'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}

      <p className="text-[10px] text-textDim mt-2 leading-snug">{def.reconfigureNote}</p>
      {pending && <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">STAGED — relaunch to apply</p>}
    </div>
  );
}
