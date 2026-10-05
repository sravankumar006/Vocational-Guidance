import React, { useState, useEffect } from 'react';
import type { DataTabKey } from '@/types/adminData';
import { DataStatusBadge } from './DataStatusBadge';
import { Button } from '@/components/ui/Button';
import {
  Eye,
  Edit2,
  ShieldCheck,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckSquare,
  Loader2,
  X,
} from 'lucide-react';

interface DataTableViewProps {
  tab: DataTabKey;
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onView: (item: any) => void;
  onEdit: (item: any) => void;
  onVerify: (item: any) => void;
  onDeactivate: (item: any) => void;
  onReactivate: (item: any) => void;
  onBulkAction?: (action: 'verify' | 'deactivate', ids: number[]) => Promise<void>;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  tab,
  items,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onVerify,
  onDeactivate,
  onReactivate,
  onBulkAction,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmAction, setBulkConfirmAction] = useState<'verify' | 'deactivate' | null>(null);
  const [isBulkExecuting, setIsBulkExecuting] = useState<boolean>(false);

  // Clear selections when tab or page changes
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkConfirmAction(null);
  }, [tab, page]);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-border/60 bg-surface/50 p-8 space-y-2">
        <p className="text-sm font-medium text-text-primary">No records found matching your filters.</p>
        <p className="text-xs text-text-muted">Try resetting search query or status filters.</p>
      </div>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const currentPageIds = items.map((it) => it.id);
  const isAllSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const isSomeSelected = currentPageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      currentPageIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      currentPageIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExecuteBulkAction = async () => {
    if (!bulkConfirmAction || !onBulkAction || selectedIds.size === 0) return;
    setIsBulkExecuting(true);
    try {
      await onBulkAction(bulkConfirmAction, Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkConfirmAction(null);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-brand-400" />
            <span className="font-semibold text-text-primary">
              Selected <span className="font-mono text-brand-400 font-bold">{selectedIds.size}</span> of {items.length} records on this page
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setBulkConfirmAction('verify')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 h-8 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Bulk Verify</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setBulkConfirmAction('deactivate')}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium gap-1.5 h-8 text-xs"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Bulk Deactivate</span>
            </Button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-text-muted hover:text-text-primary px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-surface shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-surface-elevated/70 text-text-muted uppercase font-mono text-[10px] tracking-wider">
              <th className="w-10 py-3 px-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                  }}
                  onChange={toggleSelectAll}
                  aria-label="Select all records on current page"
                  className="rounded border-border text-brand-500 focus:ring-brand-500/20 bg-surface-elevated cursor-pointer h-3.5 w-3.5"
                />
              </th>
              {tab === 'courses' && (
                <>
                  <th className="py-3 px-4 font-semibold">Course Title</th>
                  <th className="py-3 px-4 font-semibold">Sector</th>
                  <th className="py-3 px-4 font-semibold">Qualification</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Provider</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}

              {tab === 'occupations' && (
                <>
                  <th className="py-3 px-4 font-semibold">Occupation Title</th>
                  <th className="py-3 px-4 font-semibold">Sector</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}

              {tab === 'providers' && (
                <>
                  <th className="py-3 px-4 font-semibold">Provider Name</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Courses</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}

              {tab === 'outcomes' && (
                <>
                  <th className="py-3 px-4 font-semibold">Occupation Role</th>
                  <th className="py-3 px-4 font-semibold">Region</th>
                  <th className="py-3 px-4 font-semibold">Salary Range</th>
                  <th className="py-3 px-4 font-semibold">Placement Rate</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}

              {tab === 'career-paths' && (
                <>
                  <th className="py-3 px-4 font-semibold">Career Path Title</th>
                  <th className="py-3 px-4 font-semibold">Estimated Duration</th>
                  <th className="py-3 px-4 font-semibold">Overview</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}

              {tab === 'sources' && (
                <>
                  <th className="py-3 px-4 font-semibold">Source Authority</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">URL / Reference</th>
                  <th className="py-3 px-4 font-semibold">Version</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/40 text-text-secondary">
            {items.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-surface-elevated/40 transition-colors group ${
                  selectedIds.has(row.id) ? 'bg-brand-500/[0.04]' : ''
                }`}
              >
                <td className="w-10 py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelectOne(row.id)}
                    aria-label={`Select ${row.name || `record ${row.id}`}`}
                    className="rounded border-border text-brand-500 focus:ring-brand-500/20 bg-surface-elevated cursor-pointer h-3.5 w-3.5"
                  />
                </td>
                {/* 1. COURSES ROW */}
                {tab === 'courses' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary max-w-xs truncate">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.sector || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-surface-elevated px-2 py-0.5 border border-border text-[11px]">
                        {row.qualification_level || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{row.duration || '—'}</td>
                    <td className="py-3 px-4 text-text-secondary max-w-[140px] truncate">
                      {row.provider_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-[120px] truncate">
                      {row.data_source_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* 2. OCCUPATIONS ROW */}
                {tab === 'occupations' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.sector || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-sm truncate">
                      {row.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-[120px] truncate">
                      {row.data_source_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* 3. PROVIDERS ROW */}
                {tab === 'providers' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.location || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                      {row.provider_type || 'Accredited Center'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-surface-elevated px-2 py-0.5 text-[11px] border border-border">
                        {row.course_count || 0} programs
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* 4. OUTCOMES ROW */}
                {tab === 'outcomes' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {row.occupation_name || `Occupation #${row.occupation_id || '—'}`}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.region || 'National'}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 whitespace-nowrap font-mono">
                      ₹{row.salary_range_min?.toLocaleString() || 0} - ₹{row.salary_range_max?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-text-primary">
                      {row.employment_rate !== null && row.employment_rate !== undefined ? `${row.employment_rate}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-[120px] truncate">
                      {row.data_source_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* 5. CAREER PATHS ROW */}
                {tab === 'career-paths' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.estimated_duration || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-sm truncate">
                      {row.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-[120px] truncate">
                      {row.data_source_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* 6. SOURCES ROW */}
                {tab === 'sources' && (
                  <>
                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                      {row.source_type || '—'}
                    </td>
                    <td className="py-3 px-4 text-text-muted max-w-xs truncate">
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-400 hover:underline"
                        >
                          <span className="truncate">{row.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                      {row.version || 'v1.0'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DataStatusBadge status={row.status} />
                    </td>
                  </>
                )}

                {/* SHARED ACTIONS COLUMN */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      title="View Details"
                      className="rounded p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      title="Edit Record"
                      className="rounded p-1.5 text-text-muted hover:text-brand-400 hover:bg-surface-elevated transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {row.status !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => onVerify(row)}
                        title="Verify Record for RAG"
                        className="rounded p-1.5 text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {row.status !== 'inactive' ? (
                      <button
                        type="button"
                        onClick={() => onDeactivate(row)}
                        title="Deactivate Record"
                        className="rounded p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onReactivate(row)}
                        title="Reactivate Record"
                        className="rounded p-1.5 text-text-muted hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-text-secondary">
        <div>
          Showing <span className="font-medium text-text-primary">{startIdx}</span> to{' '}
          <span className="font-medium text-text-primary">{endIdx}</span> of{' '}
          <span className="font-medium text-text-primary">{total.toLocaleString()}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 gap-1 px-2.5 text-xs border-border/80"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </Button>

          <span className="px-2 text-xs font-mono text-text-muted">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 gap-1 px-2.5 text-xs border-border/80"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Bulk Confirmation Modal */}
      {bulkConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-card border border-border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                {bulkConfirmAction === 'verify' ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>Confirm Bulk Verification</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-5 w-5 text-rose-400" />
                    <span>Confirm Bulk Deactivation</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBulkConfirmAction(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bulkConfirmAction === 'verify' ? (
              <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  You are about to verify {selectedIds.size} records.
                </p>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-emerald-300">
                  Verified records may become eligible for authoritative RAG retrieval.
                </div>
                <p>
                  Please confirm that these records have been reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
                <p className="font-semibold text-text-primary">
                  You are about to deactivate {selectedIds.size} records.
                </p>
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-300">
                  Deactivated records will be excluded from search and RAG knowledge base retrieval.
                </div>
                <p>
                  Please confirm that you want to deactivate these records.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkConfirmAction(null)}
                disabled={isBulkExecuting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteBulkAction}
                disabled={isBulkExecuting}
                className={
                  bulkConfirmAction === 'verify'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium'
                    : 'bg-rose-600 hover:bg-rose-500 text-white font-medium'
                }
              >
                {isBulkExecuting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Processing...</span>
                  </>
                ) : bulkConfirmAction === 'verify' ? (
                  'Confirm Verification'
                ) : (
                  'Confirm Deactivation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
