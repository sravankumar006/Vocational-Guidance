import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
    xl: 'p-7 sm:p-9',
  };

  return (
    <div
      className={`bg-surface-glass backdrop-blur-md rounded-xl border border-border-strong/60 shadow-glass text-text-primary ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
