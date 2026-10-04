import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Menu,
  ShieldCheck,
  Users,
  Compass,
  UserCheck,
} from 'lucide-react';
import { VoiceCounsellingWidget } from '@/components/counselling/VoiceCounsellingWidget';
import { counsellingService } from '@/services/counselling';
import type {
  CounsellingResponse,
  CounsellingSessionSummary,
  CounsellingSessionDetail,
  CounsellingMessageItem,
  CounsellingContext,
} from '@/types/counselling';

import { ChatHistory } from '@/components/counselling/ChatHistory';
import { ChatMessage } from '@/components/counselling/ChatMessage';
import { MessageComposer } from '@/components/counselling/MessageComposer';
import { CareerCard } from '@/components/counselling/CareerCard';
import { EvidenceCard } from '@/components/counselling/EvidenceCard';
import { CareerEvidenceSection } from '@/components/counselling/CareerEvidenceSection';
import { SourcesList } from '@/components/counselling/SourcesList';
import { SuggestedQuestions } from '@/components/counselling/SuggestedQuestions';
import { HumanEscalationNotice } from '@/components/counselling/HumanEscalationNotice';
import { HumanEscalationModal } from '@/components/counselling/HumanEscalationModal';
import { CounsellingLoading } from '@/components/counselling/CounsellingLoading';
import { CounsellingError } from '@/components/counselling/CounsellingError';
import { useLanguage } from '@/context/LanguageContext';
import type { EscalationResponse } from '@/types/counselling';

/**
 * Parent AI Counselling Workspace (Phase 5 Bricks 22 & 26).
 *
 * Provides evidence-based vocational guidance tailored to parents, addressing
 * family questions on income stability, workshop safety, placement records,
 * and educational progression grounded strictly in verified statutory data.
 */
export const ParentCounselling: React.FC = () => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Session state
  const [sessions, setSessions] = useState<CounsellingSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CounsellingMessageItem[]>([]);
  const [latestResponse, setLatestResponse] = useState<CounsellingResponse | null>(null);
  const [activeExplainContext, setActiveExplainContext] = useState<CounsellingContext | null>(null);

  // UI state
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState<boolean>(false);
  const [activeEscalation, setActiveEscalation] = useState<EscalationResponse | null>(null);

  // Auto-scroll ref targeting the inner messages container only
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mainWorkspaceRef = useRef<HTMLElement>(null);
  const explainInitiatedRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (mainWorkspaceRef.current) {
      mainWorkspaceRef.current.scrollTop = 0;
    }
    scrollToBottom();
  }, [messages, isSending, latestResponse]);

  // Unified Initial load: Either load existing sessions OR initiate contextual explanation / question
  useEffect(() => {
    const explainContext = location.state?.explainContext as CounsellingContext | undefined;
    const initialQuestion = location.state?.initialQuestion as string | undefined;

    if ((explainContext || initialQuestion) && !explainInitiatedRef.current) {
      explainInitiatedRef.current = true;
      if (explainContext) {
        setActiveExplainContext(explainContext);
      }

      // Clear route state to prevent repeat triggering on browser reload
      navigate(location.pathname, { replace: true, state: {} });

      handleStartActionSession(initialQuestion, explainContext);
    } else {
      loadSessions();
    }
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    setErrorMessage(null);
    try {
      const data = await counsellingService.listSessions();
      setSessions(data);

      const hasAction = Boolean(location.state?.explainContext || location.state?.initialQuestion);
      if (!hasAction) {
        if (data.length > 0) {
          const initialId = data[0].id;
          setActiveSessionId(initialId);
          loadSessionMessages(initialId);
        } else {
          await handleNewSession();
        }
      }
      await loadActiveEscalation();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to load counselling sessions. Please check server connection.'
      );
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadActiveEscalation = async () => {
    try {
      const escs = await counsellingService.listEscalations();
      const active = escs.find((e) => e.status === 'pending' || e.status === 'in_progress');
      setActiveEscalation(active || null);
    } catch {
      // non-blocking
    }
  };

  const handleStartActionSession = async (
    initialQuestion?: string,
    explainContext?: CounsellingContext
  ) => {
    setIsSending(true);
    setErrorMessage(null);
    try {
      // 1. Create a fresh session for the parent inquiry
      const newSession = await counsellingService.createSession();
      const entityLabel = explainContext
        ? explainContext.entity_title || explainContext.entity_type
        : 'Career Guidance';

      const userText =
        initialQuestion ||
        (explainContext
          ? (language === 'te'
              ? `నా బిడ్డ వృత్తి మార్గదర్శనం కోసం దయచేసి ${entityLabel} గురించి వివరించండి.`
              : `Please explain ${entityLabel} (${explainContext.intent.replace('explain_', '').replace(/_/g, ' ')}) for my child's vocational guidance.`)
          : (language === 'te'
              ? 'నా బిడ్డ భవిష్యత్ కెరీర్ మార్గం గురించి దయచేసి మార్గదర్శకత్వం ఇవ్వండి.'
              : 'Please guide me regarding my child’s career path.'));

      const summaryItem: CounsellingSessionSummary = {
        id: newSession.id,
        student_profile_id: newSession.student_profile_id,
        status: newSession.status,
        started_at: newSession.started_at,
        ended_at: newSession.ended_at,
        message_count: 2,
        last_message_preview: userText.slice(0, 60),
      };

      setSessions((prev) => [summaryItem, ...prev.filter((s) => s.id !== newSession.id)]);
      setActiveSessionId(newSession.id);

      // Display optimistic user inquiry from parent perspective
      const optimisticMsg: CounsellingMessageItem = {
        id: Date.now(),
        session_id: newSession.id,
        sender_type: 'parent',
        content: userText,
        created_at: new Date().toISOString(),
      };
      setMessages([optimisticMsg]);

      // 2. Post message to the backend counselling pipeline
      const response: CounsellingResponse = await counsellingService.sendMessage(newSession.id, {
        message: userText,
        context: explainContext,
        language: language,
      });

      // 3. Append assistant response
      const assistantMsg: CounsellingMessageItem = {
        id: Date.now() + 1,
        session_id: newSession.id,
        sender_type: 'ai',
        content: response.message,
        created_at: response.created_at || new Date().toISOString(),
      };

      setMessages([optimisticMsg, assistantMsg]);
      setLatestResponse(response);

      // 4. Synchronize session list
      const sessionList = await counsellingService.listSessions();
      setSessions(sessionList);
      setActiveSessionId(newSession.id);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to generate counselling guidance right now. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };


  const loadSessionMessages = async (sessionId: number) => {
    setIsLoadingMessages(true);
    setErrorMessage(null);
    setLatestResponse(null);
    try {
      const detail: CounsellingSessionDetail = await counsellingService.getSession(sessionId);
      setMessages(detail.messages || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load conversation messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectSession = (sessionId: number) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setActiveExplainContext(null);
    loadSessionMessages(sessionId);
  };

  const handleNewSession = async () => {
    setErrorMessage(null);
    setIsSending(true);
    setActiveExplainContext(null);
    try {
      const newSession = await counsellingService.createSession();
      const summaryItem: CounsellingSessionSummary = {
        id: newSession.id,
        student_profile_id: newSession.student_profile_id,
        status: newSession.status,
        started_at: newSession.started_at,
        ended_at: newSession.ended_at,
        message_count: 0,
        last_message_preview: 'New Family Session',
      };

      setSessions((prev) => [summaryItem, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
      setLatestResponse(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create a new session.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEscalateToHuman = () => {
    setIsEscalationModalOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      try {
        const created = await counsellingService.createSession();
        targetSessionId = created.id;
        setActiveSessionId(targetSessionId);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to initialize session.');
        return;
      }
    }

    // Optimistic parent message
    const tempUserMsgId = Date.now();
    const optimisticMsg: CounsellingMessageItem = {
      id: tempUserMsgId,
      session_id: targetSessionId,
      sender_type: 'parent',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response: CounsellingResponse = await counsellingService.sendMessage(targetSessionId, {
        message: text,
        language: language,
      });

      const assistantMsg: CounsellingMessageItem = {
        id: Date.now() + 1,
        session_id: targetSessionId,
        sender_type: 'ai',
        content: response.message,
        created_at: response.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLatestResponse(response);

      // Update sidebar session preview
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                last_message_preview: text,
                message_count: s.message_count + 2,
              }
            : s
        )
      );
    } catch (err: any) {
      setErrorMessage(
        err.message || 'We could not get a counselling response right now. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4.25rem)] bg-slate-50 overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm">
      {/* 1. Desktop Sessions Sidebar */}
      <div className="hidden md:block w-72 lg:w-80 flex-shrink-0 h-full">
        <ChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          isLoading={isSending || isLoadingSessions}
        />
      </div>

      {/* 2. Mobile Drawer Backdrop & Sidebar */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-white z-10 shadow-xl">
            <ChatHistory
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              isLoading={isSending || isLoadingSessions}
            />
          </div>
        </div>
      )}

      {/* 3. Main Conversation Workspace */}
      <main
        ref={mainWorkspaceRef}
        className="flex-1 min-h-0 flex flex-col h-full max-h-full bg-white relative overflow-hidden"
        onScroll={(e) => {
          if (e.currentTarget.scrollTop !== 0) {
            e.currentTarget.scrollTop = 0;
          }
        }}
      >
        {/* Workspace Topbar */}
        <header className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open session history"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
              <Users className="w-4 h-4 text-blue-700" />
            </div>

            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">
                {t('parentCounsellorTitle')}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {t('parentCounsellorSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleEscalateToHuman}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-medium text-xs transition-colors cursor-pointer"
              title={t('talkToHumanCounsellor')}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">{t('talkToHumanCounsellor')}</span>
              <span className="sm:hidden">Counsellor</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{t('familyContextProtected')}</span>
            </span>
          </div>
        </header>

        {/* Conversation Stream */}
        <div
          ref={chatContainerRef}
          className="flex-1 min-h-0 h-0 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin"
        >
          {/* Active Human Counsellor Escalation Banner */}
          {activeEscalation && (
            <HumanEscalationNotice
              activeEscalation={activeEscalation}
              onEscalate={handleEscalateToHuman}
            />
          )}

          {/* Contextual Explain Indicator Banner (Brick 26) */}
          {activeExplainContext && (
            <div className="bg-blue-50 border border-blue-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-blue-950">{t('parentExplainNotice')} </span>
                  <span className="font-bold text-blue-800">
                    {activeExplainContext.entity_title || activeExplainContext.entity_type}
                  </span>
                  <span className="text-[11px] text-blue-600 ml-1.5 font-medium">
                    • {t('parentFocus')} {activeExplainContext.intent.replace('explain_', '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 border border-blue-200/60 shrink-0">
                {t('parentGuidanceMode')}
              </span>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMessage && (
            <CounsellingError
              message={errorMessage}
              onRetry={() => {
                if (activeSessionId) loadSessionMessages(activeSessionId);
              }}
            />
          )}

          {/* Empty Landing State for Parents */}
          {messages.length === 0 && !isLoadingMessages && (
            <div className="max-w-2xl mx-auto py-6 md:py-8 px-4 text-center space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
                <Compass className="w-6 h-6 text-blue-700" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  {t('vocationalGuidanceForParents')}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                  {t('parentIntroPrompt')}
                </p>
              </div>

              {/* Prominent Voice Interaction Banner (Brick 30 Voice Counselling) */}
              <div className="text-left">
                <VoiceCounsellingWidget
                  onSendMessage={handleSendMessage}
                  isLoading={isSending}
                  latestAssistantMessage={latestResponse?.message}
                />
              </div>

              {/* Canonical 8 Parent Concern Cards */}
              <div className="text-left pt-1">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 px-1">
                  {t('whatWouldYouLikeToKnow')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      title: t('concernIncomeTitle'),
                      subtitle: t('concernIncomeSubtitle'),
                      query: t('concernIncomeQuestion'),
                    },
                    {
                      title: t('concernJobSecurityTitle'),
                      subtitle: t('concernJobSecuritySubtitle'),
                      query: t('concernJobSecurityQuestion'),
                    },
                    {
                      title: t('concernFurtherEducationTitle'),
                      subtitle: t('concernFurtherEducationSubtitle'),
                      query: t('concernFurtherEducationQuestion'),
                    },
                    {
                      title: t('concernSocialPerceptionTitle'),
                      subtitle: t('concernSocialPerceptionSubtitle'),
                      query: t('concernSocialPerceptionQuestion'),
                    },
                    {
                      title: t('concernDistanceTitle'),
                      subtitle: t('concernDistanceSubtitle'),
                      query: t('concernDistanceQuestion'),
                    },
                    {
                      title: t('concernWorkingConditionsTitle'),
                      subtitle: t('concernWorkingConditionsSubtitle'),
                      query: t('concernWorkingConditionsQuestion'),
                    },
                    {
                      title: t('concernCareerGrowthTitle'),
                      subtitle: t('concernCareerGrowthSubtitle'),
                      query: t('concernCareerGrowthQuestion'),
                    },
                    {
                      title: t('concernOtherTitle'),
                      subtitle: t('concernOtherSubtitle'),
                      query: t('concernOtherQuestion'),
                    },
                  ].map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.query)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-slate-800 transition-all text-left shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-900">
                          {card.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                        {card.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading History Indicator */}
          {isLoadingMessages && (
            <div className="py-12 text-center">
              <CounsellingLoading message="Loading family session messages..." />
            </div>
          )}

          {/* Chronological Message Items */}
          {messages.map((msg, idx) => {
            const isLastMessage = idx === messages.length - 1;
            const isAI = msg.sender_type === 'ai';

            return (
              <React.Fragment key={msg.id || idx}>
                <ChatMessage
                  message={msg}
                  confidence={isLastMessage && isAI && latestResponse ? latestResponse.confidence : undefined}
                  requiresHuman={isLastMessage && isAI && latestResponse ? latestResponse.requires_human : undefined}
                  onEscalate={handleEscalateToHuman}
                />

                {/* Structured Context Cards for Latest AI Response */}
                {isLastMessage && isAI && latestResponse && (
                  <div className="pl-11 md:pl-13 space-y-4 my-3 max-w-[85%] md:max-w-[78%]">
                    {/* 1. Human Escalation Banner */}
                    <HumanEscalationNotice
                      requiresHuman={latestResponse.requires_human}
                      onEscalate={handleEscalateToHuman}
                    />

                    {/* 2. Structured Career Context Card */}
                    <CareerCard career={latestResponse.career} />

                    {/* 3. Verified Career Evidence & Empirical Data */}
                    <CareerEvidenceSection
                      career={latestResponse.career}
                      metrics={latestResponse.career_metrics}
                      careerPath={latestResponse.career_path}
                      furtherEducation={latestResponse.further_education}
                    />

                    {/* 4. Verified Evidence Citations */}
                    <EvidenceCard evidence={latestResponse.evidence} />

                    {/* 5. Authoritative Statutory Sources */}
                    <SourcesList sources={latestResponse.sources} />

                    {/* 6. Contextual Suggested Follow-up Questions */}
                    <SuggestedQuestions
                      questions={latestResponse.suggested_questions}
                      onSelectQuestion={handleSendMessage}
                      disabled={isSending}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Loading In-flight Indicator */}
          {isSending && <CounsellingLoading />}

        </div>

        {/* Sticky Message Composer & Accessible Voice Controls */}
        <footer className="p-3 md:p-4 border-t border-slate-200/90 bg-white/95 backdrop-blur-sm z-10 shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {messages.length > 0 && (
              <VoiceCounsellingWidget
                onSendMessage={handleSendMessage}
                isLoading={isSending}
                latestAssistantMessage={latestResponse?.message}
              />
            )}
            <MessageComposer onSendMessage={handleSendMessage} isLoading={isSending} />
          </div>
        </footer>
      </main>

      {/* Human Counsellor Escalation Modal */}
      <HumanEscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        sessionId={activeSessionId}
        careerId={latestResponse?.career?.id || null}
        careerTitle={latestResponse?.career?.title || undefined}
        initialConcern={location.state?.concernType || 'Income'}
        activeEscalation={activeEscalation}
        onEscalationSuccess={(esc) => {
          setActiveEscalation(esc);
        }}
      />
    </div>
  );
};

export default ParentCounselling;
