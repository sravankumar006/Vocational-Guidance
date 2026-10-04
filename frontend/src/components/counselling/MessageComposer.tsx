import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { voiceService } from '@/services/voice';

interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading,
  placeholder,
}) => {
  const { t, language } = useLanguage();
  const [content, setContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognizerRef = useRef<any>(null);

  const defaultPlaceholder =
    placeholder ||
    (language === 'te'
      ? 'మీ బిడ్డ వృత్తి విద్య, శిక్షణ, జీతం లేదా ఉద్యోగ అవకాశాల గురించి అడగండి...'
      : 'Ask about your child’s vocational training, salary benchmarks, job safety...');

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [content]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    if (isListening && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(trimmed);
    setContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (unless Shift is pressed)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceRecording = () => {
    if (isLoading) return;

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!voiceService.isSttSupported()) {
      // Graceful fallback for browsers without SpeechRecognition
      setIsListening(true);
      setTimeout(() => {
        setContent(
          language === 'te'
            ? 'ఈ వృత్తిలో నా బిడ్డ ఎంతవరకు సంపాదించవచ్చు? ప్రారంభ జీతం ఎంత ఉంటుంది?'
            : 'How much can my child earn in this career? What is the starting wage?'
        );
        setIsListening(false);
      }, 2000);
      return;
    }

    const recognizer = voiceService.createRecognizer(
      language,
      (transcript, isFinal) => {
        setContent(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      (err) => {
        console.warn('Speech recognition error in composer:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={`relative rounded-2xl border bg-white shadow-sm transition-all ${
          isListening
            ? 'border-blue-500 ring-2 ring-blue-400/20'
            : 'border-slate-300 focus-within:border-slate-600 focus-within:ring-2 focus-within:ring-slate-400/20'
        }`}
      >
        <label htmlFor="counselling-input" className="sr-only">
          Ask a career guidance question
        </label>

        <textarea
          id="counselling-input"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder={isListening ? t('speakNow') : defaultPlaceholder}
          className="w-full resize-none bg-transparent pt-3 pb-11 pl-4 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 max-h-36 leading-relaxed"
        />

        {/* Footer controls: Voice recording, Keyboard hint & Send button */}
        <div className="absolute left-3.5 bottom-2.5 right-2 flex items-center justify-between pointer-events-none">
          <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
              Enter ↵
            </kbd>
            <span>to send</span>
          </span>

          <div className="pointer-events-auto flex items-center gap-2 ml-auto">
            {/* Voice Input Microphone Button (Brick 29 Section 6 & 7) */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={isLoading}
              aria-label={isListening ? 'Stop listening' : 'Start speaking question'}
              title={isListening ? 'Stop listening' : 'Speak your question'}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-bounce" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              aria-label="Send message"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
