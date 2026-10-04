import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import type {
  GeographicAnalyticsResponse,
  GeographicFiltersState,
} from '@/types/admin';

// Modular Geographic Components
import { GeographicFilters } from '@/components/admin/GeographicFilters';
import { GeographicConcentrationChart } from '@/components/admin/GeographicConcentrationChart';
import { StateDistributionChart } from '@/components/admin/StateDistributionChart';
import { DistrictDistributionChart } from '@/components/admin/DistrictDistributionChart';
import { RegionDistributionChart } from '@/components/admin/RegionDistributionChart';
import { GeographicTimeTrendChart } from '@/components/admin/GeographicTimeTrendChart';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  MapPin,
  ArrowLeft,
  RefreshCw,
  Activity,
  Building2,
  Compass,
  Globe2,
  Briefcase,
  AlertTriangle,
  HelpCircle,
  FlaskConical,
} from 'lucide-react';

const DEFAULT_FILTERS: GeographicFiltersState = {
  state: null,
  district: null,
  region: null,
  career_id: null,
  concern: null,
  date_range: 'all_time',
  start_date: null,
  end_date: null,
};

export const AdminGeographicAnalytics: React.FC = () => {
  const [data, setData] = useState<GeographicAnalyticsResponse | null>(null);
  const [filters, setFilters] = useState<GeographicFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentFilters: GeographicFiltersState, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await adminService.getGeographicAnalytics(currentFilters);
      setData(res);
    } catch (err: any) {
      console.error('[AdminGeographicAnalytics] Fetch error:', err);
      // Section 21: Centralized error handling
      setError("We couldn't load geographic analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  const handleFilterChange = (updated: GeographicFiltersState) => {
    setFilters(updated);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRefresh = () => {
    fetchData(filters, true);
  };

  const selectedCareerLabel = useMemo(() => {
    if (!filters.career_id || !data?.available_careers) return null;
    const match = data.available_careers.find((c) => c.id === filters.career_id);
    return match ? match.label : null;
  }, [filters.career_id, data?.available_careers]);

  const hasActivity = Boolean(data && data.summary.total > 0);

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
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Geographic Concentration Analytics
              </h1>
              <p className="text-xs text-text-secondary sm:text-sm">
                Visualizing where counselling and parent-concern activity is concentrated across regions.
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

      {/* Section 11: Demo Data Subtle Label & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200/90">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-semibold text-amber-300">
            Demo Data — Generated for Development
          </span>
          <span className="hidden sm:inline text-amber-400/60">•</span>
          <span className="text-amber-200/80">
            These analytics currently use generated data and do not represent real-world statistics.
          </span>
        </div>
        <div className="text-[11px] text-amber-300/70 font-mono">
          Demo Dataset v1.0
        </div>
      </div>

      {/* Section 2: Conceptual Flow Indicator */}
      <div className="rounded-xl border border-border/60 bg-surface-base/60 p-3.5">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-text-muted">
          <span className="rounded-md bg-surface-elevated px-2.5 py-1 text-text-secondary border border-border/70">
            Geographic Location
          </span>
          <span className="text-brand-400">→</span>
          <span className="rounded-md bg-surface-elevated px-2.5 py-1 text-text-secondary border border-border/70">
            Counselling / Concern Activity
          </span>
          <span className="text-brand-400">→</span>
          <span className="rounded-md bg-brand-500/10 px-2.5 py-1 text-brand-300 border border-brand-500/20 font-semibold">
            Geographic Concentration
          </span>
        </div>
      </div>

      {/* Section 1: Filters */}
      <GeographicFilters
        filters={filters}
        availableStates={data?.available_states || []}
        availableDistricts={data?.available_districts || []}
        stateDistricts={data?.state_districts || {}}
        availableRegions={data?.available_regions || []}
        availableCareers={data?.available_careers || []}
        availableConcerns={data?.available_concerns || []}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading || isRefreshing}
      />

      {/* Section 8 & 9: Selective Context Notices */}
      {selectedCareerLabel && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              <strong>Career Focus:</strong> Observed activity for this career (<em>{selectedCareerLabel}</em>) across states, districts, and regions in the generated dataset.
            </span>
          </div>
        </div>
      )}

      {filters.concern && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
            <span>
              <strong>Concern Focus:</strong> Observed activity for this parent concern (<em>{filters.concern}</em>) in the generated dataset.
            </span>
          </div>
        </div>
      )}

      {/* Loading State (Section 19) */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Aggregating observed geographic activity from generated database records..." />
        </div>
      )}

      {/* Centralized Error State with Retry (Section 21) */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load geographic analytics right now."
            message="There was an issue communicating with the geographic analytics service. Please try again."
            onRetry={() => fetchData(filters)}
          />
        </div>
      )}

      {/* Loaded Content */}
      {data && !isLoading && (
        <div className="space-y-6">
          {/* Section 4: Summary Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Total Activity</span>
                <Activity className="h-4 w-4 text-brand-300" />
              </div>
              <div className="mt-2 text-2xl font-bold text-text-primary">
                {data.summary.total}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Observed sessions & concerns
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Top State</span>
                <Building2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-lg font-bold text-text-primary truncate">
                {data.summary.top_state || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Highest observed activity
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Top District</span>
                <Compass className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-lg font-bold text-text-primary truncate">
                {data.summary.top_district || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Highest observed activity
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Top Region</span>
                <Globe2 className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 text-lg font-bold text-text-primary truncate">
                {data.summary.top_region || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Highest observed activity
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Top Career</span>
                <Briefcase className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 text-sm font-bold text-text-primary truncate" title={data.summary.top_career || ''}>
                {data.summary.top_career || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Highest observed activity
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface-base/80 p-4 shadow-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-xs font-medium">Top Concern</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-sm font-bold text-text-primary truncate">
                {data.summary.top_concern || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Highest observed activity
              </div>
            </div>
          </div>

          {/* Section 20: Empty State */}
          {!hasActivity ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-base/80 p-12 text-center shadow-sm">
              <MapPin className="h-10 w-10 text-text-muted mb-3" />
              <h3 className="text-base font-semibold text-text-primary">
                No geographic data available for this selection.
              </h3>
              <p className="mt-1 text-xs text-text-secondary max-w-md">
                Try broadening the state, district, or career filters to view activity recorded in the generated database.
              </p>
            </div>
          ) : (
            <>
              {/* Section 3: Main Geographic Ranked Bar Chart */}
              <GeographicConcentrationChart
                data={data.districts}
                total={data.summary.total}
                selectedState={filters.state}
                selectedCareer={selectedCareerLabel}
                selectedConcern={filters.concern}
              />

              {/* Section 5, 6, 7: State, District, and Region Distribution Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <StateDistributionChart
                  data={data.states}
                  total={data.summary.total}
                />
                <DistrictDistributionChart
                  data={data.districts}
                  selectedState={filters.state}
                />
                <RegionDistributionChart
                  data={data.regions}
                />
              </div>

              {/* Section 10: Time Analysis Trend Chart */}
              {data.trend && data.trend.length > 0 && (
                <GeographicTimeTrendChart
                  trend={data.trend}
                  dateRange={filters.date_range}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
