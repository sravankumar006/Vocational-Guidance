import React from 'react';
import { Card } from '@/components/ui/Card';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  action,
  children,
  height = 300,
  className = '',
}) => {
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div style={{ height, minHeight: height }} className="w-full relative">
        {children}
      </div>
    </Card>
  );
};
