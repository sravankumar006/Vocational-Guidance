import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon: React.ReactNode;
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white border border-border-strong',
    secondary: 'bg-background-elevated hover:bg-background-surface text-text-primary border border-border',
    outline: 'bg-transparent hover:bg-background-card text-text-primary border border-border-strong',
    ghost: 'bg-transparent hover:bg-background-elevated text-text-secondary hover:text-text-primary',
    danger: 'bg-status-error hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
    xl: 'p-3.5 text-lg',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};
