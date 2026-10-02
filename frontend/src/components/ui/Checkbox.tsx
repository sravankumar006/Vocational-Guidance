import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  id,
  checked,
  className = '',
  disabled,
  ...props
}) => {
  const checkboxId = id || `check-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-start gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 rounded border border-border-strong bg-background-elevated peer-checked:bg-accent peer-checked:border-accent transition-colors flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400">
          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        {description && (
          <div className="text-xs text-text-secondary mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
};
