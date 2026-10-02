import React from 'react';
import { Card } from '@/components/ui/Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  badge,
  trend,
  className = '',
}) => {
  return (
    <Card className={`relative ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-medium text-text-secondary tracking-normal">
            {label}
          </span>
          <div className="text-2xl font-bold text-text-primary tracking-tight">
            {value}
          </div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/[0.04] text-text-secondary shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(subtext || trend || badge) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/40 text-xs text-text-secondary">
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
    </Card>
  );
};
