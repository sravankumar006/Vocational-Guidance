import React from 'react';
import type { AIUnansweredCategoryItem } from '@/types/admin';
import { HelpCircle } from 'lucide-react';

interface AIUnansweredQuestionsSectionProps {
  unansweredCount: number;
  unansweredRate: number;
  totalUserQuestions: number;
  categories: AIUnansweredCategoryItem[];
}

export const AIUnansweredQuestionsSection: React.FC<AIUnansweredQuestionsSectionProps> = ({
  unansweredCount,
  unansweredRate,
  totalUserQuestions,
  categories,
}) => {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Unanswered & Escalated Inquiries
          </h3>
        </div>
        <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-muted border border-border">
          {totalUserQuestions} Total Questions
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Unanswered Queries</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{unansweredCount}</span>
            <span className="text-xs font-semibold text-text-muted">({unansweredRate}%)</span>
          </div>
          <span className="text-[11px] text-text-muted">Required human escalation referral</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Directly Addressed Queries</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {Math.max(0, totalUserQuestions - unansweredCount)}
            </span>
            <span className="text-xs font-semibold text-text-muted">
              ({totalUserQuestions > 0 ? (100 - unansweredRate).toFixed(1) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-text-muted">Synthesized via grounded knowledge</span>
        </div>
      </div>

      {/* Structured Category Breakdown (Privacy Preserving - No Private Conversation Contents) */}
      <div className="mt-4 border-t border-border/30 pt-3">
        <div className="mb-2 text-xs font-medium text-text-secondary">
          Common Inquiry Topics Triggering Escalation:
        </div>
        {categories.length === 0 ? (
          <div className="py-2 text-xs text-text-muted italic">
            No specific topic clusters logged for unanswered inquiries in this period.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{cat.count} cases</span>
                  <span className="text-text-muted w-12 text-right">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
