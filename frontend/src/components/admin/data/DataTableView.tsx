import React from 'react';
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
}) => {
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

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-surface shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-surface-elevated/70 text-text-muted uppercase font-mono text-[10px] tracking-wider">
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
                className="hover:bg-surface-elevated/40 transition-colors group"
              >
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
    </div>
  );
};
