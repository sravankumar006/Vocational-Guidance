import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavigationItem } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export interface MobileNavigationProps {
  items: NavigationItem[];
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  className = '',
}) => {
  const { language } = useLanguage();

  // Pick top 4 items for bottom bar
  const bottomItems = items.slice(0, 4);

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 bg-background-card/95 backdrop-blur border-t border-border md:hidden ${className}`}
    >
      <div className="grid grid-cols-4 h-16">
        {bottomItems.map((item) => {
          const displayLabel = language === 'te' && item.labelTe ? item.labelTe : item.label;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/student' || item.href === '/parent' || item.href === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-brand-300 font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="truncate max-w-[70px]">{displayLabel}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
