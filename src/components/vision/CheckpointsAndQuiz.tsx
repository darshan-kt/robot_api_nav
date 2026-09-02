// src/components/vision/CheckpointsAndQuiz.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, GraduationCap } from 'lucide-react';
import type { QuizQA, TrackingLabContent } from '../../lib/vision/types';

interface CheckpointsAndQuizProps {
  content: TrackingLabContent;
}

/**
 * This app's content is objectively richer than the sibling Hardware &
 * Sensors Lab's (6 checkpoints + 4 quiz sections + a practical assessment,
 * vs. that app's failure-mode list) — it earns one additional section
 * rather than being crammed into RunningInstructions.
 */
export function CheckpointsAndQuiz({ content }: CheckpointsAndQuizProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <button
        data-testid="checkpoints-quiz-toggle-color_tracker"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/20 hover:bg-black/30 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-mono font-bold text-text tracking-widest">
          <GraduationCap className="w-4 h-4 text-textDim" />
          VERIFY &amp; LEARN
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-textDim" /> : <ChevronDown className="w-4 h-4 text-textDim" />}
      </button>

      {open && (
        <div className="border-t border-border/50 p-4 space-y-5">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-textDim tracking-widest mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              VERIFICATION CHECKPOINTS
            </p>
            <ul className="space-y-2">
              {content.checkpoints.map((cp, i) => (
                <li key={i} className="rounded-lg border border-border/50 bg-black/10 px-3 py-2.5">
                  <p className="text-xs font-semibold text-text mb-1">{cp.title}</p>
                  <ul className="list-disc list-inside text-[11px] text-textMuted space-y-0.5 mb-1.5">
                    {cp.verificationSteps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-emerald-300/80">✓ {cp.expectedResult}</p>
                </li>
              ))}
            </ul>
          </div>

          {content.quizSections.map((section, si) => (
            <div key={si}>
              <p className="text-[10px] font-mono font-bold text-textDim tracking-widest mb-2">
                {section.sectionTitle.toUpperCase()}
              </p>
              <div className="space-y-2">
                {section.items.map((qa, qi) => (
                  <QuizItem key={qi} qa={qa} />
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-purple-400/30 bg-purple-400/5 px-3 py-3">
            <p className="text-xs font-bold text-purple-300 mb-1">{content.practicalAssessment.title}</p>
            <p className="text-[11px] text-purple-100/70 mb-2 leading-snug">{content.practicalAssessment.prompt}</p>
            <ul className="space-y-1">
              {content.practicalAssessment.successCriteria.map((c, i) => (
                <li key={i} className="text-[11px] text-textMuted flex items-start gap-1.5">
                  <span className="text-purple-400 shrink-0">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizItem({ qa }: { qa: QuizQA }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg border border-border/50 bg-black/10 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-text mb-1.5">{qa.question}</p>
      {revealed ? (
        <p className="text-[11px] text-emerald-300/80 leading-snug">{qa.answer}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 tracking-wide"
        >
          SHOW ANSWER
        </button>
      )}
    </div>
  );
}
