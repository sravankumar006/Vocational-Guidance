import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavigationItem } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export interface SidebarProps {
  title?: string;
  items: NavigationItem[];
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  title,
  items,
  footer,
  className = '',
}) => {
  const { language } = useLanguage();

  return (
    <aside
      className={`w-60 shrink-0 border-r border-border/40 flex flex-col h-[calc(100vh-4rem)] sticky top-16 ${className}`}
    >
      {title && (
        <div className="px-4 py-3.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            {title}
          </span>
        </div>
      )}

      <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const displayLabel = language === 'te' && item.labelTe ? item.labelTe : item.label;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/student' || item.href === '/parent' || item.href === '/admin'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/[0.07] text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" />}
                <span>{displayLabel}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-text-secondary">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {footer && (
        <div className="p-3.5 border-t border-border/30 text-xs text-text-secondary">
          {footer}
        </div>
      )}
    </aside>
  );
};
