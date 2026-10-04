import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, UserX, MessageSquare, HelpCircle } from 'lucide-react';
import { parentService } from '@/services/parentService';
import type { ParentChildContext, ParentQuestionAction } from '@/types/parent';
import type { CounsellingContext } from '@/types/counselling';
import { ChildSummary } from '@/components/parent/ChildSummary';
import { ParentQuestionGrid } from '@/components/parent/ParentQuestionGrid';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Parent Dashboard (Phase 5 Brick 27).
 *
 * Provides a warm, simple, and understandable entry point for parents
 * into their child's vocational career journey.
 * Strictly focuses on child context and 6 clear conversational guidance topics.
 */
export const ParentHome: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [context, setContext] = useState<ParentChildContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadChildContext = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await parentService.getChildContext();
      setContext(data);
    } catch (err: any) {
      setErrorMessage(t('parentErrorTitle'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChildContext();
  }, []);

  const handleSelectAction = (action: ParentQuestionAction) => {
    // 1. "Talk to AI" opens the parent counselling workspace directly
    if (action.id === 'talk_to_ai' || !action.question) {
      navigate('/parent/counselling');
      return;
    }

    // 2. Question actions navigate into parent counselling with the question & child career context
    let explainCtx: CounsellingContext | undefined = undefined;
    if (context?.career) {
      explainCtx = {
        entity_type: 'career',
        entity_id: context.career.id,
        entity_title: context.career.title,
        intent: (action.intent as any) || 'explain_career',
      };
    }

    navigate('/parent/counselling', {
      state: {
        initialQuestion: action.question,
        explainContext: explainCtx,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-4 space-y-6 md:space-y-8">
      {/* 1. Loading State */}
      {isLoading && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 md:p-14 text-center space-y-4 shadow-2xs">
          <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-700 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              {t('parentLoadingChild')}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {t('parentLoadingSubtext')}
            </p>
          </div>
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="bg-white border border-rose-200/90 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              {errorMessage}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              {t('parentErrorSubtext')}
            </p>
          </div>
          <button
            type="button"
            onClick={loadChildContext}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('tryAgain')}</span>
          </button>
        </div>
      )}

      {/* 3. Empty State: No linked student */}
      {!isLoading && !errorMessage && context && !context.has_linked_student && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 md:p-12 text-center space-y-5 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t('parentNoStudentLinkedTitle')}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-normal leading-relaxed">
              {t('parentNoStudentLinkedDesc')}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/parent/counselling')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span>{t('cardTalkToAiTitle')}</span>
            </button>
          </div>
        </div>
      )}


      {/* 4. Active Dashboard: Linked Student Context & Question Cards */}
      {!isLoading && !errorMessage && context && context.has_linked_student && (
        <>
          {/* Child Overview Banner */}
          <ChildSummary
            childName={context.child_name}
            careerTitle={context.career_status_text}
            hasCareer={Boolean(context.career)}
            relationshipType={context.relationship_type}
            educationLevel={context.education_level}
            location={context.location}
          />

          {/* Six Core Question Action Cards */}
          <ParentQuestionGrid onSelectAction={handleSelectAction} />

          {/* Quick Access to Dedicated Parent Concerns (Brick 28) */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/70 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-amber-950">
                  {t('whatAreYouWorriedAbout')}
                </h4>
                <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                  {t('concernsSubtext')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/parent/concerns')}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
            >
              {language === 'te' ? 'సందేహాలను తెలపండి' : 'Share Concerns'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentHome;
