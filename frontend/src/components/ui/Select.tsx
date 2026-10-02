import React from 'react';
import { SelectOption } from '@/types';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  disabled,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-text-secondary select-none"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none bg-white/[0.03] text-text-primary border rounded-lg py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
            error ? 'border-status-error/80' : 'border-border/60 hover:border-border'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-background-card text-text-primary py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-text-muted">
          <ChevronDown className="h-4 w-4" />
        </div>
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
