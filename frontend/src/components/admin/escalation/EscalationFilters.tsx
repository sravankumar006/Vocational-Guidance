import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { EscalationFilterParams } from '@/types/adminEscalation';

interface EscalationFiltersProps {
  filters: EscalationFilterParams;
  onChange: (updated: Partial<EscalationFilterParams>) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const CONCERN_OPTIONS = [
  'Income',
  'Job Security',
  'Further Education',
  'Social Perception',
  'Distance',
  'Working Conditions',
  'Career Growth',
  'Other',
];

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Telugu', value: 'te' },
  { label: 'Hindi', value: 'hi' },
];

export const EscalationFilters: React.FC<EscalationFiltersProps> = ({
  filters,
  onChange,
  onReset,
  isLoading = false,
}) => {
  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) ||
      (filters.status && filters.status !== 'all') ||
      (filters.language && filters.language !== 'all') ||
      (filters.concern && filters.concern !== 'all') ||
      (filters.sort && filters.sort !== 'pending_first') ||
      filters.start_date ||
      filters.end_date
  );

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3.5 shadow-sm">
      {/* Top Row: Search and Status Badges */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            placeholder="Search by student, parent, career, concern, or summary..."
            disabled={isLoading}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Status Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All Statuses', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
          ].map((st) => {
            const isSelected = (filters.status || 'all') === st.value;
            return (
              <button
                key={st.value}
                onClick={() => onChange({ status: st.value, page: 1 })}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-accent/15 text-accent border-accent/40 font-semibold'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Concern, Language, Time, Sort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 border-t border-border/50 text-xs">
        {/* Concern Filter */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Parent Concern</label>
          <select
            value={filters.concern || 'all'}
            onChange={(e) => onChange({ concern: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Concerns</option>
            {CONCERN_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Language</label>
          <select
            value={filters.language || 'all'}
            onChange={(e) => onChange({ language: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Languages</option>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Sorting</label>
          <select
            value={filters.sort || 'pending_first'}
            onChange={(e) => onChange({ sort: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="pending_first">Pending First + Newest</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="recently_updated">Recently Updated</option>
          </select>
        </div>

        {/* Time Filter */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Time Horizon</label>
          <select
            value={
              filters.start_date
                ? filters.start_date.includes('7')
                  ? '7d'
                  : filters.start_date.includes('30')
                  ? '30d'
                  : 'custom'
                : 'all'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                onChange({ start_date: undefined, end_date: undefined, page: 1 });
              } else if (val === '7d') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                onChange({ start_date: d.toISOString().slice(0, 10), end_date: undefined, page: 1 });
              } else if (val === '30d') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                onChange({ start_date: d.toISOString().slice(0, 10), end_date: undefined, page: 1 });
              } else if (val === '90d') {
                const d = new Date();
                d.setDate(d.getDate() - 90);
                onChange({ start_date: d.toISOString().slice(0, 10), end_date: undefined, page: 1 });
              }
            }}
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters || isLoading}
            className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              hasActiveFilters
                ? 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                : 'border-border/40 text-text-muted/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
