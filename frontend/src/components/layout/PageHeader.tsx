import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 pb-4 border-b border-border/30 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-1" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
