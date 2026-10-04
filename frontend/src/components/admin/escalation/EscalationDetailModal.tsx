import React, { useState } from 'react';
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
  Shield,
  Bot,
  UserCheck,
} from 'lucide-react';
import type { EscalationDetailItem } from '@/types/adminEscalation';
import { EscalationStatusBadge } from './EscalationStatusBadge';
import { EscalationPriorityBadge } from './EscalationPriorityBadge';

interface EscalationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: EscalationDetailItem | null;
  onTransitionStatus?: (targetStatus: 'in_progress' | 'resolved') => void;
}

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  isOpen,
  onClose,
  escalation,
  onTransitionStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'case_info' | 'conversation'>('case_info');

  if (!isOpen || !escalation) return null;

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

              {/* Audit & Handling Information */}
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Administrative Audit & Resolution</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-text-muted block text-[11px]">Created At</span>
                    <span className="text-text-secondary">{formatDate(escalation.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Started Handling</span>
                    <span className="text-text-secondary">{formatDate(escalation.started_at)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Resolved At</span>
                    <span className="text-text-secondary">{formatDate(escalation.resolved_at)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Assigned Counsellor</span>
                    <span className="text-text-secondary">{escalation.assigned_counsellor || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Resolved By</span>
                    <span className="text-text-secondary">{escalation.resolved_by || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Last Updated</span>
                    <span className="text-text-secondary">{formatDate(escalation.updated_at)}</span>
                  </div>
                </div>

                {escalation.resolution_notes && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] font-medium text-text-muted block">Resolution Notes</span>
                    <p className="text-xs text-text-secondary mt-1 bg-surface-elevated/50 p-2.5 rounded-lg border border-border/60">
                      {escalation.resolution_notes}
                    </p>
                  </div>
                )}
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
