import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  disabled,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-text-primary select-none"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`w-full bg-background-elevated text-text-primary placeholder:text-text-muted border rounded-lg p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-y ${
          error ? 'border-status-error' : 'border-border hover:border-border-strong'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-status-error flex items-center gap-1 font-medium">
          <span>•</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
};
