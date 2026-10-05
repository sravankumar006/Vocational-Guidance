import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  FlaskConical,
  Bot,
  UserCheck,
  Sparkles,
  Loader2,
  History,
} from 'lucide-react';
import type { EscalationDetailItem, CounsellorOption } from '@/types/adminEscalation';
import { adminEscalationService } from '@/services/adminEscalationService';
import { EscalationStatusBadge } from './EscalationStatusBadge';
import { EscalationPriorityBadge } from './EscalationPriorityBadge';
import { Button } from '@/components/ui/Button';

interface EscalationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: EscalationDetailItem | null;
  onTransitionStatus?: (targetStatus: 'in_progress' | 'resolved') => void;
  onEscalationUpdated?: (updated: EscalationDetailItem) => void;
}

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  isOpen,
  onClose,
  escalation: initialEscalation,
  onTransitionStatus,
  onEscalationUpdated,
}) => {
  const [escalation, setEscalation] = useState<EscalationDetailItem | null>(initialEscalation);
  const [activeTab, setActiveTab] = useState<'case_info' | 'conversation'>('case_info');

  // Staff Assignment State
  const [counsellors, setCounsellors] = useState<CounsellorOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | 'unassigned'>(
    initialEscalation?.assigned_to_user_id || 'unassigned'
  );
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);

  // Priority Update State
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);

  // Synchronize initial escalation prop
  useEffect(() => {
    setEscalation(initialEscalation);
    setSelectedStaffId(initialEscalation?.assigned_to_user_id || 'unassigned');
  }, [initialEscalation]);

  // Load available counsellors when modal opens
  useEffect(() => {
    if (isOpen) {
      adminEscalationService.getCounsellors()
        .then(setCounsellors)
        .catch((err) => console.warn('[EscalationDetailModal] Could not fetch counsellors:', err));
    }
  }, [isOpen]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Handle Counsellor Assignment / Reassignment / Unassignment
  const handleAssignCounsellor = async () => {
    if (!escalation) return;
    setIsAssigning(true);
    setAssignmentFeedback(null);
    try {
      const targetUserId = selectedStaffId === 'unassigned' ? null : Number(selectedStaffId);
      const updated = await adminEscalationService.assignCounsellor(escalation.id, targetUserId);
      setEscalation(updated);
      setSelectedStaffId(updated.assigned_to_user_id || 'unassigned');
      setAssignmentFeedback(
        targetUserId ? `Assigned to ${updated.assigned_counsellor}.` : 'Case unassigned.'
      );
      if (onEscalationUpdated) onEscalationUpdated(updated);
    } catch (err: any) {
      console.error('[EscalationDetailModal] Assignment failed:', err);
      setAssignmentFeedback(err?.message || 'Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Escalation Priority Change (Normal, High, Urgent)
  const handleUpdatePriority = async (newPriority: string) => {
    if (!escalation) return;
    setIsUpdatingPriority(true);
    try {
      const updated = await adminEscalationService.updatePriority(escalation.id, newPriority);
      setEscalation(updated);
      if (onEscalationUpdated) onEscalationUpdated(updated);
    } catch (err: any) {
      console.error('[EscalationDetailModal] Priority update failed:', err);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  if (!isOpen || !escalation) return null;

  const normStatus = (escalation.status || 'pending').toLowerCase().replace('-', '_').replace(' ', '_');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border bg-surface-elevated/40">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                Case #{escalation.id}
              </span>
              <EscalationStatusBadge status={escalation.status} size="sm" />
              <EscalationPriorityBadge priority={escalation.priority} size="sm" />
              {escalation.is_demo && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                  <FlaskConical className="h-3 w-3" />
                  <span>DEMO DATA</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {escalation.career_title} • {escalation.concern}
            </h2>
            <p className="text-xs text-text-muted">
              Initiated {formatDate(escalation.created_at)}
              {escalation.counselling_session_id && ` • Counselling Session #${escalation.counselling_session_id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-surface px-4 sm:px-5">
          <button
            onClick={() => setActiveTab('case_info')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'case_info'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Case Assessment & Parties</span>
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'conversation'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Conversation Context ({escalation.conversation_messages.length})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-text-primary">
          {activeTab === 'case_info' ? (
            <>
              {/* Summary Banner */}
              <div className="bg-surface-elevated/70 border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-accent" />
                  <span>Conversation Summary</span>
                </div>
                <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                  {escalation.conversation_summary ||
                    escalation.reason ||
                    'Student/Parent required intervention regarding technical vocational qualification.'}
                </p>
                {escalation.reason && escalation.conversation_summary && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] font-medium text-text-muted">Trigger Reason: </span>
                    <span className="text-xs text-text-secondary">{escalation.reason}</span>
                  </div>
                )}
              </div>

              {/* Grid: Parties & Career */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student & Parent Info */}
                <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <Users className="h-4 w-4 text-accent" />
                    <span>Beneficiary Context</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Student Name</span>
                      <span className="font-semibold text-text-primary text-sm">{escalation.student_name}</span>
                    </div>
                    {escalation.student_education && (
                      <div>
                        <span className="text-text-muted block text-[11px]">Education Level</span>
                        <span className="text-text-secondary">{escalation.student_education}</span>
                      </div>
                    )}
                    {escalation.student_location && (
                      <div>
                        <span className="text-text-muted block text-[11px]">Location</span>
                        <span className="text-text-secondary">{escalation.student_location}</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-border/50">
                      <span className="text-text-muted block text-[11px]">Parent / Guardian</span>
                      <span className="text-text-secondary font-medium">
                        {escalation.parent_name || 'Parent Account (Linked)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Career & Guidance Focus */}
                <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <Briefcase className="h-4 w-4 text-accent" />
                    <span>Career & Concern</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Target Vocational Career</span>
                      <span className="font-semibold text-text-primary text-sm">{escalation.career_title}</span>
                    </div>
                    {escalation.career_sector && (
                      <div>
                        <span className="text-text-muted block text-[11px]">Industry Sector</span>
                        <span className="text-text-secondary">{escalation.career_sector}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-text-muted block text-[11px]">Identified Concern</span>
                      <span className="inline-block px-2 py-0.5 rounded font-medium bg-accent/10 text-accent border border-accent/20">
                        {escalation.concern}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[11px]">Interaction Language</span>
                      <span className="text-text-secondary capitalize">
                        {escalation.language === 'te'
                          ? 'Telugu (te)'
                          : escalation.language === 'hi'
                          ? 'Hindi (hi)'
                          : escalation.language === 'en'
                          ? 'English (en)'
                          : escalation.language}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counsellor Assignment & Priority Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Counsellor Assignment Workflow */}
                <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-accent" />
                      Assigned Counsellor
                    </span>
                    {assignmentFeedback && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {assignmentFeedback}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStaffId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedStaffId(val === 'unassigned' ? 'unassigned' : Number(val));
                        setAssignmentFeedback(null);
                      }}
                      disabled={isAssigning}
                      className="flex-1 rounded-lg border border-border bg-surface-elevated/70 px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="unassigned">-- Unassigned --</option>
                      {counsellors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      onClick={handleAssignCounsellor}
                      disabled={isAssigning}
                      className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-medium h-8 text-xs shrink-0"
                    >
                      {isAssigning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : selectedStaffId === 'unassigned' ? (
                        'Unassign'
                      ) : escalation.assigned_to_user_id ? (
                        'Reassign'
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Current:{' '}
                    <strong className="text-text-primary">
                      {escalation.assigned_counsellor || 'Unassigned'}
                    </strong>
                  </p>
                </div>

                {/* Priority Selection (Normal / High / Urgent) */}
                <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Escalation Priority
                    </span>
                    {isUpdatingPriority && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { key: 'normal', label: 'Normal', color: 'text-text-secondary border-border hover:border-text-secondary' },
                      { key: 'high', label: 'High', color: 'text-amber-400 border-amber-500/40 hover:bg-amber-500/10' },
                      { key: 'urgent', label: 'Urgent', color: 'text-rose-400 border-rose-500/40 hover:bg-rose-500/10' },
                    ].map((p) => {
                      const curPri = (escalation.priority || 'medium').toLowerCase();
                      const isActive =
                        (p.key === 'normal' && (curPri === 'normal' || curPri === 'medium' || curPri === 'low')) ||
                        curPri === p.key;

                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handleUpdatePriority(p.key)}
                          disabled={isUpdatingPriority}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                            isActive
                              ? p.key === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                                : p.key === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                : 'bg-surface-elevated text-text-primary border-brand-500'
                              : `bg-surface-elevated/40 text-text-muted border-border/80 ${p.color}`
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Manual triage priority benchmarked for counsellors.
                  </p>
                </div>
              </div>

              {/* Resolution Audit Trail (Created -> Assigned -> Status Changed -> Resolved) */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <History className="h-4 w-4 text-accent" />
                  <span>Resolution Audit Trail & Chronology</span>
                </div>

                <div className="space-y-3 text-xs pl-2 border-l-2 border-border/70 ml-2">
                  {/* Step 1: Created */}
                  <div className="relative pl-4 space-y-0.5">
                    <span className="absolute -left-[19px] top-1 h-3 w-3 rounded-full bg-brand-500 border-2 border-surface" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">Created</span>
                      <span className="text-[11px] font-mono text-text-muted">{formatDate(escalation.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Case flagged from {escalation.counselling_session_id ? `Counselling Session #${escalation.counselling_session_id}` : 'beneficiary resistance'}.
                    </p>
                  </div>

                  {/* Step 2: Assigned */}
                  <div className="relative pl-4 space-y-0.5">
                    <span className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-surface ${
                      escalation.assigned_counsellor ? 'bg-blue-500' : 'bg-surface-elevated border-text-muted'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">Assigned</span>
                      <span className="text-[11px] font-mono text-text-muted">
                        {escalation.assigned_counsellor ? formatDate(escalation.started_at || escalation.updated_at) : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      {escalation.assigned_counsellor
                        ? `Assigned to ${escalation.assigned_counsellor}`
                        : 'Unassigned (available for triage assignment)'}
                    </p>
                  </div>

                  {/* Step 3: Status Changed */}
                  <div className="relative pl-4 space-y-0.5">
                    <span className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-surface ${
                      normStatus !== 'pending' ? 'bg-amber-500' : 'bg-surface-elevated border-text-muted'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">Status Changed</span>
                      <span className="text-[11px] font-mono text-text-muted">
                        {escalation.started_at ? formatDate(escalation.started_at) : formatDate(escalation.updated_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Current lifecycle state: <strong className="capitalize text-text-primary">{escalation.status}</strong>
                    </p>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className="relative pl-4 space-y-0.5">
                    <span className={`absolute -left-[19px] top-1 h-3 w-3 rounded-full border-2 border-surface ${
                      normStatus === 'resolved' ? 'bg-emerald-500' : 'bg-surface-elevated border-text-muted'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">Resolved</span>
                      <span className="text-[11px] font-mono text-text-muted">
                        {escalation.resolved_at ? formatDate(escalation.resolved_at) : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      {normStatus === 'resolved'
                        ? `Resolved by ${escalation.resolved_by || 'Admin'}`
                        : 'Awaiting counselling completion.'}
                    </p>
                    {escalation.resolution_notes && (
                      <div className="mt-1.5 p-2 rounded-lg bg-surface-elevated/70 border border-border text-xs text-text-primary">
                        <span className="font-medium text-text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                          Resolution Note
                        </span>
                        {escalation.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Conversation Context Tab */
            <div className="space-y-3">
              <div className="p-3 bg-surface-elevated/50 border border-border rounded-lg text-xs text-text-secondary flex items-start gap-2">
                <Bot className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text-primary">Relevant Counselling Conversation: </strong>
                  Displays verified dialogue from Session #{escalation.counselling_session_id || 'N/A'}. Only interactions belonging to this specific session are shown.
                </div>
              </div>

              {escalation.conversation_messages.length === 0 ? (
                <div className="text-center py-10 bg-surface rounded-xl border border-dashed border-border space-y-2">
                  <MessageSquare className="h-8 w-8 text-text-muted mx-auto opacity-50" />
                  <p className="text-sm font-medium text-text-secondary">No dialogue recorded</p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    This case was initiated directly through manual escalation or the associated counselling session messages are not populated.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {escalation.conversation_messages.map((msg) => {
                    const isAi = msg.sender_type.toLowerCase() === 'ai';
                    const isCounsellor = msg.sender_type.toLowerCase() === 'counsellor';
                    const isUser = msg.sender_type.toLowerCase() === 'student' || msg.sender_type.toLowerCase() === 'parent';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAi ? 'items-start' : isUser ? 'items-end' : 'items-center'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-text-muted">
                          {isAi ? (
                            <>
                              <Bot className="h-3 w-3 text-accent" />
                              <span className="font-semibold text-accent">Margadarshak AI</span>
                            </>
                          ) : isCounsellor ? (
                            <>
                              <UserCheck className="h-3 w-3 text-emerald-400" />
                              <span className="font-semibold text-emerald-400">Human Counsellor</span>
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 text-text-secondary" />
                              <span className="font-medium capitalize">{msg.sender_type}</span>
                            </>
                          )}
                          <span>• {formatDate(msg.created_at)}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                            isAi
                              ? 'bg-surface-elevated border border-border text-text-primary'
                              : isCounsellor
                              ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-100'
                              : 'bg-accent/15 border border-accent/30 text-text-primary'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {(msg.confidence !== null && msg.confidence !== undefined || msg.requires_human) && (
                            <div className="mt-2 pt-2 border-t border-border/40 flex flex-wrap items-center gap-2 text-[10px]">
                              {msg.confidence !== null && msg.confidence !== undefined && (
                                <span className="text-text-muted">
                                  AI Confidence: <strong className="text-text-primary">{(msg.confidence * 100).toFixed(0)}%</strong>
                                </span>
                              )}
                              {msg.requires_human && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  <span>Triggered Human Flag</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface-elevated/30 flex items-center justify-between">
          <div className="text-xs text-text-muted">
            Status: <span className="font-semibold text-text-primary capitalize">{escalation.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {normStatus === 'pending' && onTransitionStatus && (
              <button
                type="button"
                onClick={() => onTransitionStatus('in_progress')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Mark In Progress</span>
              </button>
            )}

            {normStatus === 'in_progress' && onTransitionStatus && (
              <button
                type="button"
                onClick={() => onTransitionStatus('resolved')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Resolved</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors border border-border"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
