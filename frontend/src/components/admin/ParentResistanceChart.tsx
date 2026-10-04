import React from 'react';
import type { ParentResistanceAnalytics } from '@/types/admin';
import { Users, Compass, AlertCircle } from 'lucide-react';

interface ParentResistanceChartProps {
  data: ParentResistanceAnalytics;
}

export const ParentResistanceChart: React.FC<ParentResistanceChartProps> = ({
  data,
}) => {
  const hasResistanceData =
    data.parents_expressing_concerns > 0 ||
    data.resistance_by_career.length > 0 ||
    data.top_resistance_areas.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Parent Resistance by Vocational Career
          </h3>
          <p className="text-xs text-text-secondary">
            Observed friction points and parental reservations by targeted trade
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs text-text-secondary">
          <Users className="h-4 w-4 text-brand-300" />
          <span className="font-semibold text-text-primary">
            {data.parents_expressing_concerns}
          </span>
          <span>Parents Expressing Concerns</span>
        </div>
      </div>

      {!hasResistanceData ? (
        <div className="flex h-60 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-text-secondary">
            No parent resistance records for this period.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Objections to vocational careers will be catalogued here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Resistance by Career */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Compass className="h-3.5 w-3.5 text-brand-400" />
              Careers With Highest Parental Friction
            </h4>
            {data.resistance_by_career.length === 0 ? (
              <p className="text-xs text-text-muted py-4">
                No career-specific resistance cases recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {data.resistance_by_career.slice(0, 5).map((c, i) => (
                  <div
                    key={c.career_title}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-elevated/60 p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-900/60 text-xs font-semibold text-brand-200">
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium text-text-primary">
                          {c.career_title}
                        </span>
                      </div>
                      {c.top_concern && (
                        <div className="text-[11px] text-text-muted pl-7">
                          Primary objection: <span className="text-text-secondary">{c.top_concern}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-text-primary">
                        {c.count} {c.count === 1 ? 'case' : 'cases'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Resistance Areas */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              Most Common Resistance Areas
            </h4>
            {data.top_resistance_areas.length === 0 ? (
              <p className="text-xs text-text-muted py-4">
                No categorized resistance areas recorded.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.top_resistance_areas.slice(0, 5).map((a) => (
                  <div key={a.area} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text-secondary">{a.area}</span>
                      <span className="text-text-primary font-semibold">
                        {a.count} ({a.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${Math.min(a.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
