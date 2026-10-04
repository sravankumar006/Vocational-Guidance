import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Square,
  UserCheck,
} from 'lucide-react';
import type { CounsellingMessageItem } from '@/types/counselling';
import { useLanguage } from '@/context/LanguageContext';
import { voiceService } from '@/services/voice';

interface ChatMessageProps {
  message: CounsellingMessageItem;
  confidence?: number;
  requiresHuman?: boolean;
  onEscalate?: () => void;
}

/**
 * Safely parses basic structured markdown without unsafe dangerouslySetInnerHTML.
 * Supports: ### Headings, **bold**, *italic*, bullet points (- ), and numbered lists (1. ).
 */
function renderStructuredText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <div className="space-y-3.5 text-sm md:text-base leading-relaxed text-slate-800">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Heading 3: ###
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={pIdx}
              className="text-base md:text-lg font-semibold text-slate-900 pt-2 pb-1 border-b border-slate-200/80"
            >
              {renderInlineStyles(trimmed.slice(4))}
            </h3>
          );
        }

        // Heading 4: ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={pIdx} className="text-sm md:text-base font-semibold text-slate-900 pt-1">
              {renderInlineStyles(trimmed.slice(5))}
            </h4>
          );
        }

        // Bullet list lines: lines starting with "- " or "* "
        const lines = trimmed.split('\n');
        const isBulletList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc list-outside pl-5 space-y-1.5 my-2 text-slate-700">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="pl-1">
                  {renderInlineStyles(line.trim().replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={pIdx} className="whitespace-pre-line text-slate-700 font-normal">
            {renderInlineStyles(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold text (**text**) and italics (*text*) safely into React spans.
 */
function renderInlineStyles(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  confidence,
  requiresHuman,
  onEscalate,
}) => {
  const { t, language } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  const isUser =
    message.sender_type === 'student' ||
    message.sender_type === 'parent';
  const isParent = message.sender_type === 'parent';

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Clean up any ongoing TTS speech if this message is unmounted
  useEffect(() => {
    return () => {
      if (isPlayingAudio) {
        voiceService.stopSpeaking();
      }
    };
  }, [isPlayingAudio]);

  const handleToggleAudio = () => {
    if (!voiceService.isTtsSupported()) {
      setTtsUnavailable(true);
      return;
    }

    if (isPlayingAudio) {
      voiceService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    setTtsUnavailable(false);

    voiceService.speak(
      message.content,
      language,
      () => setIsPlayingAudio(false),
      () => {
        setIsPlayingAudio(false);
        setTtsUnavailable(true);
      }
    );
  };

  const getAuthorLabel = () => {
    if (isParent) return t('parentYou');
    if (isUser) return t('studentYou');
    return t('vocationalCounsellor');
  };

  const isLowConfidence = confidence !== undefined && confidence < 0.4;
  const showEscalationOption = (isLowConfidence || requiresHuman) && !isUser;

  return (
    <div
      className={`group flex items-start gap-3 md:gap-4 my-4 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border ${
          isUser
            ? isParent
              ? 'bg-blue-800 border-blue-700 text-white'
              : 'bg-slate-700 border-slate-600 text-white'
            : 'bg-white border-slate-300 text-slate-700 shadow-sm'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-4 h-4 md:w-4.5 md:h-4.5" />
        ) : (
          <Sparkles className="w-4 h-4 md:w-4.5 md:h-4.5 text-slate-600" />
        )}
      </div>

      {/* Message Bubble & Content */}
      <div
        className={`flex flex-col max-w-[85%] md:max-w-[78%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Author Label & Timestamp & Read Aloud Action */}
        <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-700">{getAuthorLabel()}</span>
          <span>•</span>
          <span>{formattedTime}</span>

          {/* Voice Read-Aloud Action for AI Responses (Brick 29 Section 8) */}
          {!isUser && (
            <button
              type="button"
              onClick={handleToggleAudio}
              aria-label={isPlayingAudio ? t('stopListening') : t('listenToAnswer')}
              className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md font-medium text-xs transition-colors cursor-pointer border ${
                isPlayingAudio
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3 h-3 fill-white" />
                  <span>{t('stopListening')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-slate-600" />
                  <span>{t('listenToAnswer')}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* TTS Unavailable Notification */}
        {ttsUnavailable && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-1">
            {t('ttsUnavailable')}
          </div>
        )}

        {/* Message Container - supports comfortably long detailed responses */}
        <div
          className={`w-full rounded-2xl p-4 md:p-5 shadow-sm border ${
            isUser
              ? isParent
                ? 'bg-blue-50/90 border-blue-200 text-slate-900 rounded-tr-none'
                : 'bg-slate-100/90 border-slate-200 text-slate-900 rounded-tr-none'
              : 'bg-white border-slate-200/90 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="text-sm md:text-base text-slate-900 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            renderStructuredText(message.content)
          )}
        </div>

        {/* Status / Evidence Grounding Indicator under AI responses */}
        {!isUser && confidence !== undefined && (
          <div className="flex items-center gap-3 mt-1.5 px-1 text-xs text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
              {confidence >= 0.7 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('statutoryRecordsSupported')}</span>
                </>
              ) : confidence >= 0.4 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('generalGuidanceNotice')}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('limitedDataNotice')}</span>
                </>
              )}
            </span>
            {requiresHuman && (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                • {t('humanReviewAdvised')}
              </span>
            )}
          </div>
        )}

        {/* Low Confidence / Human Escalation Prompt for Parents (Brick 29 Section 18 & 19) */}
        {showEscalationOption && (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                {t('notFullySureNotice')}
              </p>
            </div>
            {onEscalate && (
              <button
                type="button"
                onClick={onEscalate}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('talkToHumanCounsellor')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
