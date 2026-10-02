import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'outline' | 'pill';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium select-none';

  const variants = {
    default: 'bg-background-elevated text-text-primary border border-border',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    outline: 'bg-transparent text-text-secondary border border-border-strong',
    pill: 'bg-slate-700 text-slate-100 rounded-full px-2.5',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
