import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullHeight = false,
  className = '',
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center text-text-secondary select-none ${
        fullHeight ? 'min-h-[60vh]' : ''
      } ${className}`}
    >
      <Loader2 className={`animate-spin text-brand-400 mb-3 ${sizes[size]}`} />
      {message && <p className="text-sm font-medium text-text-primary">{message}</p>}
    </div>
  );
};

// Re-export for backward compatibility
export const Loading = LoadingState;
