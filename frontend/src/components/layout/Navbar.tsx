import React from 'react';
import { cn } from '@/utils';

export interface NavbarProps {
  title?: string;
  subtitle?: string;
  brand?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  brand,
  actions,
  className,
}) => {
  return (
    <nav className={cn('bg-white border-b border-slate-200 sticky top-0 z-30', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {brand}
          {(title || subtitle) && (
            <div>
              {title && <div className="font-semibold text-slate-800 text-sm">{title}</div>}
              {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </nav>
  );
};
