import React from 'react';
import type { DataRecordStatus } from '@/types/adminData';
import { CheckCircle2, FlaskConical, AlertCircle, EyeOff } from 'lucide-react';

interface DataStatusBadgeProps {
  status: DataRecordStatus | string;
  size?: 'sm' | 'md';
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = (status || 'demo').toLowerCase();

  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (normStatus) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}
          title="Verified by Administrator - Authoritative for RAG Retrieval"
        >
          <CheckCircle2 className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>VERIFIED</span>
        </span>
      );

    case 'unverified':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-surface-elevated text-text-secondary border border-border ${sizeClasses}`}
          title="Unverified - Pending Administrative Review"
        >
          <AlertCircle className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>UNVERIFIED</span>
        </span>
      );

    case 'inactive':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}
          title="Inactive - Excluded from search and RAG retrieval"
        >
          <EyeOff className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>INACTIVE</span>
        </span>
      );

    case 'demo':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}
          title="Demo / Generated Data - For Development Only"
        >
          <FlaskConical className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>DEMO</span>
        </span>
      );
  }
};
