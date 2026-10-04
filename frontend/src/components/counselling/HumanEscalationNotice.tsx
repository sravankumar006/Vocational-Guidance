import React from 'react';
import { UserCheck, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { EscalationResponse } from '@/types/counselling';

interface HumanEscalationNoticeProps {
  requiresHuman?: boolean;
  activeEscalation?: EscalationResponse | null;
  onEscalate?: () => void;
}

export const HumanEscalationNotice: React.FC<HumanEscalationNoticeProps> = ({
  requiresHuman = false,
  activeEscalation = null,
  onEscalate,
}) => {
  const { t, language } = useLanguage();

  // If there is an active escalation already in progress
  if (activeEscalation && (activeEscalation.status === 'pending' || activeEscalation.status === 'in_progress')) {
    const isPending = activeEscalation.status === 'pending';
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5 animate-pulse text-blue-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-blue-950">
                {t('escalationActiveBanner')}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${
                isPending 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-blue-100 text-blue-900 border-blue-300'
              }`}>
                {isPending ? t('escalationStatusPending') : t('escalationStatusInProgress')}
              </span>
            </div>
            <p className="text-xs text-blue-900/90 leading-relaxed max-w-xl">
              {language === 'te'
                ? 'మీ ప్రశ్నలు మరియు కెరీర్ నేపథ్యాన్ని కౌన్సెలర్ పరిశీలిస్తున్నారు. కొత్త అభ్యర్థనలను మళ్లీ పంపాల్సిన అవసరం లేదు.'
                : 'A vocational counsellor has been assigned your case context and will review your queries.'}
            </p>
          </div>
        </div>

        {onEscalate && (
          <button
            type="button"
            onClick={onEscalate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-800 font-semibold text-xs shrink-0 cursor-pointer shadow-2xs transition-colors self-end sm:self-auto"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'వివరాలు చూడండి' : 'View Case Status'}</span>
          </button>
        )}
      </div>
    );
  }

  // If requires human review
  if (requiresHuman) {
    return (
      <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
            <UserCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>{t('escalationPromptTitle')}</span>
            </h4>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-xl">
              {t('escalationPromptSubtitle')}
            </p>
          </div>
        </div>

        {onEscalate && (
          <button
            type="button"
            onClick={onEscalate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-all hover:shadow-md self-end sm:self-auto"
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('talkToHumanCounsellor')}</span>
          </button>
        )}
      </div>
    );
  }

  return null;
};
