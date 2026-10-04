import React from 'react';
import { Card } from '@/components/ui/Card';

export interface AnalyticsSummaryCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({
  label,
  value,
  subtext,
  icon,
  badge,
  className = '',
}) => {
  return (
    <Card className={`relative overflow-hidden border border-border/60 bg-surface-base/80 p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {label}
          </span>
          <div className="text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </div>
        </div>
        {icon && (
          <div className="rounded-lg bg-surface-elevated/80 p-2.5 text-brand-300 ring-1 ring-border/40 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(subtext || badge) && (
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-text-secondary">
          {subtext && <span className="truncate">{subtext}</span>}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </Card>
  );
};
