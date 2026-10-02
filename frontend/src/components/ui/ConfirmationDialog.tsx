import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${isDestructive ? 'bg-rose-950/60 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
