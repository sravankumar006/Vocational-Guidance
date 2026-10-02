import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-colors text-text-primary';

  const variants = {
    default: 'bg-background-card border border-border/70 shadow-soft',
    elevated: 'bg-background-surface border border-border shadow-elevated',
    interactive: 'bg-background-card border border-border/70 hover:border-border-strong hover:bg-background-surface cursor-pointer shadow-soft',
    outline: 'bg-transparent border border-border/50',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
    xl: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
