import React from 'react';
import type { DataTabKey, DataOptionsResponse } from '@/types/adminData';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';

interface DataTabHeaderProps {
  tab: DataTabKey;
  searchQuery: string;
  statusFilter: string;
  sectorFilter?: string;
  options: DataOptionsResponse | null;
  onSearchChange: (q: string) => void;
  onStatusChange: (status: string) => void;
  onSectorChange?: (sector: string) => void;
  onReset: () => void;
  onAddClick: () => void;
  isLoading: boolean;
}

export const DataTabHeader: React.FC<DataTabHeaderProps> = ({
  tab,
  searchQuery,
  statusFilter,
  sectorFilter,
  options,
  onSearchChange,
  onStatusChange,
  onSectorChange,
  onReset,
  onAddClick,
  isLoading,
}) => {
  const getSearchPlaceholder = () => {
    switch (tab) {
      case 'courses': return 'Search courses by title, qualification...';
      case 'occupations': return 'Search occupations by title, sector...';
      case 'providers': return 'Search providers by name, location...';
      case 'outcomes': return 'Search outcomes by region, experience...';
      case 'career-paths': return 'Search career progression pathways...';
      case 'sources': return 'Search data sources, portals, authorities...';
    }
  };

  const getAddLabel = () => {
    switch (tab) {
      case 'courses': return 'Add Course';
      case 'occupations': return 'Add Occupation';
      case 'providers': return 'Add Provider';
      case 'outcomes': return 'Add Outcome';
      case 'career-paths': return 'Add Career Path';
      case 'sources': return 'Add Source';
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="w-full rounded-lg border border-border bg-surface-elevated/60 pl-9 pr-3 py-1.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          onClick={onAddClick}
          className="bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{getAddLabel()}</span>
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium text-[11px] uppercase tracking-wider">Status:</span>
        </div>

        {['all', 'demo', 'unverified', 'verified', 'inactive'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatusChange(st)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
              statusFilter === st
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-semibold'
                : 'bg-surface-elevated/60 text-text-secondary border-border/70 hover:text-text-primary hover:border-border'
            }`}
          >
            {st === 'all' && 'All Records'}
            {st === 'demo' && 'Demo / Generated'}
            {st === 'unverified' && 'Unverified'}
            {st === 'verified' && 'Verified'}
            {st === 'inactive' && 'Inactive'}
          </button>
        ))}

        {/* Optional Sector Filter for courses and occupations */}
        {(tab === 'courses' || tab === 'occupations') && options && options.sectors.length > 0 && onSectorChange && (
          <div className="ml-auto flex items-center gap-2">
            <select
              value={sectorFilter || ''}
              onChange={(e) => onSectorChange(e.target.value)}
              className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Sectors</option>
              {options.sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filter Button */}
        {(searchQuery || (statusFilter && statusFilter !== 'all') || sectorFilter) && (
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
