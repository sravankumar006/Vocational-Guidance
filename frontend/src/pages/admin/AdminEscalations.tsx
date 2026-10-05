import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  Users,
  FlaskConical,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { adminEscalationService } from '@/services/adminEscalationService';
import type {
  AdminEscalationsPaginatedResponse,
  EscalationListItem,
  EscalationDetailItem,
  EscalationFilterParams,
  EscalationStats,
} from '@/types/adminEscalation';
import { EscalationFilters } from '@/components/admin/escalation/EscalationFilters';
import { EscalationTable } from '@/components/admin/escalation/EscalationTable';
import { EscalationDetailModal } from '@/components/admin/escalation/EscalationDetailModal';
import { EscalationConfirmationModal } from '@/components/admin/escalation/EscalationConfirmationModal';

export const AdminEscalations: React.FC = () => {
  const [data, setData] = useState<AdminEscalationsPaginatedResponse | null>(null);
  const [filters, setFilters] = useState<EscalationFilterParams>({
    status: 'all',
    language: 'all',
    concern: 'all',
    sort: 'pending_first',
    page: 1,
    page_size: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<EscalationDetailItem | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [transitionCandidate, setTransitionCandidate] = useState<EscalationListItem | null>(null);
  const [targetTransitionStatus, setTargetTransitionStatus] = useState<'in_progress' | 'resolved'>('in_progress');

  // Feedback banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchEscalations = useCallback(async (currentFilters: EscalationFilterParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminEscalationService.getEscalations(currentFilters);
      setData(response);
    } catch (err: any) {
      console.error('[AdminEscalations] Failed to load escalations:', err);
      setError("We couldn't load escalations right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscalations(filters);
  }, [filters, fetchEscalations]);

  const handleFilterChange = (updated: Partial<EscalationFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      language: 'all',
      concern: 'all',
      sort: 'pending_first',
      page: 1,
      page_size: 10,
      search: undefined,
      start_date: undefined,
      end_date: undefined,
      career: undefined,
    });
  };

  const handleViewDetails = async (item: EscalationListItem) => {
    try {
      const detail = await adminEscalationService.getEscalation(item.id);
      setSelectedDetail(detail);
      setDetailModalOpen(true);
    } catch (err: any) {
      console.error('[AdminEscalations] Failed to load case details:', err);
      setError('Unable to load full case history right now.');
    }
  };

  const handleOpenTransitionModal = (
    item: EscalationListItem,
    target: 'in_progress' | 'resolved'
  ) => {
    setTransitionCandidate(item);
    setTargetTransitionStatus(target);
    setConfirmModalOpen(true);
  };

  const handleConfirmTransition = async (notes?: string) => {
    if (!transitionCandidate) return;

    try {
      const targetLabel = targetTransitionStatus === 'in_progress' ? 'In Progress' : 'Resolved';
      const updated = await adminEscalationService.updateStatus(transitionCandidate.id, {
        status: targetLabel,
        resolution_notes: notes,
      });

      // Update in current view
      setData((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((it) => (it.id === updated.id ? { ...it, status: updated.status } : it));
        return { ...prev, items: newItems };
      });

      // If detail modal is open for this case, refresh it
      if (selectedDetail && selectedDetail.id === updated.id) {
        setSelectedDetail(updated);
      }

      setActionSuccessMessage(
        `Case #${transitionCandidate.id} successfully updated to ${targetLabel}.`
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Silently re-fetch to sync counters and sort orders
      fetchEscalations(filters);
    } catch (err: any) {
      console.error('[AdminEscalations] Status update failed:', err);
      throw err;
    }
  };

  const stats: EscalationStats = data?.stats || {
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Demo Notice Banner */}
      <div className="flex items-center justify-between p-3 sm:p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300">
        <div className="flex items-center gap-2.5">
          <FlaskConical className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Demo Data — Generated for Development:</strong> These escalation records represent simulated
            beneficiary resistance and low-confidence cases to validate the human counsellor intervention lifecycle.
          </span>
        </div>
      </div>

      {/* Header & KPI Summary */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Human Escalation Management
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Review, triage, and manage student and parent guidance cases requiring intervention by professional counsellors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchEscalations(filters)}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Cases */}
          <div className="bg-surface-card border border-border rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium">Total Cases</span>
              <Users className="h-4 w-4 text-text-secondary" />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-[11px] text-text-muted">Logged across system</div>
          </div>

          {/* Pending Cases */}
          <div className="bg-surface-card border border-amber-500/25 rounded-xl p-4 space-y-1 shadow-sm bg-amber-500/[0.02]">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-medium">● Pending Triage</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-[11px] text-text-muted">Awaiting counsellor review</div>
          </div>

          {/* In Progress */}
          <div className="bg-surface-card border border-blue-500/25 rounded-xl p-4 space-y-1 shadow-sm bg-blue-500/[0.02]">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-xs font-medium">● In Progress</span>
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
            <div className="text-[11px] text-text-muted">Actively being handled</div>
          </div>

          {/* Resolved */}
          <div className="bg-surface-card border border-emerald-500/25 rounded-xl p-4 space-y-1 shadow-sm bg-emerald-500/[0.02]">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-medium">● Resolved</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.resolved}</div>
            <div className="text-[11px] text-text-muted">
              {stats.total > 0 ? `${((stats.resolved / stats.total) * 100).toFixed(0)}% resolution rate` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filters */}
      <EscalationFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Main Table / State Section */}
      {error ? (
        <div className="bg-surface-card border border-border rounded-xl p-10 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{error}</h3>
          <button
            onClick={() => fetchEscalations(filters)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : isLoading && !data ? (
        /* Loading Skeleton */
        <div className="bg-surface-card border border-border rounded-xl p-8 space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-xs text-text-muted">Loading human escalations...</p>
        </div>
      ) : (
        <EscalationTable
          items={data?.items || []}
          total={data?.total || 0}
          page={data?.page || 1}
          pageSize={data?.page_size || 10}
          totalPages={data?.total_pages || 1}
          onPageChange={(p) => handleFilterChange({ page: p })}
          onViewDetails={handleViewDetails}
          onTransitionStatus={handleOpenTransitionModal}
          isLoading={isLoading}
          onClearFilters={handleResetFilters}
          hasFilters={Boolean(
            filters.search ||
              filters.status !== 'all' ||
              filters.concern !== 'all' ||
              filters.language !== 'all' ||
              filters.start_date ||
              filters.end_date
          )}
        />
      )}

      {/* Modals */}
      <EscalationDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        escalation={selectedDetail}
        onTransitionStatus={(target) => {
          if (selectedDetail) {
            handleOpenTransitionModal(selectedDetail, target);
          }
        }}
        onEscalationUpdated={(updated) => {
          setSelectedDetail(updated);
          fetchEscalations(filters);
        }}
      />

      <EscalationConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        escalation={transitionCandidate}
        targetStatus={targetTransitionStatus}
        onConfirm={handleConfirmTransition}
      />
    </div>
  );
};
