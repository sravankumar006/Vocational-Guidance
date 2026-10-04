import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type { AdminAnalyticsResponse, AnalyticsFiltersState } from '@/types/admin';

// Analytics UI Components
import { AnalyticsSummaryCard } from '@/components/admin/AnalyticsSummaryCard';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { CounsellingVolumeChart } from '@/components/admin/CounsellingVolumeChart';
import { ParentConcernsChart } from '@/components/admin/ParentConcernsChart';
import { ParentResistanceChart } from '@/components/admin/ParentResistanceChart';
import { EscalationChart } from '@/components/admin/EscalationChart';
import { SentimentShiftChart } from '@/components/admin/SentimentShiftChart';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  BarChart3,
  RefreshCw,
  MessageSquareQuote,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  HeartHandshake,
} from 'lucide-react';

const DEFAULT_FILTERS: AnalyticsFiltersState = {
  date_range: '30d',
  career_id: null,
  concern: null,
  language: null,
  start_date: null,
  end_date: null,
};

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [filters, setFilters] = useState<AnalyticsFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'overview' | 'concerns'>('overview');

  const fetchAnalytics = useCallback(async (currentFilters: AnalyticsFiltersState, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const response = await adminService.getAnalytics(currentFilters);
      setData(response);
    } catch (err: any) {
      console.error('[AdminAnalytics] Fetch failed:', err);
      // Clean user-friendly message without leaking database internals (Section 15)
      setError("We couldn't load these analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(filters);
  }, [fetchAnalytics, filters]);

  const handleFilterChange = (updatedFilters: AnalyticsFiltersState) => {
    setFilters(updatedFilters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRefresh = () => {
    fetchAnalytics(filters, true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-brand-300 ring-1 ring-border">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Platform Analytics & Telemetry
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                Administrative monitoring of counselling activity, parent concerns (A3), resistance, escalations, and sentiment shift.
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
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* View Switcher Tabs: Overview vs Concern Analytics (A3) */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          type="button"
          onClick={() => setActiveView('overview')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'overview'
              ? 'border-brand-500 text-brand-400 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Platform Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('concerns')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeView === 'concerns'
              ? 'border-brand-500 text-brand-400 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Concern Analytics (A3)</span>
          {data && (
            <span className="ml-1 rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary border border-border">
              {data.summary.total_concerns}
            </span>
          )}
        </button>

        <div className="ml-auto hidden sm:flex items-center gap-2">
          <Link
            to="/admin/analytics/concerns"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-brand-500/50"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-brand-400" />
            <span>A3 Concerns &rarr;</span>
          </Link>
          <Link
            to="/admin/analytics/sentiment"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-brand-500/50"
          >
            <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
            <span>A4 Sentiment &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Analytics Filters */}
      {data && (
        <AnalyticsFilters
          filters={filters}
          filterOptions={data.filter_options}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          isLoading={isLoading || isRefreshing}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Loading administrative analytics telemetry..." />
        </div>
      )}

      {/* Error State with Centralized Retry */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load these analytics right now."
            message="There was an issue communicating with the analytics aggregation service. Please try again."
            onRetry={() => fetchAnalytics(filters)}
          />
        </div>
      )}

      {/* Loaded Content */}
      {data && !isLoading && (
        <div className="space-y-6">
          {activeView === 'overview' ? (
            <>
              {/* 1. Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AnalyticsSummaryCard
                  label="Counselling Sessions"
                  value={data.summary.total_sessions}
                  subtext={`${data.summary.total_messages} total messages logged`}
                  icon={<MessageSquareQuote className="h-5 w-5" />}
                />
                <AnalyticsSummaryCard
                  label="Parent Concerns"
                  value={data.summary.total_concerns}
                  subtext={`${data.resistance.parents_expressing_concerns} parents expressing concerns`}
                  icon={<ShieldAlert className="h-5 w-5" />}
                />
                <AnalyticsSummaryCard
                  label="Human Escalations"
                  value={data.summary.total_escalations}
                  subtext={`${data.escalations.pending} pending counsellor review`}
                  icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
                />
                <AnalyticsSummaryCard
                  label="Resolved Escalations"
                  value={data.summary.resolved_escalations}
                  subtext={
                    data.summary.total_escalations > 0
                      ? `${Math.round(
                          (data.summary.resolved_escalations / data.summary.total_escalations) * 100
                        )}% resolution rate`
                      : 'No escalations recorded'
                  }
                  icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                />

                {/* Optional Summary Card: Observed Sentiment Shift (if supported by real data) */}
                {data.summary.has_sentiment_data && data.summary.observed_sentiment_shift && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <AnalyticsSummaryCard
                      label="Observed Sentiment Shift"
                      value={data.summary.observed_sentiment_shift}
                      subtext="Empirically computed progression across recorded sentiment events"
                      icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                    />
                  </div>
                )}
              </div>

              {/* 2. Counselling Volume (Section 1) */}
              <CounsellingVolumeChart data={data.volume} />

              {/* 3. Parent Resistance & Concern Categories (Sections 2 & 3) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ParentConcernsChart data={data.concerns} />
                <ParentResistanceChart data={data.resistance} />
              </div>

              {/* 4. Human Escalations (Section 4) */}
              <EscalationChart data={data.escalations} />

              {/* 5. Observed Sentiment Shift (Section 5) */}
              <SentimentShiftChart data={data.sentiment} />
            </>
          ) : (
            /* Dedicated Concern Analytics (A3) View */
            <div className="space-y-6">
              {/* Primary Concern Analytics Full-Width Component */}
              <ParentConcernsChart data={data.concerns} fullWidth />

              {/* Secondary Resistance and Career Impact Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ParentResistanceChart data={data.resistance} />
                <EscalationChart data={data.escalations} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
