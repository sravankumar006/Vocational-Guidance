import React from 'react';
import { HelpCircle, ArrowUpRight } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion,
  disabled,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        <span>Suggested follow-up inquiries:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xs text-left"
          >
            <span>{q}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-800 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
