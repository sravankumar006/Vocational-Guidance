import React from 'react';
import type { AIResolutionBreakdown } from '@/types/admin';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface AIResolutionChartProps {
  breakdown: AIResolutionBreakdown;
  totalSessions: number;
}

export const AIResolutionChart: React.FC<AIResolutionChartProps> = ({
  breakdown,
  totalSessions,
}) => {
  if (totalSessions === 0) {
    return null;
  }

  const resolvedPct = roundPct(breakdown.resolved, totalSessions);
  const escalatedPct = roundPct(breakdown.escalated, totalSessions);
  const activePct = roundPct(breakdown.active_unresolved, totalSessions);

  function roundPct(count: number, total: number) {
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  }

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Session Resolution & Escalation Breakdown
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Comparative analysis of AI counselling session outcomes
          </p>
        </div>
        <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-muted border border-border">
          {totalSessions} Sessions Evaluated
        </span>
      </div>

      {/* Visual Stacked Progress Bar */}
      <div className="space-y-2">
        <div className="flex h-5 w-full overflow-hidden rounded-full bg-surface-elevated border border-border/80">
          {breakdown.resolved > 0 && (
            <div
              style={{ width: `${resolvedPct}%` }}
              className="bg-emerald-500 transition-all duration-500 hover:opacity-90"
              title={`Resolved: ${breakdown.resolved} (${resolvedPct}%)`}
            />
          )}
          {breakdown.escalated > 0 && (
            <div
              style={{ width: `${escalatedPct}%` }}
              className="bg-amber-500 transition-all duration-500 hover:opacity-90"
              title={`Escalated: ${breakdown.escalated} (${escalatedPct}%)`}
            />
          )}
          {breakdown.active_unresolved > 0 && (
            <div
              style={{ width: `${activePct}%` }}
              className="bg-blue-500/60 transition-all duration-500 hover:opacity-90"
              title={`Active / In-Progress: ${breakdown.active_unresolved} (${activePct}%)`}
            />
          )}
        </div>

        {/* Legend / Breakdown cards */}
        <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
          {/* Resolved */}
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-elevated/60 p-3">
            <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-secondary">Resolved Automatically</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">{breakdown.resolved}</span>
                <span className="text-xs font-semibold text-emerald-400">{resolvedPct}%</span>
              </div>
              <p className="mt-0.5 text-[11px] text-text-muted">Completed with no escalation needed</p>
            </div>
          </div>

          {/* Escalated */}
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-elevated/60 p-3">
            <div className="mt-0.5 rounded-full bg-amber-500/10 p-1.5 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-secondary">Escalated to Human</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">{breakdown.escalated}</span>
                <span className="text-xs font-semibold text-amber-400">{escalatedPct}%</span>
              </div>
              <p className="mt-0.5 text-[11px] text-text-muted">Referred to human counselling staff</p>
            </div>
          </div>

          {/* In-Progress */}
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-elevated/60 p-3">
            <div className="mt-0.5 rounded-full bg-blue-500/10 p-1.5 text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-secondary">Active / In-Progress</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-text-primary">{breakdown.active_unresolved}</span>
                <span className="text-xs font-semibold text-blue-400">{activePct}%</span>
              </div>
              <p className="mt-0.5 text-[11px] text-text-muted">Active dialogue ongoing without referral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
