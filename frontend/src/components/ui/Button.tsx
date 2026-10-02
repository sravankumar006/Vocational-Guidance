import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400/50 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white active:bg-accent-active shadow-soft',
    secondary: 'bg-background-elevated hover:bg-background-surface text-text-primary border border-border/60',
    outline: 'bg-transparent hover:bg-white/[0.04] text-text-primary border border-border/70',
    ghost: 'bg-transparent hover:bg-white/[0.04] text-text-secondary hover:text-text-primary',
    danger: 'bg-status-error/90 hover:bg-status-error text-white',
    success: 'bg-status-success/90 hover:bg-status-success text-white',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-sm sm:text-base px-4 py-2.5 rounded-lg gap-2',
    xl: 'text-base px-5 py-3 rounded-xl gap-2.5 font-medium',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="inline-flex shrink-0">{leftIcon}</span>
      ) : null}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
