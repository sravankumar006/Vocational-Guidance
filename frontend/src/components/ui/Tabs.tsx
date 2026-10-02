import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-border/40 flex items-center gap-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon && <span className="h-4 w-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/[0.1] text-text-primary font-semibold'
                    : 'bg-white/[0.04] text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
