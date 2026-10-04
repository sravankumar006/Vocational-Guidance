import React from 'react';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface EscalationStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const EscalationStatusBadge: React.FC<EscalationStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normStatus = (status || 'pending').toLowerCase().replace('-', '_').replace(' ', '_');
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (normStatus) {
    case 'resolved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <CheckCircle2 className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>● Resolved</span>
        </span>
      );

    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <Loader2 className={`${isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} animate-spin`} />
          <span>● In Progress</span>
        </span>
      );

    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <Clock className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>● Pending</span>
        </span>
      );
  }
};
