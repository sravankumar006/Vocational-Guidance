import React from 'react';
import { ArrowLeft, UserCheck, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { ParentChildContext } from '@/types/parent';

interface ParentConcernHeaderProps {
  context: ParentChildContext | null;
  onBack: () => void;
  onTalkToPerson: () => void;
}

export const ParentConcernHeader: React.FC<ParentConcernHeaderProps> = ({
  context,
  onBack,
  onTalkToPerson,
}) => {
  const { t, localizeName, localizeCareerTitle } = useLanguage();

  const childName = context?.has_linked_student
    ? localizeName(context.child_name)
    : null;
  const rawCareer = context?.career?.title || context?.career_status_text;
  const careerTitle = rawCareer ? localizeCareerTitle(rawCareer) : null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      {/* Top Nav Row: Back Button + Human Escalation */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToDashboard')}</span>
        </button>

        {/* Human Counsellor Escalation Affordance (Brick 28 Section 13) */}
        <button
          type="button"
          onClick={onTalkToPerson}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-100 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer group"
          title={t('talkToPersonDesc')}
        >
          <UserCheck className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
          <span>{t('talkToPerson')}</span>
        </button>
      </div>

      {/* Child Context Pill */}
      {childName && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold mb-3">
          <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {t('yourChild')}: <strong className="text-blue-950">{childName}</strong>
            {careerTitle && ` • ${careerTitle}`}
          </span>
        </div>
      )}

      {/* Main Conversation-Style Headings */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('whatAreYouWorriedAbout')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-xl">
          {t('concernsSubtext')}
        </p>
      </div>
    </div>
  );
};
