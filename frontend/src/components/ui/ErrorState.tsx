import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-rose-900/60 bg-rose-950/20 ${className}`}
    >
      <div className="p-3 rounded-full bg-rose-950/60 text-rose-400 mb-3 border border-rose-800/80">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-200 mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md mb-5">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

// Re-export for backward compatibility
export const Error = ErrorState;
