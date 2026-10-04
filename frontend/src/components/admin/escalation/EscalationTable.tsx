import React from 'react';
import {
  Eye,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { EscalationListItem } from '@/types/adminEscalation';
import { EscalationStatusBadge } from './EscalationStatusBadge';
import { EscalationPriorityBadge } from './EscalationPriorityBadge';

interface EscalationTableProps {
  items: EscalationListItem[];
  total: number;
  page: number;
  pageSize?: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onViewDetails: (item: EscalationListItem) => void;
  onTransitionStatus: (item: EscalationListItem, target: 'in_progress' | 'resolved') => void;
  isLoading?: boolean;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

export const EscalationTable: React.FC<EscalationTableProps> = ({
  items,
  total,
  page,
  totalPages,
  onPageChange,
  onViewDetails,
  onTransitionStatus,
  isLoading = false,
  onClearFilters,
  hasFilters = false,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="bg-surface-card border border-border rounded-xl p-12 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted border border-border">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">
          {hasFilters ? 'No escalations match your current filters.' : 'No human escalations found.'}
        </h3>
        <p className="text-xs text-text-muted max-w-sm mx-auto">
          {hasFilters
            ? 'Try broadening your search term, clearing concern categories, or selecting all statuses.'
            : 'When counselling sessions encounter unresolved resistance or low AI confidence, escalated cases will appear here for human counsellor review.'}
        </p>
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-3 px-4">Student & Family</th>
              <th className="py-3 px-4">Career & Concern</th>
              <th className="py-3 px-3">Lang</th>
              <th className="py-3 px-4">Summary</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => {
              const normStatus = (item.status || 'pending').toLowerCase().replace('-', '_').replace(' ', '_');

              return (
                <tr
                  key={item.id}
                  className="hover:bg-surface-elevated/40 transition-colors group"
                >
                  {/* Student & Family */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{item.student_name}</span>
                        <EscalationPriorityBadge priority={item.priority} size="sm" />
                      </div>
                      <div className="text-[11px] text-text-muted">
                        Parent: <span className="text-text-secondary">{item.parent_name || 'Parent Account'}</span>
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Case #{item.id}</div>
                    </div>
                  </td>

                  {/* Career & Concern */}
                  <td className="py-3.5 px-4 align-top max-w-[200px]">
                    <div className="space-y-1">
                      <div className="font-medium text-text-primary truncate" title={item.career_title}>
                        {item.career_title}
                      </div>
                      <div className="inline-block text-[11px] px-2 py-0.5 rounded font-medium bg-accent/10 text-accent border border-accent/20">
                        {item.concern}
                      </div>
                    </div>
                  </td>

                  {/* Language */}
                  <td className="py-3.5 px-3 align-top">
                    <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                      {item.language}
                    </span>
                  </td>

                  {/* Summary */}
                  <td className="py-3.5 px-4 align-top max-w-[280px]">
                    <p
                      className="text-xs text-text-secondary line-clamp-2 leading-relaxed"
                      title={item.conversation_summary || item.reason || ''}
                    >
                      {item.conversation_summary || item.reason || 'Requested counsellor intervention.'}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 align-top whitespace-nowrap">
                    <EscalationStatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-3 align-top whitespace-nowrap text-[11px] text-text-muted">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Lifecycle Action Button */}
                      {normStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => onTransitionStatus(item, 'in_progress')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
                          title="Begin reviewing this case"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Start Review</span>
                        </button>
                      )}

                      {normStatus === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => onTransitionStatus(item, 'resolved')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                          title="Mark this case as resolved"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Resolve</span>
                        </button>
                      )}

                      {/* Detail View Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors border border-border"
                        title="View case details & conversation"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Responsive Cards */}
      <div className="block lg:hidden divide-y divide-border">
        {items.map((item) => {
          const normStatus = (item.status || 'pending').toLowerCase().replace('-', '_').replace(' ', '_');

          return (
            <div key={item.id} className="p-4 space-y-3 hover:bg-surface-elevated/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-text-primary text-sm">{item.student_name}</span>
                    <EscalationPriorityBadge priority={item.priority} size="sm" />
                    <span className="text-[10px] text-text-muted font-mono">#{item.id}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Parent: <span className="text-text-secondary">{item.parent_name || 'Parent Account'}</span>
                  </div>
                </div>
                <EscalationStatusBadge status={item.status} size="sm" />
              </div>

              <div className="space-y-1.5 text-xs bg-surface p-2.5 rounded-lg border border-border">
                <div className="flex justify-between">
                  <span className="text-text-muted">Target Career:</span>
                  <span className="font-medium text-text-primary text-right">{item.career_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Concern:</span>
                  <span className="font-medium text-accent">{item.concern}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Language:</span>
                  <span className="font-mono uppercase text-text-secondary">{item.language}</span>
                </div>
              </div>

              {item.conversation_summary && (
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {item.conversation_summary}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px] text-text-muted border-t border-border/40">
                <span>{formatDate(item.created_at)}</span>

                <div className="flex items-center gap-2">
                  {normStatus === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(item, 'in_progress')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    >
                      Start Review
                    </button>
                  )}
                  {normStatus === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => onTransitionStatus(item, 'resolved')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    >
                      Resolve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewDetails(item)}
                    className="p-1.5 rounded-md border border-border text-text-muted hover:text-text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-border bg-surface-elevated/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
        <div>
          Showing page <span className="font-semibold text-text-primary">{page}</span> of{' '}
          <span className="font-semibold text-text-primary">{totalPages}</span> ({total} total escalations)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
