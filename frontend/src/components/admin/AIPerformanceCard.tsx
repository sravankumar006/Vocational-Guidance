import React from 'react';
import type { AIPerformanceSummary } from '@/types/admin';
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface AIPerformanceCardProps {
  summary: AIPerformanceSummary;
  confidenceThreshold: number;
}

export const AIPerformanceCards: React.FC<AIPerformanceCardProps> = ({
  summary,
  confidenceThreshold,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Total AI Sessions */}
      <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-medium">Total AI Sessions</span>
          <MessageSquare className="h-4 w-4 text-brand-300" />
        </div>
        <div className="mt-2 text-2xl font-bold text-text-primary">
          {summary.total_sessions}
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          {summary.total_ai_responses} AI dialogue turns
        </div>
      </div>

      {/* 2. Resolution Rate */}
      <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-medium">Resolution Rate</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-400">
            {summary.resolution_rate}%
          </span>
          <span className="text-xs text-text-muted">
            ({summary.resolved_sessions})
          </span>
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Completed without human intervention
        </div>
      </div>

      {/* 3. Escalation Rate */}
      <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-medium">Escalation Rate</span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-amber-400">
            {summary.escalation_rate}%
          </span>
          <span className="text-xs text-text-muted">
            ({summary.escalated_sessions})
          </span>
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Referred to human counsellor
        </div>
      </div>

      {/* 4. Low-Confidence Responses */}
      <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-medium">Low-Confidence Responses</span>
          <ShieldAlert className="h-4 w-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-sky-400">
            {summary.low_confidence_responses}
          </span>
          <span className="text-xs text-text-muted">
            ({summary.low_confidence_rate}%)
          </span>
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Scored below &lt; {confidenceThreshold} threshold
        </div>
      </div>

      {/* 5. Unanswered Questions */}
      <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-xs font-medium">Unanswered Questions</span>
          <HelpCircle className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-purple-400">
            {summary.unanswered_questions}
          </span>
          <span className="text-xs text-text-muted">
            ({summary.unanswered_rate}%)
          </span>
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Required human referral or unsupported
        </div>
      </div>
    </div>
  );
};
