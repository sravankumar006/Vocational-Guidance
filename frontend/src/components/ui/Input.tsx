import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  disabled,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-text-secondary select-none"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full bg-white/[0.03] text-text-primary placeholder:text-text-muted border rounded-lg py-2 transition-colors text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightIcon ? 'pr-9' : 'pr-3'} ${
            error ? 'border-status-error/80 focus:ring-rose-400' : 'border-border/60 hover:border-border'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-text-muted flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-status-error flex items-center gap-1 font-medium">
          <span>•</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
