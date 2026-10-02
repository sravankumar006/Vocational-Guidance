import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: 'bg-background-elevated border-border-strong text-slate-200',
    success: 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/80 text-amber-200',
    error: 'bg-rose-950/40 border-rose-800/80 text-rose-200',
  };

  const icons = {
    info: <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${styles[type]} ${className}`}
    >
      {icons[type]}
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="text-text-secondary">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary rounded"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
