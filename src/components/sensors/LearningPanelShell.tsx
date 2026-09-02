// src/components/sensors/LearningPanelShell.tsx
import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LearningPanelShellProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  explanation: ReactNode;
}

/**
 * Tiny shared shell for the per-device interactive learning surface: a
 * title, a control slot, and an explanation slot that updates with the
 * control — turning a course finding into something the learner causes and
 * immediately sees explained, rather than reads about.
 */
export function LearningPanelShell({ title, icon: Icon = Lightbulb, children, explanation }: LearningPanelShellProps) {
  return (
    <div className="rounded-xl border border-purple-400/30 bg-purple-400/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-purple-400" />
        <p className="text-xs font-mono font-bold text-purple-300 tracking-widest">{title}</p>
      </div>
      <div className="mb-3">{children}</div>
      <div className="text-[11px] text-purple-100/70 leading-snug border-t border-purple-400/20 pt-3">
        {explanation}
      </div>
    </div>
  );
}
