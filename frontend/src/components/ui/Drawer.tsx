import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${positionStyles[position]} w-full max-w-md bg-background-card border-${position === 'left' ? 'r' : 'l'} border-border-strong shadow-glass z-10 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary">{title || 'Navigation'}</h3>
          <IconButton
            icon={<X className="h-5 w-5" />}
            ariaLabel="Close drawer"
            onClick={onClose}
            variant="ghost"
            size="sm"
          />
        </div>
        <div className="p-4 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
