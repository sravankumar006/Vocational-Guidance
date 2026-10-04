import React, { useState } from 'react';
import { CheckCircle2, Clock, X, Loader2 } from 'lucide-react';
import type { EscalationListItem } from '@/types/adminEscalation';

interface EscalationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: EscalationListItem | null;
  targetStatus: 'in_progress' | 'resolved';
  onConfirm: (notes?: string) => Promise<void>;
}

export const EscalationConfirmationModal: React.FC<EscalationConfirmationModalProps> = ({
  isOpen,
  onClose,
  escalation,
  targetStatus,
  onConfirm,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !escalation) return null;

  const isResolving = targetStatus === 'resolved';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(isResolving ? resolutionNotes.trim() : undefined);
      setResolutionNotes('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update escalation status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-2">
            {isResolving ? (
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {isResolving ? 'Mark Escalation as Resolved?' : 'Mark Escalation as In Progress?'}
              </h3>
              <p className="text-xs text-text-muted">Case #{escalation.id} • {escalation.student_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              {error}
            </div>
          )}

          <div className="text-sm text-text-secondary leading-relaxed">
            {isResolving ? (
              <>
                Confirm that this case has been adequately handled by a human counsellor.
                The case will be marked as <strong className="text-emerald-400">Resolved</strong> with your administrative audit timestamp.
              </>
            ) : (
              <>
                This indicates that a human counsellor has started actively reviewing and handling the case.
                The case will transition from <strong className="text-amber-400">Pending</strong> to <strong className="text-blue-400">In Progress</strong>.
              </>
            )}
          </div>

          <div className="bg-surface-elevated/60 border border-border/80 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Student:</span>
              <span className="font-medium text-text-primary">{escalation.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Career:</span>
              <span className="font-medium text-text-primary">{escalation.career_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Primary Concern:</span>
              <span className="font-medium text-accent">{escalation.concern}</span>
            </div>
          </div>

          {isResolving && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Resolution Notes (Optional)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Briefly document the guidance provided or outcome reached..."
                rows={3}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-surface-elevated/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors border border-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors ${
              isResolving
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isResolving ? (
              <span>Resolve</span>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
