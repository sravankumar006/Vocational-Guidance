import React from 'react';
import { Briefcase, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CounsellingCareerMetrics } from '@/types/counselling';
import { ExplainAction } from './ExplainAction';

export interface PlacementCardProps {
  metrics?: CounsellingCareerMetrics | null;
  careerId?: number | null;
  careerTitle?: string | null;
  className?: string;
}

export const PlacementCard: React.FC<PlacementCardProps> = ({
  metrics,
  careerId,
  careerTitle,
  className = '',
}) => {
  const hasPlacement =
    metrics &&
    metrics.placement_rate !== null &&
    metrics.placement_rate !== undefined;

  if (!hasPlacement) {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between ${className}`}
        role="region"
        aria-label="Placement Evidence"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Placement Outcomes
              </h4>
            </div>
            {careerTitle && (
              <ExplainAction
                intent="explain_placement"
                entityType="placement"
                entityId={careerId || 1}
                entityTitle={careerTitle}
                label="Explain this"
                size="xs"
                variant="outline"
              />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 pt-2">Placement data unavailable</p>
          <p className="text-xs text-slate-500">No verified tracer survey statistics reported for this trade yet.</p>
        </div>
      </div>
    );
  }

  const rate = metrics.placement_rate!;
  const period = metrics.placement_period;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 ${className}`}
      role="region"
      aria-label="Placement Evidence"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <Briefcase className="w-4 h-4 text-slate-700" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Placement / Employment
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <ExplainAction
              intent="explain_placement"
              entityType="placement"
              entityId={careerId || 1}
              entityTitle={careerTitle || 'Placement'}
              label="Explain this"
              size="xs"
              variant="outline"
            />
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {rate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Placement Rate</span>
          </div>

          {period && (
            <p className="text-xs text-slate-500 mt-1">
              Survey Cohort: <span className="font-medium text-slate-700">{period}</span>
            </p>
          )}
        </div>

        {/* Progress representation */}
        <div className="pt-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0%</span>
            <span>Target: 100%</span>
          </div>
        </div>
      </div>

      {/* Provenance footer */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
        <span className="truncate">
          Source: {metrics.placement_source || 'Government Tracer Survey'}
        </span>
        {metrics.placement_source_url && (
          <a
            href={metrics.placement_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 flex-shrink-0 font-medium underline underline-offset-2"
          >
            <span>Verify</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
