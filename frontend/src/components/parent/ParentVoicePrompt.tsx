import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ParentVoicePromptProps {
  onVoiceSubmit: (spokenQuery: string) => void;
  disabled?: boolean;
}

export const ParentVoicePrompt: React.FC<ParentVoicePromptProps> = ({
  onVoiceSubmit,
  disabled = false,
}) => {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      // fallback handled gracefully
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (disabled) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Failed to start speech recognition', err);
        }
      } else {
        // Fallback simulation for unsupported browsers/environments
        setIsListening(true);
        setTimeout(() => {
          setTranscript(
            language === 'te'
              ? 'నా బిడ్డ ఈ కోర్సు తర్వాత మంచి ఉద్యోగం సంపాదించగలరా?'
              : 'Can my child get a stable job and good salary after this trade course?'
          );
          setIsListening(false);
        }, 2500);
      }
    }
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    onVoiceSubmit(transcript.trim());
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-50/70 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left side: Friendly Icon + Prompt */}
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {isListening ? t('speakNow') : t('tellUsConcernVoice')}
            </h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-md">
              {t('tapToSpeak')}
            </p>
          </div>
        </div>

        {/* Right side: Microphone Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            className={`px-4.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-white hover:bg-slate-50 text-blue-700 border border-blue-200'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-spin' : ''}`} />
            <span>{isListening ? 'Stop' : 'Speak'}</span>
          </button>
        </div>
      </div>

      {/* Live Transcript Display & Submit Button */}
      {transcript && (
        <div className="mt-4 pt-3.5 border-t border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-blue-100">
          <div className="flex items-start gap-2 text-left w-full sm:w-auto">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
              "{transcript}"
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <span>{t('continueToCounsellor')}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
