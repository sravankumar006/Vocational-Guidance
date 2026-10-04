import React from 'react';
import { Plus, MessageSquare, Calendar, ChevronRight, X } from 'lucide-react';
import type { CounsellingSessionSummary } from '@/types/counselling';

interface ChatHistoryProps {
  sessions: CounsellingSessionSummary[];
  activeSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onNewSession: () => void;
  onCloseMobileDrawer?: () => void;
  isLoading?: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onCloseMobileDrawer,
  isLoading,
}) => {
  return (
    <aside className="h-full flex flex-col bg-slate-50 border-r border-slate-200/80">
      {/* Header with New Session CTA */}
      <div className="p-3.5 md:p-4 border-b border-slate-200/80 flex items-center justify-between gap-2 bg-white/70">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Counselling Sessions</h2>
          <p className="text-xs text-slate-500">Your career dialogue history</p>
        </div>
        {onCloseMobileDrawer && (
          <button
            onClick={onCloseMobileDrawer}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Close session history drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Start New Session Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 text-xs md:text-sm font-medium rounded-xl bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Session Item List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5 scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p>No previous sessions found.</p>
            <p className="text-slate-400 mt-1">Start a conversation to receive personalized guidance.</p>
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const dateStr = new Date(sess.started_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess.id);
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-white border-slate-300 text-slate-900 shadow-sm font-medium'
                    : 'bg-transparent border-transparent hover:bg-slate-100/80 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-xs md:text-sm font-medium text-slate-900 line-clamp-1">
                    {sess.last_message_preview || `Session #${sess.id}`}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isActive ? 'text-slate-800' : 'text-slate-400 opacity-60'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </span>
                  <span>•</span>
                  <span>{sess.message_count} {sess.message_count === 1 ? 'message' : 'messages'}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
