import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Menu,
  ShieldCheck,
  Compass,
  UserCheck,
} from 'lucide-react';
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
import type { EscalationResponse } from '@/types/counselling';

export const StudentCounselling: React.FC = () => {
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

  // Unified Initial load: Either load existing sessions OR initiate contextual explanation
  useEffect(() => {
    const explainContext = location.state?.explainContext as CounsellingContext | undefined;
    if (explainContext && !explainInitiatedRef.current) {
      explainInitiatedRef.current = true;
      setActiveExplainContext(explainContext);

      // Clear route state immediately so refresh or history doesn't re-trigger duplicate sessions
      navigate(location.pathname, { replace: true, state: {} });

      handleStartExplainSession(explainContext);
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

      const hasExplain = Boolean(location.state?.explainContext);
      if (!hasExplain) {
        if (data.length > 0) {
          // Select most recent session
          const initialId = data[0].id;
          setActiveSessionId(initialId);
          loadSessionMessages(initialId);
        } else {
          // Automatically create initial session for new students
          await handleNewSession();
        }
      }
      await loadActiveEscalation();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load counselling sessions. Please check server connection.');
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

  const handleStartExplainSession = async (explainContext: CounsellingContext) => {
    setIsSending(true);
    setErrorMessage(null);
    try {
      // 1. Create a fresh session for this specific explanation
      const newSession = await counsellingService.createSession();
      const entityLabel = explainContext.entity_title || explainContext.entity_type;
      const summaryItem: CounsellingSessionSummary = {
        id: newSession.id,
        student_profile_id: newSession.student_profile_id,
        status: newSession.status,
        started_at: newSession.started_at,
        ended_at: newSession.ended_at,
        message_count: 2,
        last_message_preview: `Explain: ${entityLabel}`,
      };

      setSessions((prev) => [summaryItem, ...prev.filter((s) => s.id !== newSession.id)]);
      setActiveSessionId(newSession.id);

      // Display optimistic user inquiry
      const intentLabel = explainContext.intent.replace('explain_', '').replace(/_/g, ' ');
      const userText = `Please explain ${entityLabel} (${intentLabel})`;
      const optimisticMsg: CounsellingMessageItem = {
        id: Date.now(),
        session_id: newSession.id,
        sender_type: 'student',
        content: userText,
        created_at: new Date().toISOString(),
      };
      setMessages([optimisticMsg]);

      // 2. Post the structured explain message to the backend
      const response: CounsellingResponse = await counsellingService.sendMessage(newSession.id, {
        message: 'Explain',
        context: explainContext,
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

      // 4. Synchronize session list so the new active session is accurately displayed in sidebar
      const sessionList = await counsellingService.listSessions();
      setSessions(sessionList);
      setActiveSessionId(newSession.id);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unable to generate contextual explanation right now. Please try again.'
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
        last_message_preview: 'New Session',
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

    // Optimistic user message
    const tempUserMsgId = Date.now();
    const optimisticMsg: CounsellingMessageItem = {
      id: tempUserMsgId,
      session_id: targetSessionId,
      sender_type: 'student',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response: CounsellingResponse = await counsellingService.sendMessage(targetSessionId, {
        message: text,
      });

      // Append assistant response to messages
      const assistantMsg: CounsellingMessageItem = {
        id: Date.now() + 1,
        session_id: targetSessionId,
        sender_type: 'ai',
        content: response.message,
        created_at: response.created_at || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLatestResponse(response);

      // Update session preview in sidebar
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
      {/* 1. Desktop Sessions Sidebar (Hidden on Mobile) */}
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

            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
              <Sparkles className="w-4 h-4 text-slate-700" />
            </div>

            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">
                AI Vocational Guidance Counsellor
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Grounded in official MSDE, NCVET, and statutory qualification records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleEscalateToHuman}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-medium text-xs transition-colors cursor-pointer"
              title="Talk to a Human Counsellor"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Talk to a Human Counsellor</span>
              <span className="sm:hidden">Counsellor</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Evidence Mode</span>
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
                  <span className="font-semibold text-blue-950">You asked me to explain: </span>
                  <span className="font-bold text-blue-800">
                    {activeExplainContext.entity_title || activeExplainContext.entity_type}
                  </span>
                  <span className="text-[11px] text-blue-600 ml-1.5 font-medium">
                    • Focus: {activeExplainContext.intent.replace('explain_', '').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800 border border-blue-200/60 shrink-0">
                Contextual Explanation
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

          {/* Empty Landing State */}
          {messages.length === 0 && !isLoadingMessages && (
            <div className="max-w-2xl mx-auto py-8 md:py-12 px-4 text-center space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center mx-auto shadow-sm">
                <Compass className="w-6 h-6 text-slate-700" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  How can I help with your career path today?
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Ask me about technical trades, government ITI courses, admission prerequisites,
                  empirical wage benchmarks, or career progression.
                </p>
              </div>

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {[
                  {
                    title: 'Electrician Career Path',
                    query: 'Explain the complete career path for becoming an electrician in India.',
                  },
                  {
                    title: 'Courses After 10th',
                    query: 'What vocational technical courses can I join after passing class 10th?',
                  },
                  {
                    title: 'Automotive vs Electronics',
                    query: 'Compare Automotive Technician and Electronics Technician for someone who likes hands-on work.',
                  },
                  {
                    title: 'Apprenticeship & Earnings',
                    query: 'What are the typical apprentice wages and placement opportunities in skilled trades?',
                  },
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(card.query)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 text-slate-800 transition-all text-left shadow-2xs group"
                  >
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-slate-950 block mb-1">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      "{card.query}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading History Indicator */}
          {isLoadingMessages && (
            <div className="py-12 text-center">
              <CounsellingLoading message="Loading session conversation history..." />
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

                {/* If this is the latest AI message, attach rich structured context */}
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

        {/* Sticky Message Composer */}
        <footer className="p-3 md:p-4 border-t border-slate-200/90 bg-white/95 backdrop-blur-sm z-10 shrink-0">
          <div className="max-w-4xl mx-auto">
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
        activeEscalation={activeEscalation}
        onEscalationSuccess={(esc) => {
          setActiveEscalation(esc);
        }}
      />
    </div>
  );
};

export default StudentCounselling;
