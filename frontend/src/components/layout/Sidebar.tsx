import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';
import type { NavigationItem } from '@/types';

export interface SidebarProps {
  items: NavigationItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  header,
  footer,
  className,
}) => {
  return (
    <aside
      className={cn(
        'w-64 border-r border-slate-200 bg-white flex flex-col justify-between min-h-[calc(100vh-4rem)]',
        className
      )}
    >
      <div className="p-4 space-y-4">
        {header && <div className="pb-3 border-b border-slate-100">{header}</div>}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center space-x-2.5">
                  {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {footer && <div className="p-4 border-t border-slate-100">{footer}</div>}
    </aside>
  );
};
