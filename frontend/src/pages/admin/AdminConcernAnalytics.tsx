import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type {
  ParentConcernsAnalytics,
  AnalyticsFiltersState,
  AnalyticsFilterOptions,
} from '@/types/admin';

// Reusable A3 Components
import { ConcernDistributionChart } from '@/components/admin/ConcernDistributionChart';
import { ConcernTrendChart } from '@/components/admin/ConcernTrendChart';
import { ConcernBreakdownTable } from '@/components/admin/ConcernBreakdownTable';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

const DEFAULT_FILTERS: AnalyticsFiltersState = {
  date_range: '30d',
  career_id: null,
  concern: null,
  language: null,
  severity: null,
  concern_status: null,
  start_date: null,
  end_date: null,
};

const DEFAULT_FILTER_OPTIONS: AnalyticsFilterOptions = {
  careers: [],
  concerns: [
    'Income',
    'Job Security',
    'Further Education',
    'Social Perception',
    'Distance',
    'Working Conditions',
    'Career Growth',
  ],
  languages: ['en', 'te', 'hi'],
  severities: ['LOW', 'MEDIUM', 'HIGH'],
  statuses: ['OPEN', 'ADDRESSED', 'RESOLVED'],
};

export const AdminConcernAnalytics: React.FC = () => {
  const [data, setData] = useState<ParentConcernsAnalytics | null>(null);
  const [filterOptions, setFilterOptions] = useState<AnalyticsFilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [filters, setFilters] = useState<AnalyticsFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentFilters: AnalyticsFiltersState, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      // Parallel fetch for concern analytics and full filter options
      const [concernRes, overviewRes] = await Promise.all([
        adminService.getConcernAnalytics(currentFilters),
        adminService.getAnalytics(currentFilters).catch(() => null),
      ]);

      setData(concernRes);

      if (overviewRes?.filter_options) {
        setFilterOptions(overviewRes.filter_options);
      }
    } catch (err: any) {
      console.error('[AdminConcernAnalytics] Fetch error:', err);
      // Section 15: Centralized error handling without leaking SQL or DB internals
      setError("We couldn't load concern analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  const handleFilterChange = (updated: AnalyticsFiltersState) => {
    setFilters(updated);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRefresh = () => {
    fetchData(filters, true);
  };

  const totalCount = data ? (data.total ?? data.total_concerns ?? 0) : 0;
  const hasConcerns = totalCount > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2">
            <Link
              to="/admin/analytics"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Platform Telemetry Overview</span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-brand-300 ring-1 ring-border">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Parent Concern Analytics
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                Empirical administrative analysis of parent objections, resistance categories, and trend evolution (A3).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-2 border-border/80 text-text-secondary hover:text-text-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </Button>
        </div>
      </div>

      {/* Server-side Filter Bar (Section 4) */}
      <AnalyticsFilters
        filters={filters}
        filterOptions={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading || isRefreshing}
      />

      {/* Loading State (Section 13) */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Aggregating parent concerns from live records..." />
        </div>
      )}

      {/* Centralized Error State with Retry (Section 15) */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load concern analytics right now."
            message="There was an issue communicating with the analytics service. Please try again."
            onRetry={() => fetchData(filters)}
          />
        </div>
      )}

      {/* Loaded Content */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Main Analytics KPI Summary (Section 3) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Total Recorded Concerns</span>
                <ShieldAlert className="h-4 w-4 text-brand-300" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {totalCount}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Aggregated from ParentConcern records
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Primary Concern Area</span>
                <PieChart className="h-4 w-4 text-brand-400" />
              </div>
              <div className="mt-2 text-xl font-bold text-text-primary truncate">
                {data.highest_concern || 'None'}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Highest frequency objection
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">High Severity Ratio</span>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">
                  {data.high_severity_count || 0}
                </span>
                <span className="text-xs font-medium text-text-muted">
                  ({totalCount > 0 ? Math.round(((data.high_severity_count || 0) / totalCount) * 100) : 0}%)
                </span>
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Urgent parental resistance flags
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Resolution Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-400">
                {data.resolution_rate != null ? `${data.resolution_rate}%` : '0%'}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {data.resolved_count || 0} concerns resolved
              </div>
            </div>
          </div>

          {/* Empty State (Section 14) */}
          {!hasConcerns ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-base/80 p-12 text-center shadow-sm">
              <ShieldAlert className="h-10 w-10 text-text-muted mb-3" />
              <h3 className="text-base font-semibold text-text-primary">
                No parent concerns recorded for this period.
              </h3>
              <p className="mt-1 text-xs text-text-secondary max-w-md">
                Try selecting a broader date range or clearing individual career/severity filters to view historical objection trends.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Category Distribution Horizontal Bar Chart (Section 3) */}
              <ConcernDistributionChart
                categories={data.categories}
                total={totalCount}
              />

              {/* 2. Chronological Trend Line/Area Chart (Section 5) */}
              <ConcernTrendChart
                trend={data.trend || []}
                dateRange={filters.date_range}
              />

              {/* 3. Breakdown by Severity, Status, and Career Track (Section 6) */}
              <ConcernBreakdownTable
                severities={data.by_severity}
                statuses={data.by_status}
                careerBreakdown={data.career_breakdown}
                total={totalCount}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
