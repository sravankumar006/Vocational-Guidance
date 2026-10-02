import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <section className={`space-y-3.5 ${className}`} {...props}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border/25">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-text-primary tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
};
