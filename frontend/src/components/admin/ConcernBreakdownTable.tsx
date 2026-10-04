import React from 'react';
import type {
  ConcernSeverityItem,
  ConcernStatusItem,
  CareerConcernBreakdownItem,
} from '@/types/admin';
import { AlertTriangle, CheckCircle2, Briefcase } from 'lucide-react';

interface ConcernBreakdownTableProps {
  severities?: ConcernSeverityItem[];
  statuses?: ConcernStatusItem[];
  careerBreakdown?: CareerConcernBreakdownItem[];
  total: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const STATUS_COLORS: Record<string, string> = {
  Resolved: '#10b981',
  Addressed: '#3b82f6',
  Open: '#f59e0b',
};

export const ConcernBreakdownTable: React.FC<ConcernBreakdownTableProps> = ({
  severities = [],
  statuses = [],
  careerBreakdown = [],
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Severity Distribution Card */}
      <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-text-primary">
              Severity Distribution
            </h4>
          </div>
          <span className="text-[11px] text-text-muted">Urgency classification</span>
        </div>

        <div className="space-y-3 pt-1">
          {severities.map((item) => (
            <div key={item.severity} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">{item.severity}</span>
                <span className="font-semibold text-text-primary">
                  {item.count}{' '}
                  <span className="font-normal text-text-muted">
                    ({item.percentage}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-base">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: SEVERITY_COLORS[item.severity] || '#64748b',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Resolution Status Distribution Card */}
      <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-text-primary">
              Resolution Status
            </h4>
          </div>
          <span className="text-[11px] text-text-muted">Lifecycle tracking</span>
        </div>

        <div className="space-y-3 pt-1">
          {statuses.map((item) => (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">{item.status}</span>
                <span className="font-semibold text-text-primary">
                  {item.count}{' '}
                  <span className="font-normal text-text-muted">
                    ({item.percentage}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-base">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, item.percentage)}%`,
                    backgroundColor: STATUS_COLORS[item.status] || '#64748b',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Career Track Correlation Card (Section 6) */}
      <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-brand-400" />
            <h4 className="text-sm font-semibold text-text-primary">
              Career Track Correlation
            </h4>
          </div>
          <span className="text-[11px] text-text-muted">Section 6 breakdown</span>
        </div>

        {careerBreakdown.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-text-muted">
              No specific vocational career intent linked to current filtered concerns.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1 pt-1">
            {careerBreakdown.slice(0, 5).map((c) => (
              <div
                key={c.career_title}
                className="flex items-center justify-between rounded-lg bg-surface-elevated/40 p-2 text-xs"
              >
                <div className="truncate max-w-[140px]">
                  <div className="font-medium text-text-primary truncate">
                    {c.career_title}
                  </div>
                  {c.top_concern && (
                    <div className="text-[10px] text-text-muted truncate">
                      Top: {c.top_concern}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">{c.count}</div>
                  <div className="text-[10px] text-text-muted">{c.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
