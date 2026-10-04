import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import {
  AlertTriangle,
  User,
  Users,
  Briefcase,
  CheckCircle2,
  FileText,
  UserCheck,
  Phone,
  MessageSquare,
} from 'lucide-react';
import type { AdminEscalationItem } from '@/types/admin';
import { adminService } from '@/services/adminService';

interface EscalationDetailModalProps {
  escalation: AdminEscalationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  escalation,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  if (!escalation) return null;

  const [currentStatus, setCurrentStatus] = useState<'pending' | 'in_progress' | 'resolved'>(
    (escalation.status.toLowerCase() as any) || 'pending'
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await adminService.updateEscalation(escalation.id, currentStatus);
      setSuccessMessage(`Escalation status updated to ${currentStatus.replace('_', ' ')}.`);
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update escalation status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityStyles: Record<string, { label: string; status: 'error' | 'warning' | 'info' | 'neutral' }> = {
    urgent: { label: 'URGENT', status: 'error' },
    high: { label: 'HIGH', status: 'warning' },
    medium: { label: 'MEDIUM', status: 'info' },
    low: { label: 'LOW', status: 'neutral' },
  };

  const priorityDef = priorityStyles[escalation.priority?.toLowerCase() || 'medium'] || priorityStyles.medium;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Escalation Case #${escalation.id}`}
      description="Professional human counsellor intervention record flagged during vocational guidance session."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-text-muted">
            Created: {escalation.created_at}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isUpdating}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateStatus}
              isLoading={isUpdating}
            >
              Save Status
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        {errorMessage && (
          <Alert type="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert type="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Status & Priority Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-border/40">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[11px] text-text-muted">Priority</div>
              <div className="mt-0.5">
                <StatusBadge status={priorityDef.status} label={priorityDef.label} />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-text-muted">Current State</div>
              <div className="mt-0.5">
                <StatusBadge
                  status={
                    escalation.status.toLowerCase() === 'resolved'
                      ? 'success'
                      : escalation.status.toLowerCase() === 'in_progress'
                      ? 'warning'
                      : 'info'
                  }
                  label={escalation.status.replace('_', ' ').toUpperCase()}
                />
              </div>
            </div>
          </div>

          {/* Status Changer Control */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <div className="text-xs text-text-secondary whitespace-nowrap">Change:</div>
            <Select
              options={[
                { value: 'pending', label: 'Pending Review' },
                { value: 'in_progress', label: 'In Progress (Active)' },
                { value: 'resolved', label: 'Resolved (Closed)' },
              ]}
              value={currentStatus}
              onChange={(val) => setCurrentStatus(val as any)}
            />
          </div>
        </div>

        {/* Case Participants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-border/40 space-y-1">
            <div className="text-text-muted flex items-center gap-1.5 font-medium">
              <User className="h-3.5 w-3.5 text-accent" />
              <span>Student Profile</span>
            </div>
            <div className="text-sm font-semibold text-text-primary pt-1">
              {escalation.student_name || 'Anonymous Student'}
            </div>
            {escalation.student_id && (
              <div className="text-text-muted text-[11px]">System Student ID #{escalation.student_id}</div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-border/40 space-y-1">
            <div className="text-text-muted flex items-center gap-1.5 font-medium">
              <Users className="h-3.5 w-3.5 text-accent" />
              <span>Parent / Family Context</span>
            </div>
            <div className="text-sm font-semibold text-text-primary pt-1">
              {escalation.parent_name || 'Family Guardian'}
            </div>
            <div className="text-text-muted text-[11px]">Verified Family Unit</div>
          </div>
        </div>

        {/* Career & Reason Details */}
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.01] border border-border/40 text-xs">
          {escalation.career_title && (
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
              <div>
                <span className="text-text-muted font-medium">Target Occupation: </span>
                <span className="font-semibold text-text-primary">{escalation.career_title}</span>
              </div>
            </div>
          )}

          {escalation.concern && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-text-muted font-medium">Primary Concern Category: </span>
                <span className="font-semibold text-text-primary capitalize">{escalation.concern}</span>
              </div>
            </div>
          )}

          {escalation.reason && (
            <div className="pt-2 border-t border-border/30 space-y-1">
              <div className="text-text-muted font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-text-muted" />
                <span>Escalation Statement / User Note:</span>
              </div>
              <div className="p-3 rounded-lg bg-background-elevated border border-border/40 text-text-primary text-xs leading-relaxed">
                {escalation.reason}
              </div>
            </div>
          )}

          {escalation.conversation_summary && (
            <div className="pt-2 border-t border-border/30 space-y-1">
              <div className="text-text-muted font-medium">AI Guidance Conversation Summary:</div>
              <div className="p-3 rounded-lg bg-background-elevated border border-border/40 text-text-secondary text-xs leading-relaxed">
                {escalation.conversation_summary}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Counsellor Dispatch Hotline */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">Human Counsellor Hotline: 7842547928</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                ACTIVE HOTLINE
              </span>
            </div>
            <div className="text-[11px] text-text-muted">
              Auto-dispatch SMS: "emergency this parent/student have concerns about this"
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:7842547928"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call 7842547928</span>
            </a>
            <a
              href="sms:7842547928?body=emergency%20this%20parent%2Fstudent%20have%20concerns%20about%20this"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>SMS Alert</span>
            </a>
          </div>
        </div>

        {/* Counsellor Assignment */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-accent" />
            <div>
              <div className="text-text-muted text-[11px]">Assigned Counsellor</div>
              <div className="font-semibold text-text-primary mt-0.5">
                {escalation.assigned_counsellor || 'Unassigned (Available to Any Counsellor)'}
              </div>
            </div>
          </div>

          {escalation.resolved_at && (
            <div className="text-right">
              <div className="text-text-muted text-[11px]">Resolution Timestamp</div>
              <div className="font-medium text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{escalation.resolved_at}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
