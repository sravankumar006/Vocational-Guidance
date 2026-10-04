import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type { AIPerformanceAnalyticsResponse } from '@/types/admin';

// Modular AI Performance Components
import { AIPerformanceCards } from '@/components/admin/AIPerformanceCard';
import { AIResolutionChart } from '@/components/admin/AIResolutionChart';
import { AIPerformanceTrend } from '@/components/admin/AIPerformanceTrend';
import { AILowConfidenceSection } from '@/components/admin/AILowConfidenceSection';
import { AIUnansweredQuestionsSection } from '@/components/admin/AIUnansweredQuestionsSection';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  Cpu,
  ArrowLeft,
  RefreshCw,
  FlaskConical,
  Calendar,
  FileText,
} from 'lucide-react';

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

export const AdminAIPerformanceAnalytics: React.FC = () => {
  const [data, setData] = useState<AIPerformanceAnalyticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentRange: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await adminService.getAIPerformanceAnalytics({ date_range: currentRange });
      setData(res);
    } catch (err: any) {
      console.error('[AdminAIPerformanceAnalytics] Fetch error:', err);
      // Section 20: Centralized user error
      setError("We couldn't load AI performance analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [fetchData, dateRange]);

  const handleTimeChange = (newRange: string) => {
    setDateRange(newRange);
  };

  const handleRefresh = () => {
    fetchData(dateRange, true);
  };

  const hasSessions = Boolean(data && data.summary.total_sessions > 0);

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
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                AI Performance Analytics
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                System telemetry monitoring dialogue resolution, human referral rates, confidence distributions, and unanswered inquiries (A6).
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

      {/* Section 4: Demo Data Subtle Label & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200/90">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-semibold text-amber-300">
            Demo Data — Generated for Development
          </span>
          <span className="hidden sm:inline text-amber-400/60">•</span>
          <span className="text-amber-200/80">
            These metrics currently use generated data and do not represent real production AI performance.
          </span>
        </div>
        <div className="text-[11px] text-amber-300/70 font-mono">
          Threshold: &lt; {data?.confidence_threshold ?? 0.60}
        </div>
      </div>

      {/* Section 5: Time Horizon Filter Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-base/80 p-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          <Calendar className="h-4 w-4 text-brand-400" />
          <span>Evaluation Time Horizon:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleTimeChange(r.value)}
              disabled={isLoading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === r.value
                  ? 'bg-brand-500 text-white font-semibold shadow-sm'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State (Section 18) */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Aggregating AI performance and resolution telemetry from database..." />
        </div>
      )}

      {/* Error State with Retry (Section 20) */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load AI performance analytics right now."
            message="There was an issue communicating with the AI analytics telemetry service. Please try again."
            onRetry={() => fetchData(dateRange)}
          />
        </div>
      )}

      {/* Loaded Content */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Section 1 & 3: Primary 5 Metric Cards */}
          <AIPerformanceCards
            summary={data.summary}
            confidenceThreshold={data.confidence_threshold}
          />

          {/* Section 19: Empty State */}
          {!hasSessions ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-base/80 p-12 text-center shadow-sm">
              <Cpu className="h-10 w-10 text-text-muted mb-3" />
              <h3 className="text-base font-semibold text-text-primary">
                No AI performance data available for this period.
              </h3>
              <p className="mt-1 text-xs text-text-secondary max-w-md">
                Try selecting a broader date horizon to evaluate recorded AI counselling sessions.
              </p>
            </div>
          ) : (
            <>
              {/* Section 10: Deterministic Factual Summary */}
              {data.deterministic_summary && data.deterministic_summary.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 border-b border-border/40 pb-2">
                    <FileText className="h-4 w-4 text-brand-300" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      Deterministic Telemetry Summary
                    </h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-2 text-xs text-text-secondary sm:grid-cols-2 lg:grid-cols-3">
                    {data.deterministic_summary.map((stmt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-400 font-bold">•</span>
                        <span>{stmt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 7: Resolution vs Escalation Breakdown */}
              <AIResolutionChart
                breakdown={data.resolution_breakdown}
                totalSessions={data.summary.total_sessions}
              />

              {/* Section 6: AI Performance Trend */}
              {data.trend && data.trend.length > 0 && (
                <AIPerformanceTrend trend={data.trend} />
              )}

              {/* Section 8 & 9: Low-Confidence & Unanswered Breakdown Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AILowConfidenceSection
                  lowConfidenceCount={data.summary.low_confidence_responses}
                  lowConfidenceRate={data.summary.low_confidence_rate}
                  totalAIResponses={data.summary.total_ai_responses}
                  confidenceThreshold={data.confidence_threshold}
                />

                <AIUnansweredQuestionsSection
                  unansweredCount={data.summary.unanswered_questions}
                  unansweredRate={data.summary.unanswered_rate}
                  totalUserQuestions={data.summary.total_user_questions}
                  categories={data.unanswered_categories}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
