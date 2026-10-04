import React from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, AlertTriangle, RefreshCw, X } from 'lucide-react';

interface DataConfirmationModalProps {
  isOpen: boolean;
  actionType: 'verify' | 'deactivate' | 'reactivate' | null;
  recordName: string;
  sourceName?: string | null;
  isDemo?: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DataConfirmationModal: React.FC<DataConfirmationModalProps> = ({
  isOpen,
  actionType,
  recordName,
  sourceName,
  isDemo,
  isLoading,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !actionType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-4">
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {actionType === 'verify' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}
            {actionType === 'deactivate' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            {actionType === 'reactivate' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30">
                <RefreshCw className="h-5 w-5" />
              </div>
            )}

            <div>
              <h2 className="text-base font-semibold text-text-primary">
                {actionType === 'verify' && 'Verify this record?'}
                {actionType === 'deactivate' && 'Deactivate this record?'}
                {actionType === 'reactivate' && 'Reactivate this record?'}
              </h2>
              <p className="text-xs text-text-secondary line-clamp-1">{recordName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action description */}
        <div className="rounded-lg bg-surface p-3.5 text-xs text-text-secondary space-y-2 border border-border/50">
          {actionType === 'verify' && (
            <>
              <p>
                <strong className="text-text-primary">Verified records</strong> may be used as authoritative factual information by the counselling and RAG systems.
              </p>
              {sourceName ? (
                <p className="text-[11px] text-emerald-400/90">
                  Linked Source: <span className="font-medium text-text-primary">{sourceName}</span>
                </p>
              ) : (
                <p className="text-[11px] text-amber-400">
                  Note: A verified source reference is required before verification can succeed.
                </p>
              )}
              {isDemo && (
                <p className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Caution: This record is currently tagged as Demo/Generated. Ensure you have reviewed its real-world accuracy before approving.
                </p>
              )}
            </>
          )}

          {actionType === 'deactivate' && (
            <p>
              This record will be set to <strong className="text-rose-400">Inactive</strong>. It will no longer be used by normal search or RAG retrieval, but historical references will be preserved.
            </p>
          )}

          {actionType === 'reactivate' && (
            <p>
              This record will be restored to <strong className="text-brand-400">Unverified</strong> state and made eligible for administrative review.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="border-border/80 text-text-secondary"
          >
            Cancel
          </Button>

          {actionType === 'verify' && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirm Verification</span>
            </Button>
          )}

          {actionType === 'deactivate' && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white font-medium gap-1.5"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Deactivate Record</span>
            </Button>
          )}

          {actionType === 'reactivate' && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Reactivate Record</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
