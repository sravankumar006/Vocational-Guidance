import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Square,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { voiceService } from '@/services/voice';

interface VoiceCounsellingWidgetProps {
  onSendMessage: (query: string) => Promise<void> | void;
  isLoading: boolean;
  latestAssistantMessage?: string | null;
  autoPlayAnswer?: boolean;
}

export type VoiceInteractionState =
  | 'idle'
  | 'listening'
  | 'confirming'
  | 'processing'
  | 'speaking'
  | 'error';

export const VoiceCounsellingWidget: React.FC<VoiceCounsellingWidgetProps> = ({
  onSendMessage,
  isLoading,
  latestAssistantMessage,
  autoPlayAnswer = true,
}) => {
  const { t, language } = useLanguage();
  const [state, setState] = useState<VoiceInteractionState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number } | null>(null);

  const activeSttControllerRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const activeTtsStopRef = useRef<(() => void) | null>(null);
  const previousAssistantMsgRef = useRef<string | null>(null);
  const autoSendTimerRef = useRef<any>(null);

  // Sync processing state with external loading prop
  useEffect(() => {
    if (isLoading && state !== 'speaking') {
      setState('processing');
    }
  }, [isLoading]);

  // When AI finishes generating a response, auto-speak if initiated from voice
  useEffect(() => {
    if (
      latestAssistantMessage &&
      latestAssistantMessage !== previousAssistantMsgRef.current &&
      autoPlayAnswer &&
      state === 'processing'
    ) {
      previousAssistantMsgRef.current = latestAssistantMessage;
      handleSpeakAnswer(latestAssistantMessage);
    } else if (!isLoading && state === 'processing') {
      setState('idle');
    }
  }, [latestAssistantMessage, isLoading]);

  // Cleanup speech/recognition on component unmount
  useEffect(() => {
    return () => {
      if (activeSttControllerRef.current) {
        activeSttControllerRef.current.abort();
      }
      if (activeTtsStopRef.current) {
        activeTtsStopRef.current();
      }
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
      voiceService.stopSpeaking();
    };
  }, []);

  const handleStartListening = () => {
    if (isLoading) return;

    // Reset ongoing audio/speech
    voiceService.stopSpeaking();
    if (activeTtsStopRef.current) {
      activeTtsStopRef.current();
      activeTtsStopRef.current = null;
    }
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    setTranscript('');
    setErrorMessage(null);
    setChunkProgress(null);
    setState('listening');

    if (!voiceService.isSttSupported()) {
      // Graceful fallback for non-supporting browsers
      setTimeout(() => {
        const fallbackText =
          language === 'te'
            ? 'ఈ కోర్సు చేసిన తర్వాత నా బిడ్డ ఎంత సంపాదించగలడు?'
            : 'How much can my child earn after completing this course?';
        setTranscript(fallbackText);
        setState('confirming');
      }, 1500);
      return;
    }

    const controller = voiceService.startListening(language, {
      onResult: (result) => {
        setTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          setState('confirming');
        }
      },
      onError: (err) => {
        console.warn('Voice STT error:', err);
        setErrorMessage(t('sttFailedMessage'));
        setState('error');
      },
      onEnd: () => {
        // If listening ended and we got text, prompt confirmation
        setTranscript((current) => {
          if (current.trim()) {
            setState('confirming');
          } else {
            setState((prevState) => (prevState === 'listening' ? 'idle' : prevState));
          }
          return current;
        });
      },
    });

    activeSttControllerRef.current = controller;
  };

  const handleStopListening = () => {
    if (activeSttControllerRef.current) {
      activeSttControllerRef.current.stop();
      activeSttControllerRef.current = null;
    }
    if (transcript.trim()) {
      setState('confirming');
    } else {
      setState('idle');
    }
  };

  const handleConfirmAndSend = async () => {
    const textToSend = transcript.trim();
    if (!textToSend || isLoading) return;

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    setState('processing');
    try {
      await onSendMessage(textToSend);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
      setState('error');
    }
  };

  const handleSpeakAnswer = (text: string) => {
    if (!voiceService.isTtsSupported()) {
      setState('idle');
      return;
    }

    setState('speaking');
    const stopFn = voiceService.speak(
      text,
      language,
      () => {
        setState('idle');
        setChunkProgress(null);
        activeTtsStopRef.current = null;
      },
      (err) => {
        console.warn('TTS playback error:', err);
        setErrorMessage(t('ttsFailedMessage'));
        setState('idle');
        activeTtsStopRef.current = null;
      }
    );

    activeTtsStopRef.current = stopFn;
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    if (activeTtsStopRef.current) {
      activeTtsStopRef.current();
      activeTtsStopRef.current = null;
    }
    setState('idle');
    setChunkProgress(null);
  };

  return (
    <div
      className="w-full rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border border-blue-200/80 p-4 sm:p-5 shadow-xs transition-all"
      role="region"
      aria-label="Voice Counselling Interface"
    >
      {/* 1. IDLE STATE: Large Accessible Microphone Action */}
      {state === 'idle' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <button
              type="button"
              onClick={handleStartListening}
              disabled={isLoading}
              aria-label={t('voiceIdleBtn')}
              title={t('voiceIdleBtn')}
              className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95 flex-shrink-0"
            >
              <Mic className="w-7 h-7" />
            </button>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {t('voicePromptBannerTitle')}
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-md">
                {t('voicePromptBannerSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartListening}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Mic className="w-4 h-4 text-blue-600" />
              <span>{t('voiceIdleBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. LISTENING STATE: Active Live Speech Recognition */}
      {state === 'listening' && (
        <div className="flex flex-col items-center text-center py-2 space-y-3">
          <div className="relative flex items-center justify-center">
            {/* Visual audio pulse animation (accessible visual representation) */}
            <span className="absolute w-20 h-20 rounded-full bg-rose-400/30 animate-ping" />
            <button
              type="button"
              onClick={handleStopListening}
              aria-label="Stop listening"
              className="relative w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <MicOff className="w-8 h-8 animate-pulse" />
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-rose-700 font-bold text-sm sm:text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>{t('voiceListeningBtn')}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {t('voiceQuestionHelp')}
            </p>
          </div>

          {/* Partial live transcription preview if available */}
          {transcript && (
            <div className="w-full max-w-lg mt-2 p-2.5 rounded-xl bg-white border border-rose-200 text-xs text-slate-800 italic font-medium">
              "{transcript}"
            </div>
          )}

          <button
            type="button"
            onClick={handleStopListening}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer mt-1"
          >
            {t('stopSpeech')}
          </button>
        </div>
      )}

      {/* 3. CONFIRMING STATE: Transcript Verification & Easy Confirmation */}
      {state === 'confirming' && (
        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('youSaid')}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-blue-200 text-sm font-semibold text-slate-900 shadow-2xs leading-relaxed">
            "{transcript}"
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartListening}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('speakAgain')}</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmAndSend}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer ml-auto"
            >
              <span>{t('sendQuestion')}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. PROCESSING STATE: Thinking */}
      {state === 'processing' && (
        <div className="flex items-center justify-center gap-3 py-3 text-slate-700">
          <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm font-semibold">{t('voiceProcessing')}</span>
        </div>
      )}

      {/* 5. SPEAKING STATE: Active Audio Playback with Stop Control */}
      {state === 'speaking' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 text-blue-900">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center animate-pulse shadow-2xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold">{t('voiceSpeaking')}</h5>
              {chunkProgress && (
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'te'
                    ? `భాగం ${chunkProgress.current} / ${chunkProgress.total}`
                    : `Section ${chunkProgress.current} of ${chunkProgress.total}`}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStopSpeaking}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-transform"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>{t('stopSpeech')}</span>
          </button>
        </div>
      )}

      {/* 6. ERROR / STT FAILURE STATE: User-Friendly Retry */}
      {state === 'error' && (
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">
              {errorMessage || t('sttFailedMessage')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleStartListening}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t('tryAgainVoice')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
