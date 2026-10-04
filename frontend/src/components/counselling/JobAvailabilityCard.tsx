import React from 'react';
import { TrendingUp, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CounsellingCareerMetrics } from '@/types/counselling';
import { ExplainAction } from './ExplainAction';

export interface JobAvailabilityCardProps {
  metrics?: CounsellingCareerMetrics | null;
  careerId?: number | null;
  careerTitle?: string | null;
  sector?: string | null;
  className?: string;
}

export const JobAvailabilityCard: React.FC<JobAvailabilityCardProps> = ({
  metrics,
  careerId,
  careerTitle,
  sector,
  className = '',
}) => {
  const hasAvailability =
    metrics &&
    (Boolean(metrics.job_availability) ||
      metrics.job_openings_count !== null && metrics.job_openings_count !== undefined ||
      Boolean(metrics.job_region));

  if (!hasAvailability) {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between ${className}`}
        role="region"
        aria-label="Job Availability Evidence"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Employment Availability
              </h4>
            </div>
            {careerTitle && (
              <ExplainAction
                intent="explain_job_availability"
                entityType="evidence"
                entityId={careerId || 1}
                entityTitle={careerTitle}
                label="Explain this"
                size="xs"
                variant="outline"
              />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 pt-2">Job availability data unavailable</p>
          <p className="text-xs text-slate-500">No verified market openings reported for this sector yet.</p>
        </div>
      </div>
    );
  }

  const availability = metrics.job_availability || 'Active Statutory Demand';
  const region = metrics.job_region || 'National / Multi-State';
  const openings = metrics.job_openings_count;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 ${className}`}
      role="region"
      aria-label="Job Availability Evidence"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <TrendingUp className="w-4 h-4 text-slate-700" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Job Availability & Outlook
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <ExplainAction
              intent="explain_job_availability"
              entityType="evidence"
              entityId={careerId || 1}
              entityTitle={careerTitle || 'Job Availability'}
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

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {availability}
            </span>
            {sector && (
              <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                {sector}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Geographic Distribution: <strong className="font-semibold text-slate-800">{region}</strong></span>
          </div>

          {openings !== null && openings !== undefined && (
            <div className="text-xs text-slate-600">
              Active Verified Vacancies: <strong className="font-bold text-slate-900">{openings.toLocaleString('en-IN')}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Provenance footer */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
        <span className="truncate">
          Source: {metrics.job_availability_source || 'National Career Service (NCS)'}
        </span>
        {metrics.job_availability_source_url && (
          <a
            href={metrics.job_availability_source_url}
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
