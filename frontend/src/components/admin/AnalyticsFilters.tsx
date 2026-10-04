import React from 'react';
import type { AnalyticsFilterOptions, AnalyticsFiltersState } from '@/types/admin';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState;
  filterOptions: AnalyticsFilterOptions;
  onChange: (updated: AnalyticsFiltersState) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  filterOptions,
  onChange,
  onReset,
  isLoading = false,
}) => {
  const hasActiveFilters =
    filters.date_range !== '30d' ||
    filters.career_id != null ||
    (filters.concern && filters.concern !== 'all') ||
    (filters.severity && filters.severity !== 'all') ||
    (filters.concern_status && filters.concern_status !== 'all') ||
    (filters.language && filters.language !== 'all') ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date);

  const severityOptions = filterOptions.severities && filterOptions.severities.length > 0
    ? filterOptions.severities
    : ['LOW', 'MEDIUM', 'HIGH'];

  const statusOptions = filterOptions.statuses && filterOptions.statuses.length > 0
    ? filterOptions.statuses
    : ['OPEN', 'ADDRESSED', 'RESOLVED'];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4 text-brand-400" />
          <span>Analytics Filters</span>
          <span className="text-xs font-normal text-text-muted">
            (Aggregated server-side)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isLoading}
              className="h-8 gap-1.5 border-border/60 text-xs text-text-secondary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Date Range Preset */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <Calendar className="h-3.5 w-3.5 text-text-muted" />
            Date Period
          </label>
          <select
            value={filters.date_range}
            onChange={(e) => onChange({ ...filters, date_range: e.target.value })}
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Concern Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Concern Area
          </label>
          <select
            value={filters.concern ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                concern: e.target.value || null,
              })
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Concern Areas</option>
            {filterOptions.concerns.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Concern Severity Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Severity
          </label>
          <select
            value={filters.severity ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                severity: e.target.value || null,
              })
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Severities</option>
            {severityOptions.map((sev) => (
              <option key={sev} value={sev}>
                {sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Concern Status Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Resolution Status
          </label>
          <select
            value={filters.concern_status ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                concern_status: e.target.value || null,
              })
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st.charAt(0).toUpperCase() + st.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Career Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Career Track
          </label>
          <select
            value={filters.career_id ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                career_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Career Tracks</option>
            {filterOptions.careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Dialogue Language
          </label>
          <select
            value={filters.language ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                language: e.target.value || null,
              })
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Languages</option>
            {filterOptions.languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
