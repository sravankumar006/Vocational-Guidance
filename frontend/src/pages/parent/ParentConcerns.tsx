import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  UserX,
  HelpCircle,
  X,
  Send,
  Mic,
  MicOff,
} from 'lucide-react';
import { parentService } from '@/services/parentService';
import type { ParentChildContext, ParentConcernCardDef } from '@/types/parent';
import { useLanguage } from '@/context/LanguageContext';
import { ParentConcernHeader } from '@/components/parent/ParentConcernHeader';
import { ParentConcernGrid } from '@/components/parent/ParentConcernGrid';
import { ParentVoicePrompt } from '@/components/parent/ParentVoicePrompt';

/**
 * Parent Concerns Experience (Phase 5 Brick 28).
 *
 * Dedicated to illiterate and low-literacy parents:
 * - Simple icon + brief words + voice/audio interaction.
 * - 8 exact canonical concern categories.
 * - Saves selected concern via authorized API and routes directly into contextual AI counselling.
 */
export const ParentConcerns: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [context, setContext] = useState<ParentChildContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Other Modal State
  const [isOtherModalOpen, setIsOtherModalOpen] = useState<boolean>(false);
  const [otherText, setOtherText] = useState<string>('');
  const [isOtherListening, setIsOtherListening] = useState<boolean>(false);

  useEffect(() => {
    loadChildContext();
  }, []);

  const loadChildContext = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await parentService.getChildContext();
      setContext(data);
    } catch (err: any) {
      setErrorMessage(
        t('parentErrorTitle') || "We couldn't load this page. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConcern = async (card: ParentConcernCardDef) => {
    if (card.category === 'Other') {
      setIsOtherModalOpen(true);
      return;
    }

    setIsSaving(true);
    const localizedQuestion = t(card.questionKey);
    const localizedTitle = t(card.titleKey);

    try {
      // 1. Authoritatively record the parent's concern
      await parentService.saveConcern({
        concern_type: card.category,
        description: localizedQuestion,
        severity: 'medium',
      });
    } catch (err) {
      console.warn('Could not save concern record prior to counselling, proceeding', err);
    } finally {
      setIsSaving(false);
      // 2. Seamlessly route into contextual counselling
      navigate('/parent/counselling', {
        state: {
          initialQuestion: localizedQuestion,
          explainContext: {
            entity_type: 'concern',
            entity_id: card.category,
            entity_title: localizedTitle,
            intent: card.intent,
          },
        },
      });
    }
  };

  const handleVoiceSubmit = async (spokenText: string) => {
    setIsSaving(true);
    try {
      await parentService.saveConcern({
        concern_type: 'Other',
        description: spokenText,
        severity: 'medium',
      });
    } catch (err) {
      console.warn('Could not save voice concern record', err);
    } finally {
      setIsSaving(false);
      navigate('/parent/counselling', {
        state: {
          initialQuestion: spokenText,
          explainContext: {
            entity_type: 'concern',
            entity_id: 'Other',
            entity_title: t('concernOtherTitle'),
            intent: 'concern_other',
          },
        },
      });
    }
  };

  const handleSubmitOther = async () => {
    if (!otherText.trim()) return;

    const query = otherText.trim();
    setIsSaving(true);
    try {
      await parentService.saveConcern({
        concern_type: 'Other',
        description: query,
        severity: 'medium',
      });
    } catch (err) {
      console.warn('Could not save other concern record', err);
    } finally {
      setIsSaving(false);
      setIsOtherModalOpen(false);
      navigate('/parent/counselling', {
        state: {
          initialQuestion: query,
          explainContext: {
            entity_type: 'concern',
            entity_id: 'Other',
            entity_title: t('concernOtherTitle'),
            intent: 'concern_other',
          },
        },
      });
    }
  };

  const handleTalkToPerson = () => {
    const escalationPrompt =
      language === 'te'
        ? 'నా బిడ్డ వృత్తి విద్యా భవిష్యత్తు గురించి మాట్లాడటానికి దయచేసి నన్ను మానవ కౌన్సెలర్‌తో అనుసంధానించండి.'
        : 'I would like to speak directly with a human vocational guidance counselor regarding my child’s career path.';

    navigate('/parent/counselling', {
      state: {
        initialQuestion: escalationPrompt,
        explainContext: {
          entity_type: 'escalation',
          entity_id: 'human_counsellor',
          entity_title: t('talkToPerson'),
          intent: 'request_human_counsellor',
        },
      },
    });
  };

  const toggleOtherSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback text simulation for browser compatibility
      setOtherText(
        language === 'te'
          ? 'నా బిడ్డ హాస్టల్ లేదా రవాణా భద్రత గురించి తెలుసుకోవాలనుకుంటున్నాను.'
          : 'I want to know about hostel availability and safety for my child.'
      );
      return;
    }

    if (isOtherListening) {
      setIsOtherListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsOtherListening(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setOtherText(text);
      };
      recognition.onerror = () => setIsOtherListening(false);
      recognition.onend = () => setIsOtherListening(false);

      recognition.start();
    } catch (e) {
      setIsOtherListening(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-4 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">
          {t('parentLoadingChild')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
          {t('parentLoadingSubtext')}
        </p>
      </div>
    );
  }

  // 2. Error State
  if (errorMessage && !context) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{errorMessage}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-5">
          {t('parentErrorSubtext')}
        </p>
        <button
          type="button"
          onClick={loadChildContext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('tryAgain')}</span>
        </button>
      </div>
    );
  }

  // 3. Neutral Empty State (No Linked Student)
  if (!context?.has_linked_student) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 mb-4 shadow-2xs">
          <UserX className="w-8 h-8" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {t('parentNoStudentLinkedTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 mb-6 leading-relaxed">
          {t('parentNoStudentLinkedDesc')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/parent')}
          className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
        >
          {t('backToDashboard')}
        </button>
      </div>
    );
  }

  // 4. Main Low-Literacy Friendly Concerns View
  return (
    <div className="min-h-full py-4 sm:py-8 px-4 sm:px-6">
      {/* Header with Back, Child Badge, and Human Escalation */}
      <ParentConcernHeader
        context={context}
        onBack={() => navigate('/parent')}
        onTalkToPerson={handleTalkToPerson}
      />

      {/* Voice Prompt Interaction Affordance */}
      <ParentVoicePrompt
        onVoiceSubmit={handleVoiceSubmit}
        disabled={isSaving}
      />

      {/* 8 Canonical Concern Cards Grid */}
      <ParentConcernGrid
        onSelectConcern={handleSelectConcern}
        isLoading={isSaving}
      />

      {/* "Other" Custom Question Dialog Modal */}
      {isOtherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsOtherModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t('otherConcernModalTitle')}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium mb-4">
              {t('otherConcernModalSubtitle')}
            </p>

            <div className="relative mb-4">
              <textarea
                rows={3}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={t('typeOrSpeakPlaceholder')}
                className="w-full p-3.5 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              />
              <button
                type="button"
                onClick={toggleOtherSpeech}
                title="Tap to speak"
                className={`absolute bottom-3 right-3 p-2 rounded-lg border transition-colors ${
                  isOtherListening
                    ? 'bg-rose-500 text-white animate-pulse border-rose-600'
                    : 'bg-white text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {isOtherListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsOtherModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitOther}
                disabled={!otherText.trim() || isSaving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>{t('continueToCounsellor')}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentConcerns;
