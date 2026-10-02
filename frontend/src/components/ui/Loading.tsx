import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn('flex flex-col items-center justify-center p-6 space-y-3', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-slate-600', sizeClasses[size])} />
      {message && <p className="text-xs text-slate-500 font-medium">{message}</p>}
    </div>
  );
};
