import React, { useMemo } from 'react';
import type { GeographicFiltersState, FilterOptionItem } from '@/types/admin';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GeographicFiltersProps {
  filters: GeographicFiltersState;
  availableStates: string[];
  availableDistricts: string[];
  stateDistricts: Record<string, string[]>;
  availableRegions: string[];
  availableCareers: FilterOptionItem[];
  availableConcerns: string[];
  onChange: (filters: GeographicFiltersState) => void;
  onReset: () => void;
  isLoading: boolean;
}

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

export const GeographicFilters: React.FC<GeographicFiltersProps> = ({
  filters,
  availableStates,
  availableDistricts,
  stateDistricts,
  availableRegions,
  availableCareers,
  availableConcerns,
  onChange,
  onReset,
  isLoading,
}) => {
  // Section 1: District options update based on selected State where possible
  const selectableDistricts = useMemo(() => {
    if (filters.state && stateDistricts[filters.state]) {
      return stateDistricts[filters.state];
    }
    return availableDistricts;
  }, [filters.state, stateDistricts, availableDistricts]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextState = e.target.value || null;
    let nextDistrict = filters.district;
    if (nextState && stateDistricts[nextState]) {
      if (nextDistrict && !stateDistricts[nextState].includes(nextDistrict)) {
        nextDistrict = null;
      }
    }
    onChange({
      ...filters,
      state: nextState,
      district: nextDistrict,
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      district: e.target.value || null,
    });
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      region: e.target.value || null,
    });
  };

  const handleCareerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : null;
    onChange({
      ...filters,
      career_id: val,
    });
  };

  const handleConcernChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      concern: e.target.value || null,
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      date_range: e.target.value,
    });
  };

  const hasActiveFilters = Boolean(
    filters.state ||
    filters.district ||
    filters.region ||
    filters.career_id ||
    filters.concern ||
    filters.date_range !== 'all_time'
  );

  return (
    <div className="rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        {/* Header & Reset */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Geographic & Demographic Filters
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!hasActiveFilters || isLoading}
            className="h-8 gap-1.5 px-2.5 text-xs text-text-muted hover:text-text-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        </div>

        {/* 6 Grid Filters: State, District, Region, Career, Concern, Time */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* 1. State Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">State</label>
            <select
              value={filters.state || ''}
              onChange={handleStateChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* 2. District Filter (dynamic based on state) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">District</label>
            <select
              value={filters.district || ''}
              onChange={handleDistrictChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="">
                {filters.state ? `All ${filters.state} Districts` : 'All Districts'}
              </option>
              {selectableDistricts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Region Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Region</label>
            <select
              value={filters.region || ''}
              onChange={handleRegionChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="">All Regions</option>
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Career Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Career Intent</label>
            <select
              value={filters.career_id ?? ''}
              onChange={handleCareerChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="">All Careers</option>
              {availableCareers.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Concern Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Parent Concern</label>
            <select
              value={filters.concern || ''}
              onChange={handleConcernChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              <option value="">All Concerns</option>
              {availableConcerns.map((con) => (
                <option key={con} value={con}>
                  {con}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Time Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Time Horizon</label>
            <select
              value={filters.date_range}
              onChange={handleTimeChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-border/70 bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
