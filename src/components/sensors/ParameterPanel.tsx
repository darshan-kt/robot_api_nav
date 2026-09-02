// src/components/sensors/ParameterPanel.tsx
import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Badge, Button } from '../ui/Layout';
import { useToast } from '../ui/Toast';
import { useSensorSource } from '../../lib/sensors/SensorSourceContext';
import type { DeviceId, ParamValue, ParameterDef, ReconfigureKind } from '../../lib/sensors/types';

interface ParameterPanelProps {
  deviceId: DeviceId;
  schema: ParameterDef[];
}

const RECONFIGURE_BADGE: Record<ReconfigureKind, { type: 'emerald' | 'amber' | 'purple'; label: string }> = {
  live: { type: 'emerald', label: 'live' },
  restart: { type: 'amber', label: 'restart' },
  investigate: { type: 'purple', label: 'investigate' },
};

/**
 * Schema-driven, generic across both devices. Displayed control values are
 * LOCAL draft state, independent of what's actually applied in the source —
 * this is what lets a 'restart'-tagged edit show as staged/pending without
 * the SensorDataSource interface needing to expose pending values at all;
 * the panel just compares its own draft against source.getParameterValue().
 */
export function ParameterPanel({ deviceId, schema }: ParameterPanelProps) {
  const source = useSensorSource();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<Record<string, ParamValue>>(() => {
    const initial: Record<string, ParamValue> = {};
    for (const def of schema) initial[def.key] = source.getParameterValue(deviceId, def.key) ?? def.default;
    return initial;
  });
  const [restarting, setRestarting] = useState(false);
  // Bumped after a restart resolves, purely to force a re-render so the
  // "pending" comparison below re-reads source.getParameterValue().
  const [, setAppliedVersion] = useState(0);

  const isPending = (def: ParameterDef) =>
    def.reconfigure === 'restart' && draft[def.key] !== source.getParameterValue(deviceId, def.key);

  const pendingCount = schema.filter(isPending).length;

  const handleChange = (def: ParameterDef, value: ParamValue) => {
    setDraft((d) => ({ ...d, [def.key]: value }));
    source.setParameterValue(deviceId, def.key, value);
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const result = await source.restartDevice(deviceId);
      showToast(
        result.ok ? 'Device restarted — staged parameters applied.' : result.errorMessage ?? 'Restart failed.',
        result.ok ? 'success' : 'error'
      );
      setAppliedVersion((v) => v + 1);
    } finally {
      setRestarting(false);
    }
  };

  return (
    <div className="space-y-3" data-testid={`params-panel-${deviceId}`}>
      {schema.map((def) => (
        <ParameterRow
          key={def.key}
          deviceId={deviceId}
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
          <Button size="sm" variant="outline" onClick={handleRestart} disabled={restarting} icon={RotateCw}>
            {restarting ? 'Restarting…' : 'Restart Device'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ParameterRow({
  deviceId,
  def,
  value,
  pending,
  onChange,
}: {
  deviceId: DeviceId;
  def: ParameterDef;
  value: ParamValue;
  pending: boolean;
  onChange: (value: ParamValue) => void;
}) {
  const badge = RECONFIGURE_BADGE[def.reconfigure];

  return (
    <div
      data-testid={`param-row-${deviceId}-${def.key}`}
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

      {def.type === 'enum' && (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        >
          {def.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
            className="flex-1 accent-emerald-400"
          />
          <span className="text-xs font-mono text-text w-14 text-right">{Number(value)}</span>
        </div>
      )}

      {def.type === 'string' && (
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      )}

      <p className="text-[10px] text-textDim mt-2 leading-snug">{def.reconfigureNote}</p>
      {pending && <p className="text-[10px] text-amber-400 font-mono font-bold mt-1">STAGED — restart to apply</p>}
    </div>
  );
}
