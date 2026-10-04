import React from 'react';
import { IndianRupee, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CounsellingCareerMetrics } from '@/types/counselling';
import { ExplainAction } from './ExplainAction';

export interface SalaryCardProps {
  metrics?: CounsellingCareerMetrics | null;
  careerId?: number | null;
  careerTitle?: string | null;
  className?: string;
}

export const SalaryCard: React.FC<SalaryCardProps> = ({
  metrics,
  careerId,
  careerTitle,
  className = '',
}) => {
  const hasSalary =
    metrics &&
    (metrics.salary_min !== null && metrics.salary_min !== undefined ||
      metrics.salary_max !== null && metrics.salary_max !== undefined);

  if (!hasSalary) {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between ${className}`}
        role="region"
        aria-label="Salary Evidence"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Salary
              </h4>
            </div>
            {careerTitle && (
              <ExplainAction
                intent="explain_salary"
                entityType="salary"
                entityId={careerId || 1}
                entityTitle={careerTitle}
                label="Explain this"
                size="xs"
                variant="outline"
              />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 pt-2">Salary data unavailable</p>
          <p className="text-xs text-slate-500">No verified wage records registered for this occupation yet.</p>
        </div>
      </div>
    );
  }

  const min = metrics.salary_min;
  const max = metrics.salary_max;
  const currency = metrics.salary_currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : `${currency} `;
  const period = metrics.salary_period || 'month';

  const formatAmount = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '';
    return `${currencySymbol}${num.toLocaleString('en-IN')}`;
  };

  const formattedSalary =
    min && max
      ? `${formatAmount(min)} – ${formatAmount(max)}`
      : min
      ? `Starting from ${formatAmount(min)}`
      : `Up to ${formatAmount(max)}`;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 ${className}`}
      role="region"
      aria-label="Salary Evidence"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <IndianRupee className="w-4 h-4 text-slate-700" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Verified Salary Range
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <ExplainAction
              intent="explain_salary"
              entityType="salary"
              entityId={careerId || 1}
              entityTitle={careerTitle || 'Salary'}
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
          <div className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            {formattedSalary}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Per {period}</span>
            {metrics.experience_level && (
              <>
                <span>•</span>
                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {metrics.experience_level}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Calm range progression bar */}
        {min && max && min < max && (
          <div className="pt-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-slate-700 h-full rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>{formatAmount(min)}</span>
              <span>{formatAmount(max)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Provenance footer */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
        <span className="truncate">
          Source: {metrics.salary_source || 'Statutory Employment Registry'}
        </span>
        {metrics.salary_source_url && (
          <a
            href={metrics.salary_source_url}
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
