import React, { useState } from 'react';
import { UserCheck, CheckCircle2, Clock, AlertCircle, X, Phone, PhoneCall, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { counsellingService } from '@/services/counselling';
import type { EscalationResponse } from '@/types/counselling';

export const COUNSELLOR_PHONE = '7842547928';
export const EMERGENCY_SMS_TEXT = 'emergency this parent/student have concerns about this';

interface HumanEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: number | null;
  careerId?: number | null;
  careerTitle?: string;
  initialConcern?: string;
  activeEscalation?: EscalationResponse | null;
  onEscalationSuccess?: (escalation: EscalationResponse) => void;
}

const CANONICAL_CONCERNS = [
  { id: 'Income', en: 'Income', te: 'ఆదాయం & జీతం' },
  { id: 'Job Security', en: 'Job Security', te: 'ఉద్యోగ భద్రత' },
  { id: 'Further Education', en: 'Further Education', te: 'ఉన్నత విద్య' },
  { id: 'Social Perception', en: 'Social Perception', te: 'సామాజిక గౌరవం' },
  { id: 'Distance', en: 'Distance', te: 'దూరం / ప్రయాణం' },
  { id: 'Working Conditions', en: 'Working Conditions', te: 'పని వాతావరణం' },
  { id: 'Career Growth', en: 'Career Growth', te: 'కెరీర్ ఎదుగుదల' },
  { id: 'Other', en: 'Other', te: 'ఇతర సందేహాలు' },
];

export const HumanEscalationModal: React.FC<HumanEscalationModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  careerId,
  careerTitle,
  initialConcern,
  activeEscalation,
  onEscalationSuccess,
}) => {
  const { t, language } = useLanguage();
  const [selectedConcern, setSelectedConcern] = useState<string>(initialConcern || 'Income');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newEscalation, setNewEscalation] = useState<EscalationResponse | null>(null);

  if (!isOpen) return null;

  const currentCase = newEscalation || activeEscalation;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await counsellingService.createEscalation({
        session_id: sessionId || null,
        career_id: careerId || null,
        concern: selectedConcern,
        language: language === 'te' ? 'te' : 'en',
        notes: notes.trim() || undefined,
      });

      setNewEscalation(response);
      if (onEscalationSuccess) {
        onEscalationSuccess(response);
      }

      // Immediately place telephone call to the human counsellor (7842547928)
      try {
        window.location.href = `tel:${COUNSELLOR_PHONE}`;
      } catch (err) {
        console.warn('Direct telephone call trigger:', err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to submit escalation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {t('escalationStatusInProgress')}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('escalationStatusResolved')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {t('escalationStatusPending')}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="escalation-modal-title"
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 id="escalation-modal-title" className="text-lg font-bold">
                {t('escalationModalTitle')}
              </h3>
              {careerTitle && (
                <p className="text-xs text-emerald-100 font-medium">
                  {careerTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active / Submitted Confirmation State */}
          {currentCase && (currentCase.status === 'pending' || currentCase.status === 'in_progress') ? (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  {t('escalationSentSuccess')}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {t('escalationSentSubtext')}
                </p>
              </div>

              {/* Emergency Call & SMS Dispatch Hotline */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <PhoneCall className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Emergency Counsellor Contact: {COUNSELLOR_PHONE}</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                    IMMEDIATE DISPATCH
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Emergency message alert: <span className="font-semibold italic">"{EMERGENCY_SMS_TEXT}"</span>
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${COUNSELLOR_PHONE}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {COUNSELLOR_PHONE}</span>
                  </a>
                  <a
                    href={`sms:${COUNSELLOR_PHONE}?body=${encodeURIComponent(EMERGENCY_SMS_TEXT)}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send SMS Now</span>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Status</span>
                  {getStatusBadge(currentCase.status)}
                </div>
                {currentCase.career_title && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Career Pathway</span>
                    <span className="font-semibold text-slate-800">{currentCase.career_title}</span>
                  </div>
                )}
                {currentCase.concern && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Primary Concern</span>
                    <span className="font-semibold text-slate-800">{currentCase.concern}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Close Confirmation
                </button>
              </div>
            </div>
          ) : (
            /* Creation Request Form */
            <div className="space-y-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('escalationModalDesc')}
              </p>

              {/* Concern Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  {t('escalationConcernLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CANONICAL_CONCERNS.map((item) => {
                    const isSelected = selectedConcern === item.id;
                    const label = language === 'te' ? item.te : item.en;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedConcern(item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('escalationNotesPlaceholder')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('escalationCancelAction')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('escalationSending')}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>{t('escalationConfirmAction')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
