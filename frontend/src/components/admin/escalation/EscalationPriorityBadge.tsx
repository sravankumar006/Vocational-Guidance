import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface EscalationPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

export const EscalationPriorityBadge: React.FC<EscalationPriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const norm = (priority || 'medium').toLowerCase();
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (norm) {
    case 'urgent':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase ${sizeClasses}`}
        >
          <AlertTriangle className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>URGENT</span>
        </span>
      );

    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase ${sizeClasses}`}
        >
          <AlertCircle className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>HIGH</span>
        </span>
      );

    case 'low':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md bg-surface-elevated text-text-muted border border-border uppercase ${sizeClasses}`}
        >
          <Info className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>LOW</span>
        </span>
      );

    case 'medium':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase ${sizeClasses}`}
        >
          <Info className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span>MEDIUM</span>
        </span>
      );
  }
};
