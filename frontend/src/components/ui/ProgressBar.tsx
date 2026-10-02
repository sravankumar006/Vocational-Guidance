import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    primary: 'bg-brand-500',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    info: 'bg-status-info',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="font-medium text-text-primary">{label}</span>}
          {showPercent && (
            <span className="text-text-secondary">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full bg-background-elevated rounded-full overflow-hidden border border-border/50 ${heights[size]}`}
      >
        <div
          className={`h-full transition-all duration-300 ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
