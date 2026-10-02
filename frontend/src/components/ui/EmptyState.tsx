import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border bg-background-card/40 ${className}`}
    >
      <div className="p-3.5 rounded-full bg-background-elevated text-text-muted mb-4 border border-border">
        {icon || <Inbox className="h-6 w-6 text-text-muted" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-md mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
