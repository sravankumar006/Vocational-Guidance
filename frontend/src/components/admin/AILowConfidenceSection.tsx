import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface AILowConfidenceSectionProps {
  lowConfidenceCount: number;
  lowConfidenceRate: number;
  totalAIResponses: number;
  confidenceThreshold: number;
}

export const AILowConfidenceSection: React.FC<AILowConfidenceSectionProps> = ({
  lowConfidenceCount,
  lowConfidenceRate,
  totalAIResponses,
  confidenceThreshold,
}) => {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Low-Confidence Responses Analysis
          </h3>
        </div>
        <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-muted border border-border">
          Threshold: &lt; {confidenceThreshold}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Low-Confidence Total</span>
          <div className="mt-1 text-2xl font-bold text-sky-400">
            {lowConfidenceCount}
          </div>
          <span className="text-[11px] text-text-muted">Below configured threshold</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Low-Confidence Rate</span>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {lowConfidenceRate}%
          </div>
          <span className="text-[11px] text-text-muted">Share of all AI responses</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Total AI Responses Evaluated</span>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {totalAIResponses}
          </div>
          <span className="text-[11px] text-text-muted">Synthesized assistant turns</span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/40 bg-surface-elevated/40 p-3 text-xs text-text-muted">
        <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
        <span>
          Confidence scores reflect the grounded retrieval confidence and validation score evaluated during response synthesis. Responses below {confidenceThreshold} are logged for quality assurance and human referral review.
        </span>
      </div>
    </div>
  );
};
