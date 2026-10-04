import React, { useState, useEffect, useCallback } from 'react';
import { adminDataService } from '@/services/adminDataService';
import type {
  DataTabKey,
  DataStatsResponse,
  DataOptionsResponse,
  PaginatedResponse,
} from '@/types/adminData';

// Modular UI Components
import { DataTabHeader } from '@/components/admin/data/DataTabHeader';
import { DataTableView } from '@/components/admin/data/DataTableView';
import { DataDetailModal } from '@/components/admin/data/DataDetailModal';
import { DataFormModal } from '@/components/admin/data/DataFormModal';
import { DataConfirmationModal } from '@/components/admin/data/DataConfirmationModal';

// Shared UI Components
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

// Lucide Icons
import {
  Database,
  BookOpen,
  Briefcase,
  Building2,
  TrendingUp,
  GitBranch,
  RefreshCw,
  FlaskConical,
  ShieldCheck,
  EyeOff,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export const AdminData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DataTabKey>('courses');
  const [stats, setStats] = useState<DataStatsResponse | null>(null);
  const [options, setOptions] = useState<DataOptionsResponse | null>(null);

  // Tab Data State
  const [data, setData] = useState<PaginatedResponse<any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters State
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('');

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formInitialData, setFormInitialData] = useState<any | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  // Confirmation Modal State (Verify / Deactivate / Reactivate)
  const [confirmAction, setConfirmAction] = useState<'verify' | 'deactivate' | 'reactivate' | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState<boolean>(false);

  // 1. Fetch Global Stats & Options
  const fetchGlobalMetadata = useCallback(async () => {
    try {
      const [statsRes, optionsRes] = await Promise.all([
        adminDataService.getStats(),
        adminDataService.getOptions(),
      ]);
      setStats(statsRes);
      setOptions(optionsRes);
    } catch (err) {
      console.warn('[AdminData] Failed to load metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalMetadata();
  }, [fetchGlobalMetadata]);

  // 2. Fetch Active Tab Records
  const fetchTabRecords = useCallback(
    async (
      tab: DataTabKey,
      currentPage: number,
      q: string,
      status: string,
      sector: string,
      silent = false
    ) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: pageSize,
        q: q || undefined,
        status: status !== 'all' ? status : undefined,
        sector: sector || undefined,
      };

      try {
        let res: PaginatedResponse<any>;
        switch (tab) {
          case 'courses':
            res = await adminDataService.getCourses(params);
            break;
          case 'occupations':
            res = await adminDataService.getOccupations(params);
            break;
          case 'providers':
            res = await adminDataService.getProviders(params);
            break;
          case 'outcomes':
            res = await adminDataService.getOutcomes(params);
            break;
          case 'career-paths':
            res = await adminDataService.getCareerPaths(params);
            break;
          case 'sources':
            res = await adminDataService.getSources(params);
            break;
        }
        setData(res);
      } catch (err: any) {
        console.error(`[AdminData] Fetch failed for ${tab}:`, err);
        setError("We couldn't load this data right now. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchTabRecords(activeTab, page, searchQuery, statusFilter, sectorFilter);
  }, [fetchTabRecords, activeTab, page, searchQuery, statusFilter, sectorFilter]);

  // Tab Change Handler
  const handleTabChange = (newTab: DataTabKey) => {
    setActiveTab(newTab);
    setPage(1);
    setSearchQuery('');
    setStatusFilter('all');
    setSectorFilter('');
    setFeedback(null);
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSectorFilter('');
    setPage(1);
  };

  // View Details Handler
  const handleView = (item: any) => {
    setSelectedRecord(item);
    setIsViewOpen(true);
  };

  // Edit Record Handler
  const handleEdit = (item: any) => {
    setFormInitialData(item);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  // Add Record Handler
  const handleAdd = () => {
    setFormInitialData(null);
    setIsFormOpen(true);
  };

  // Save (Create or Update) Handler
  const handleSaveRecord = async (payload: Record<string, any>) => {
    setIsFormSubmitting(true);
    setFeedback(null);

    try {
      if (formInitialData?.id) {
        // Update
        const id = formInitialData.id;
        switch (activeTab) {
          case 'courses': await adminDataService.updateCourse(id, payload); break;
          case 'occupations': await adminDataService.updateOccupation(id, payload); break;
          case 'providers': await adminDataService.updateProvider(id, payload); break;
          case 'outcomes': await adminDataService.updateOutcome(id, payload); break;
          case 'career-paths': await adminDataService.updateCareerPath(id, payload); break;
          case 'sources': await adminDataService.updateSource(id, payload); break;
        }
        setFeedback({ type: 'success', message: 'Record updated successfully.' });
      } else {
        // Create
        switch (activeTab) {
          case 'courses': await adminDataService.createCourse(payload); break;
          case 'occupations': await adminDataService.createOccupation(payload); break;
          case 'providers': await adminDataService.createProvider(payload); break;
          case 'outcomes': await adminDataService.createOutcome(payload); break;
          case 'career-paths': await adminDataService.createCareerPath(payload); break;
          case 'sources': await adminDataService.createSource(payload); break;
        }
        setFeedback({ type: 'success', message: 'New record created successfully.' });
      }

      setIsFormOpen(false);
      fetchTabRecords(activeTab, page, searchQuery, statusFilter, sectorFilter, true);
      fetchGlobalMetadata();
    } catch (err: any) {
      console.error('[AdminData] Save failed:', err);
      const detail = err?.message || 'Failed to save record. Please check field inputs.';
      setFeedback({ type: 'error', message: detail });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Workflow Confirmation Triggers
  const handleVerifyClick = (item: any) => {
    setConfirmAction('verify');
    setConfirmTarget(item);
  };

  const handleDeactivateClick = (item: any) => {
    setConfirmAction('deactivate');
    setConfirmTarget(item);
  };

  const handleReactivateClick = (item: any) => {
    setConfirmAction('reactivate');
    setConfirmTarget(item);
  };

  // Execute Workflow Action (Verify / Deactivate / Reactivate)
  const handleExecuteWorkflow = async () => {
    if (!confirmAction || !confirmTarget) return;

    setIsConfirmLoading(true);
    setFeedback(null);
    const id = confirmTarget.id;

    try {
      if (confirmAction === 'verify') {
        switch (activeTab) {
          case 'courses': await adminDataService.verifyCourse(id); break;
          case 'occupations': await adminDataService.verifyOccupation(id); break;
          case 'providers': await adminDataService.verifyProvider(id); break;
          case 'outcomes': await adminDataService.verifyOutcome(id); break;
          case 'career-paths': await adminDataService.verifyCareerPath(id); break;
          case 'sources': await adminDataService.verifySource(id); break;
        }
        setFeedback({ type: 'success', message: 'Record verified successfully for authoritative RAG retrieval.' });
      } else if (confirmAction === 'deactivate') {
        switch (activeTab) {
          case 'courses': await adminDataService.deactivateCourse(id); break;
          case 'occupations': await adminDataService.deactivateOccupation(id); break;
          case 'providers': await adminDataService.deactivateProvider(id); break;
          case 'outcomes': await adminDataService.deactivateOutcome(id); break;
          case 'career-paths': await adminDataService.deactivateCareerPath(id); break;
          case 'sources': await adminDataService.deactivateSource(id); break;
        }
        setFeedback({ type: 'success', message: 'Record deactivated. Excluded from RAG knowledge base.' });
      } else if (confirmAction === 'reactivate') {
        switch (activeTab) {
          case 'courses': await adminDataService.reactivateCourse(id); break;
          case 'occupations': await adminDataService.reactivateOccupation(id); break;
          case 'providers': await adminDataService.reactivateProvider(id); break;
          case 'outcomes': await adminDataService.reactivateOutcome(id); break;
          case 'career-paths': await adminDataService.reactivateCareerPath(id); break;
          case 'sources': await adminDataService.reactivateSource(id); break;
        }
        setFeedback({ type: 'success', message: 'Record reactivated to unverified status.' });
      }

      setConfirmAction(null);
      setConfirmTarget(null);
      fetchTabRecords(activeTab, page, searchQuery, statusFilter, sectorFilter, true);
      fetchGlobalMetadata();
    } catch (err: any) {
      console.error('[AdminData] Action failed:', err);
      // Section 21 source requirement error detection
      const detail = err?.message || 'Operation failed.';
      setFeedback({ type: 'error', message: detail });
      setConfirmAction(null);
      setConfirmTarget(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  // Helper for tab counts
  const getTabCount = (tabKey: DataTabKey): number => {
    if (!stats) return 0;
    switch (tabKey) {
      case 'courses': return stats.courses.total;
      case 'occupations': return stats.occupations.total;
      case 'providers': return stats.providers.total;
      case 'outcomes': return stats.outcomes.total;
      case 'career-paths': return stats.career_paths.total;
      case 'sources': return stats.sources.total;
    }
  };

  // Calculate catalog wide totals
  const catalogTotal = stats
    ? stats.courses.total +
      stats.occupations.total +
      stats.providers.total +
      stats.outcomes.total +
      stats.career_paths.total +
      stats.sources.total
    : 0;

  const verifiedTotal = stats
    ? stats.courses.verified +
      stats.occupations.verified +
      stats.providers.verified +
      stats.outcomes.verified +
      stats.career_paths.verified +
      stats.sources.verified
    : 0;

  const demoTotal = stats
    ? stats.courses.demo +
      stats.occupations.demo +
      stats.providers.demo +
      stats.outcomes.demo +
      stats.career_paths.demo +
      stats.sources.demo
    : 0;

  const inactiveTotal = stats
    ? stats.courses.inactive +
      stats.occupations.inactive +
      stats.providers.inactive +
      stats.outcomes.inactive +
      stats.career_paths.inactive +
      stats.sources.inactive
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-brand-400 ring-1 ring-border shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              Catalog & Knowledge Base Data Management
            </h1>
            <p className="text-xs text-text-secondary sm:text-sm">
              Structured administration of vocational training, occupations, providers, outcomes, and authoritative RAG provenance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTabRecords(activeTab, page, searchQuery, statusFilter, sectorFilter, true);
              fetchGlobalMetadata();
            }}
            disabled={isLoading || isRefreshing}
            className="gap-2 border-border/80 text-text-secondary hover:text-text-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* Demo Data Notice Banner (Section 22) */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3 shadow-sm">
        <FlaskConical className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-200">Demo Data — Generated for Development</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono border border-amber-500/40">
              Bulk Catalog Telemetry
            </span>
          </div>
          <p className="text-amber-300/90 leading-relaxed">
            These metrics and vocational catalog entities currently use generated demonstration data. Only records explicitly verified by an administrator with accredited source provenance are considered authoritative for production RAG retrieval.
          </p>
        </div>
      </div>

      {/* Catalog KPI Statistics */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-sm space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-brand-400" />
              Total Records
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
              {catalogTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-text-secondary">Across 6 catalog tables</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-sm space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Verified (RAG Authoritative)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {verifiedTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-text-secondary">Authoritative factual evidence</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-sm space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
              Demo / Generated
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
              {demoTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-text-secondary">Development sandbox data</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface p-4 shadow-sm space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <EyeOff className="h-3.5 w-3.5 text-rose-400" />
              Inactive Records
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
              {inactiveTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-text-secondary">Excluded from search/RAG</p>
          </div>
        </div>
      )}

      {/* Operation Feedback Toast */}
      {feedback && (
        <div
          className={`rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-text-muted hover:text-text-primary"
          >
            &times;
          </button>
        </div>
      )}

      {/* 6 Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-border/60 overflow-x-auto pb-1">
        {[
          { key: 'courses', label: 'Courses', icon: BookOpen },
          { key: 'occupations', label: 'Occupations', icon: Briefcase },
          { key: 'providers', label: 'Providers', icon: Building2 },
          { key: 'outcomes', label: 'Outcomes', icon: TrendingUp },
          { key: 'career-paths', label: 'Career Paths', icon: GitBranch },
          { key: 'sources', label: 'Sources', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const count = getTabCount(tab.key as DataTabKey);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key as DataTabKey)}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-400 font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-mono border ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                    : 'bg-surface-elevated text-text-muted border-border'
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Filter Controls */}
      <DataTabHeader
        tab={activeTab}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        sectorFilter={sectorFilter}
        options={options}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        onStatusChange={(st) => {
          setStatusFilter(st);
          setPage(1);
        }}
        onSectorChange={(sc) => {
          setSectorFilter(sc);
          setPage(1);
        }}
        onReset={handleResetFilters}
        onAddClick={handleAdd}
        isLoading={isLoading || isRefreshing}
      />

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Loading catalog records and provenance metadata..." />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="py-8">
          <ErrorState
            title="We couldn't load this data right now."
            message="There was an issue communicating with the catalog management service. Please try again."
            onRetry={() => fetchTabRecords(activeTab, page, searchQuery, statusFilter, sectorFilter)}
          />
        </div>
      )}

      {/* Loaded Table View */}
      {data && !isLoading && (
        <DataTableView
          tab={activeTab}
          items={data.items}
          total={data.total}
          page={page}
          pageSize={pageSize}
          totalPages={data.total_pages}
          onPageChange={(p) => setPage(p)}
          onView={handleView}
          onEdit={handleEdit}
          onVerify={handleVerifyClick}
          onDeactivate={handleDeactivateClick}
          onReactivate={handleReactivateClick}
        />
      )}

      {/* View Detail Modal */}
      <DataDetailModal
        isOpen={isViewOpen}
        title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        data={selectedRecord}
        onClose={() => setIsViewOpen(false)}
        onEdit={() => {
          setIsViewOpen(false);
          if (selectedRecord) handleEdit(selectedRecord);
        }}
      />

      {/* Create / Edit Form Modal */}
      <DataFormModal
        isOpen={isFormOpen}
        tab={activeTab}
        initialData={formInitialData}
        options={options}
        isLoading={isFormSubmitting}
        onSave={handleSaveRecord}
        onClose={() => setIsFormOpen(false)}
      />

      {/* Confirmation Modal (Verify / Deactivate / Reactivate) */}
      <DataConfirmationModal
        isOpen={Boolean(confirmAction)}
        actionType={confirmAction}
        recordName={confirmTarget?.name || confirmTarget?.occupation_name || `Record #${confirmTarget?.id}`}
        sourceName={confirmTarget?.data_source_name}
        isDemo={confirmTarget?.status === 'demo'}
        isLoading={isConfirmLoading}
        onConfirm={handleExecuteWorkflow}
        onClose={() => {
          setConfirmAction(null);
          setConfirmTarget(null);
        }}
      />
    </div>
  );
};
