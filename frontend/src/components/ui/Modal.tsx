import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
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

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizes[size]} bg-background-card border border-border-strong rounded-xl shadow-glass overflow-hidden z-10`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-text-secondary mt-0.5">{description}</p>
              )}
            </div>
            <IconButton
              icon={<X className="h-5 w-5" />}
              ariaLabel="Close modal"
              onClick={onClose}
              variant="ghost"
              size="sm"
            />
          </div>
        )}

        <div className="p-5 overflow-y-auto max-h-[75vh] text-text-primary">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 bg-background-surface border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
