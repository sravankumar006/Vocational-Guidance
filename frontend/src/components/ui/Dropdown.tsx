import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-52 bg-background-elevated border border-border-strong rounded-xl shadow-glass py-1.5 z-40 animate-in fade-in duration-100`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                item.danger
                  ? 'text-rose-400 hover:bg-rose-950/40'
                  : 'text-text-primary hover:bg-background-surface'
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
