import React from 'react';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label: string;
  withDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  withDot = true,
  className = '',
  ...props
}) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    info: 'bg-slate-400/10 text-slate-300 border border-slate-400/20',
    neutral: 'bg-white/[0.04] text-text-secondary border border-white/[0.06]',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-slate-400',
    neutral: 'bg-text-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium select-none ${styles[status]} ${className}`}
      {...props}
    >
      {withDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      )}
      <span>{label}</span>
    </span>
  );
};
