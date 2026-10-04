import React from 'react';
import { DataStatusBadge } from './DataStatusBadge';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Database, CheckCircle, MapPin, DollarSign, Layers } from 'lucide-react';

interface DataDetailModalProps {
  isOpen: boolean;
  title: string;
  data: Record<string, any> | null;
  onClose: () => void;
  onEdit?: () => void;
}

export const DataDetailModal: React.FC<DataDetailModalProps> = ({
  isOpen,
  title,
  data,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-surface-elevated shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-surface">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-text-muted font-mono">{title} Details</span>
              <DataStatusBadge status={data.status} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              {data.name || data.occupation_name || `Record #${data.id}`}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body with scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.sector && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand-400" />
                  Sector / Industry
                </span>
                <p className="font-medium text-text-primary">{data.sector}</p>
              </div>
            )}

            {data.qualification_level && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-sky-400" />
                  Qualification / NSQF
                </span>
                <p className="font-medium text-text-primary">{data.qualification_level}</p>
              </div>
            )}

            {data.duration && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Training Duration
                </span>
                <p className="font-medium text-text-primary">{data.duration}</p>
              </div>
            )}

            {data.provider_name && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted">Training Provider</span>
                <p className="font-medium text-text-primary">{data.provider_name}</p>
              </div>
            )}

            {data.location && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  Location / Region
                </span>
                <p className="font-medium text-text-primary">{data.location}</p>
              </div>
            )}

            {data.region && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  Geographic Region
                </span>
                <p className="font-medium text-text-primary">{data.region}</p>
              </div>
            )}

            {(data.salary_range_min !== undefined || data.salary_range_max !== undefined) && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  Salary Range
                </span>
                <p className="font-medium text-emerald-400">
                  ₹{data.salary_range_min?.toLocaleString() || 0} - ₹{data.salary_range_max?.toLocaleString() || 0} ({data.salary_currency || 'INR'})
                </p>
              </div>
            )}

            {data.employment_rate !== undefined && data.employment_rate !== null && (
              <div className="rounded-lg bg-surface/60 border border-border/40 p-3 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-text-muted">Placement Rate</span>
                <p className="font-medium text-text-primary">{data.employment_rate}%</p>
              </div>
            )}
          </div>

          {/* Description */}
          {data.description && (
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Description / Scope</span>
              <p className="text-text-secondary bg-surface p-3.5 rounded-lg border border-border/40 leading-relaxed text-xs sm:text-sm">
                {data.description}
              </p>
            </div>
          )}

          {/* Skill Requirements / JSON */}
          {data.skill_requirements && (
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Skills / Pack Details</span>
              <div className="bg-surface p-3.5 rounded-lg border border-border/40 text-xs font-mono text-text-secondary overflow-x-auto">
                <pre>{typeof data.skill_requirements === 'string' ? data.skill_requirements : JSON.stringify(data.skill_requirements, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Source Provenance */}
          <div className="rounded-lg bg-surface/80 border border-border/60 p-3.5 space-y-2">
            <span className="text-xs uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-brand-400" />
              Source Provenance
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">Linked Source: </span>
                <span className="font-medium text-text-primary">{data.data_source_name || data.source_type || 'None linked'}</span>
              </div>
              {data.url && (
                <div className="truncate">
                  <span className="text-text-muted">URL: </span>
                  <a href={data.url} target="_blank" rel="noreferrer" className="text-brand-400 underline hover:text-brand-300">
                    {data.url}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Audit / Metadata Timestamps */}
          <div className="border-t border-border/40 pt-3 text-[11px] text-text-muted grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span>Created: </span>
              <span className="text-text-secondary">{new Date(data.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span>Updated: </span>
              <span className="text-text-secondary">{new Date(data.updated_at).toLocaleString()}</span>
            </div>
            {data.verified_at && (
              <div>
                <span>Verified: </span>
                <span className="text-emerald-400">{new Date(data.verified_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 bg-surface">
          <span className="text-xs text-text-muted">ID: #{data.id}</span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit Record
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
