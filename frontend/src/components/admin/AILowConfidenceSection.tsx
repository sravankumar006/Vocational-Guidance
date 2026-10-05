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
          <span className="text-[11px] text-text-muted">Responses below threshold</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Low-Confidence Rate</span>
          <div className="mt-1 text-2xl font-bold text-text-primary">
            {lowConfidenceRate}%
          </div>
          <span className="text-[11px] text-text-muted">Of {totalAIResponses} total AI responses</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-surface-elevated/60 p-3.5">
          <span className="text-xs text-text-secondary">Configured Threshold</span>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            {confidenceThreshold.toFixed(2)}
          </div>
          <span className="text-[11px] text-text-muted">Low-confidence threshold: {confidenceThreshold.toFixed(2)}</span>
        </div>
      </div>

      {/* Telemetry Categorization Breakdown */}
      <div className="mt-4 border-t border-border/40 pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-secondary uppercase tracking-wider">
            Root Cause Categorization
          </span>
          <span className="text-[11px] text-text-muted italic">
            Telemetry Status
          </span>
        </div>

        <div className="rounded-lg border border-dashed border-border/80 bg-surface-elevated/30 p-3 text-xs text-text-muted space-y-1">
          <div className="font-medium text-text-secondary">
            Categorization unavailable with current telemetry
          </div>
          <p className="text-[11px] leading-relaxed text-text-muted">
            The underlying LLM response logging records numeric retrieval confidence scores, but fine-grained diagnostic tags (<em>Insufficient Evidence</em>, <em>Unsupported Question</em>, <em>Ambiguous Question</em>, <em>Low AI Confidence</em>) require future telemetry pipeline expansion. Raw text is preserved without speculative inference.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/40 bg-surface-elevated/40 p-3 text-xs text-text-muted">
        <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
        <span>
          Low-confidence threshold is currently configured at <strong>{confidenceThreshold.toFixed(2)}</strong>. AI responses below this threshold automatically trigger human counsellor referral flags to prevent hallucinations.
        </span>
      </div>
    </div>
  );
};
