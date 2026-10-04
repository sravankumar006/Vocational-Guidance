import React from 'react';
import type { SentimentStageData } from '@/types/admin';
import { ArrowRight, ArrowDown, HelpCircle, CheckCircle2, MessageSquare } from 'lucide-react';

interface CounsellingStageFlowProps {
  before?: SentimentStageData;
  during?: SentimentStageData | null;
  after?: SentimentStageData;
  canCompare: boolean;
}

export const CounsellingStageFlow: React.FC<CounsellingStageFlowProps> = ({
  before,
  during,
  after,
  canCompare,
}) => {
  const getDominantSentiment = (stage?: SentimentStageData) => {
    if (!stage || !stage.categories || stage.categories.length === 0) return 'No data';
    const sorted = [...stage.categories].sort((a, b) => b.count - a.count);
    if (!sorted[0] || sorted[0].count === 0) return 'No data';
    return `${sorted[0].sentiment.charAt(0).toUpperCase() + sorted[0].sentiment.slice(1)} (${sorted[0].percentage}%)`;
  };

  return (
    <div className="rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-text-primary">
            Counselling Stage Progression
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Observed sentiment across counselling stages
          </p>
        </div>
        <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-text-muted self-start sm:self-auto">
          {canCompare ? 'Sufficient Telemetry for Comparison' : 'Partial Stage Telemetry'}
        </div>
      </div>

      {/* Responsive Visual Flow: Columns on desktop, Stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3">
        {/* Stage 1: Before Counselling */}
        <div className="md:col-span-1 flex flex-col justify-between rounded-lg border border-border/70 bg-surface-elevated/70 p-4 transition-all hover:border-brand-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Stage 1</span>
            <HelpCircle className="h-4 w-4 text-amber-400/80" />
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-text-primary">Before counselling</h4>
            <p className="text-xs text-text-secondary mt-0.5">Initial recorded orientation</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Total observations:</span>
              <span className="font-semibold text-text-primary">{before?.total ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Dominant state:</span>
              <span className="font-medium text-amber-300 capitalize">{getDominantSentiment(before)}</span>
            </div>
          </div>
        </div>

        {/* Transition Indicator 1 */}
        <div className="flex items-center justify-center text-text-muted py-2 md:py-0">
          <ArrowDown className="h-5 w-5 md:hidden text-brand-400" />
          <ArrowRight className="hidden md:block h-5 w-5 text-brand-400/70" />
        </div>

        {/* Stage 2: Counselling */}
        <div className="md:col-span-1 flex flex-col justify-between rounded-lg border border-border/70 bg-surface-elevated/70 p-4 transition-all hover:border-brand-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Stage 2</span>
            <MessageSquare className="h-4 w-4 text-blue-400/80" />
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-text-primary">Counselling</h4>
            <p className="text-xs text-text-secondary mt-0.5">Active guidance dialogue</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Observations:</span>
              <span className="font-semibold text-text-primary">
                {during?.is_available ? during.total : 'Continuous'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Dialogue state:</span>
              <span className="font-medium text-blue-300 capitalize">
                {during?.is_available ? getDominantSentiment(during) : 'Interaction phase'}
              </span>
            </div>
          </div>
        </div>

        {/* Transition Indicator 2 */}
        <div className="flex items-center justify-center text-text-muted py-2 md:py-0">
          <ArrowDown className="h-5 w-5 md:hidden text-brand-400" />
          <ArrowRight className="hidden md:block h-5 w-5 text-brand-400/70" />
        </div>

        {/* Stage 3: After Counselling */}
        <div className="md:col-span-1 flex flex-col justify-between rounded-lg border border-border/70 bg-surface-elevated/70 p-4 transition-all hover:border-brand-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Stage 3</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400/80" />
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-text-primary">After counselling</h4>
            <p className="text-xs text-text-secondary mt-0.5">Post-session orientation</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Total observations:</span>
              <span className="font-semibold text-text-primary">{after?.total ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Dominant state:</span>
              <span className="font-medium text-emerald-300 capitalize">{getDominantSentiment(after)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
