import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <span className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </span>
      )}
      <div className="space-y-2">
        {options.map((opt) => {
          const optId = `${name}-${opt.value}`;
          const isSelected = selectedValue === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'bg-background-surface border-border-strong ring-1 ring-border-strong'
                  : 'bg-background-elevated border-border hover:border-border-strong'
              } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <div className="w-4 h-4 rounded-full border border-border-strong bg-background-card peer-checked:border-accent flex items-center justify-center mt-0.5 shrink-0">
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {opt.label}
                </div>
                {opt.description && (
                  <div className="text-xs text-text-secondary mt-0.5">
                    {opt.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
