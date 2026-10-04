import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type {
  SentimentShiftAnalytics,
  AnalyticsFiltersState,
  AnalyticsFilterOptions,
} from '@/types/admin';

// Modular Sentiment Components
import { CounsellingStageFlow } from '@/components/admin/CounsellingStageFlow';
import { SentimentShiftChart } from '@/components/admin/SentimentShiftChart';
import { SentimentComparisonTable } from '@/components/admin/SentimentComparisonTable';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  HeartHandshake,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Activity,
  MessageSquare,
  AlertCircle,
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
  concerns: [],
  languages: ['en', 'te', 'hi'],
  severities: [],
  statuses: [],
};

export const AdminSentimentAnalytics: React.FC = () => {
  const [data, setData] = useState<SentimentShiftAnalytics | null>(null);
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
      const [sentimentRes, overviewRes] = await Promise.all([
        adminService.getSentimentAnalytics(currentFilters),
        adminService.getAnalytics(currentFilters).catch(() => null),
      ]);

      setData(sentimentRes);

      if (overviewRes?.filter_options) {
        setFilterOptions(overviewRes.filter_options);
      }
    } catch (err: any) {
      console.error('[AdminSentimentAnalytics] Fetch error:', err);
      // Section 18: Centralized user-friendly error without leaking internals
      setError("We couldn't load sentiment analytics right now.");
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

  const hasEvents = data && data.total_events > 0;
  const canCompare = data?.can_compare ?? (Boolean(data?.has_before_data) && Boolean(data?.has_after_data));

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
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Observed Sentiment Shift
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                Observed sentiment before and after counselling sessions across vocational dialogue (A4).
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

      {/* Server-side Filter Bar (Section 8) */}
      <AnalyticsFilters
        filters={filters}
        filterOptions={filterOptions}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading || isRefreshing}
      />

      {/* Loading State (Section 16) */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Aggregating observed sentiment telemetry from SentimentEvent records..." />
        </div>
      )}

      {/* Centralized Error State with Retry (Section 18) */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load sentiment analytics right now."
            message="There was an issue communicating with the sentiment analytics aggregation service. Please try again."
            onRetry={() => fetchData(filters)}
          />
        </div>
      )}

      {/* Loaded Content */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Main KPI Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Total Sentiment Events</span>
                <Activity className="h-4 w-4 text-brand-300" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {data.total_events}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Observed SentimentEvent records
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Sessions Monitored</span>
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {data.total_sessions_analyzed ?? data.before?.total ?? 0}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Discrete counselling engagements
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Observed Shift Rate</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">
                  {data.positive_shift_rate != null
                    ? `${data.positive_shift_rate >= 0 ? '+' : ''}${data.positive_shift_rate}%`
                    : 'N/A'}
                </span>
                <span className="text-xs font-medium text-text-muted">
                  Positive delta
                </span>
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Pre- vs post-counselling observation
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Data Sufficiency</span>
                <AlertCircle className="h-4 w-4 text-brand-400" />
              </div>
              <div className="mt-2 text-sm font-semibold text-text-primary truncate">
                {data.status_message}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {canCompare ? 'Multi-stage comparison valid' : 'Single stage available'}
              </div>
            </div>
          </div>

          {/* Empty State / Insufficient Data (Section 17) */}
          {!hasEvents ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-base/80 p-12 text-center shadow-sm">
              <HeartHandshake className="h-10 w-10 text-text-muted mb-3" />
              <h3 className="text-base font-semibold text-text-primary">
                No sentiment data available for this period.
              </h3>
              <p className="mt-1 text-xs text-text-secondary max-w-md">
                Try selecting a broader date range or clearing career/language filters to view recorded sentiment progressions.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Counselling Flow Visual Indicator (Section 1 & 7) */}
              <CounsellingStageFlow
                before={data.before}
                during={data.during}
                after={data.after}
                canCompare={canCompare}
              />

              {/* 2. Sentiment Shift Comparison Chart (Section 6) */}
              <SentimentShiftChart data={data} fullWidth />

              {/* 3. Detailed Comparison Table (Section 3, 4, 5) */}
              {data.comparison && data.comparison.length > 0 && (
                <SentimentComparisonTable
                  comparison={data.comparison}
                  hasDuringData={Boolean(data.has_during_data && data.during?.is_available)}
                  canCompare={canCompare}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
