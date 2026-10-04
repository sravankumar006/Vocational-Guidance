/**
 * Brick 30 — Voice Counselling Architecture
 * 
 * Modular provider abstractions for Speech-to-Text (STT) and Text-to-Speech (TTS).
 * Designed for low-literacy parent-first voice interaction in Telugu ('te-IN')
 * and English ('en-IN'), extensible to additional Indian regional languages.
 * 
 * Strict boundary:
 * - Zero direct Gemini / cloud API keys in the frontend.
 * - Decoupled from UI components via STTProvider and TTSProvider interfaces.
 * - Handles long answer chunking so speech playback is never prematurely cut off.
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface STTCallbacks {
  onResult: (result: STTResult) => void;
  onError: (error: { message: string; code?: string }) => void;
  onEnd: () => void;
  onStart?: () => void;
}

export interface STTProvider {
  name: string;
  isSupported(): boolean;
  getSupportedLanguages(): string[];
  start(language: string, callbacks: STTCallbacks): { stop: () => void; abort: () => void };
}

export interface TTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: { message: string; code?: string }) => void;
  onChunkChange?: (chunkIndex: number, totalChunks: number) => void;
}

export interface TTSProvider {
  name: string;
  isSupported(): boolean;
  getSupportedLanguages(): string[];
  synthesize(text: string, language: string, callbacks?: TTSCallbacks): {
    stop: () => void;
    pause?: () => void;
    resume?: () => void;
  };
}

/**
 * Standard Web Speech Recognition Provider (STT)
 */
export class BrowserSTTProvider implements STTProvider {
  name = 'Browser Web Speech Recognition';

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  getSupportedLanguages(): string[] {
    return ['te-IN', 'en-IN', 'en-US', 'hi-IN'];
  }

  start(language: string, callbacks: STTCallbacks): { stop: () => void; abort: () => void } {
    if (!this.isSupported()) {
      callbacks.onError({
        message: 'Speech recognition is not supported in this browser.',
        code: 'NOT_SUPPORTED',
      });
      callbacks.onEnd();
      return { stop: () => {}, abort: () => {} };
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechRecognition();

      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = language === 'te' || language === 'te-IN' ? 'te-IN' : 'en-IN';

      recognizer.onstart = () => {
        if (callbacks.onStart) callbacks.onStart();
      };

      recognizer.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        callbacks.onResult({
          transcript: transcript.trim(),
          isFinal,
        });
      };

      recognizer.onerror = (event: any) => {
        console.warn('Browser STT Error:', event.error);
        callbacks.onError({
          message: event.error === 'no-speech'
            ? 'No speech detected. Please speak clearly.'
            : 'We could not understand that speech. Please try again.',
          code: event.error,
        });
      };

      recognizer.onend = () => {
        callbacks.onEnd();
      };

      recognizer.start();

      return {
        stop: () => {
          try {
            recognizer.stop();
          } catch {
            // ignore
          }
        },
        abort: () => {
          try {
            recognizer.abort();
          } catch {
            // ignore
          }
        },
      };
    } catch (err: any) {
      callbacks.onError({
        message: err.message || 'Failed to initialize speech recognition.',
        code: 'INIT_ERROR',
      });
      callbacks.onEnd();
      return { stop: () => {}, abort: () => {} };
    }
  }
}

/**
 * Standard Web Speech Synthesis Provider (TTS)
 * Implements intelligent chunking for long AI responses to prevent audio cut-offs.
 */
export class BrowserTTSProvider implements TTSProvider {
  name = 'Browser Web Speech Synthesis';

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getSupportedLanguages(): string[] {
    return ['te-IN', 'en-IN', 'en-US', 'hi-IN'];
  }

  /**
   * Cleans markdown syntax and splits long text into digestible sentences/phrases.
   */
  private splitTextIntoChunks(rawText: string): string[] {
    const cleaned = rawText
      .replace(/###\s+/g, '')
      .replace(/####\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/[-*]\s+/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/[#_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return [];

    // Split on sentence terminals across English & Telugu punctuation (. ! ? । \n)
    const sentences = cleaned.split(/(?<=[.!?।\n])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).length <= 180) {
        currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = trimmed;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [cleaned];
  }

  synthesize(
    text: string,
    language: string,
    callbacks?: TTSCallbacks
  ): { stop: () => void; pause?: () => void; resume?: () => void } {
    if (!this.isSupported()) {
      if (callbacks?.onError) {
        callbacks.onError({
          message: 'Voice playback is not supported in this browser.',
          code: 'NOT_SUPPORTED',
        });
      }
      return { stop: () => {} };
    }

    window.speechSynthesis.cancel();

    const chunks = this.splitTextIntoChunks(text);
    if (chunks.length === 0) {
      if (callbacks?.onEnd) callbacks.onEnd();
      return { stop: () => {} };
    }

    let isCancelled = false;
    const targetLang = language === 'te' || language === 'te-IN' ? 'te-IN' : 'en-IN';

    // Locate matching regional voice if available
    const availableVoices = window.speechSynthesis.getVoices();
    const matchedVoice = availableVoices.find(
      (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
    ) || availableVoices.find((v) => v.lang.toLowerCase().startsWith(targetLang.split('-')[0]));

    if (callbacks?.onStart) {
      callbacks.onStart();
    }

    const speakChunk = (index: number) => {
      if (isCancelled || index >= chunks.length) {
        if (!isCancelled && callbacks?.onEnd) {
          callbacks.onEnd();
        }
        return;
      }
      if (callbacks?.onChunkChange) {
        callbacks.onChunkChange(index + 1, chunks.length);
      }

      const chunkText = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.lang = targetLang;
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.rate = 0.95; // slightly deliberate pacing for low-literacy clarity

      utterance.onend = () => {
        if (!isCancelled) {
          speakChunk(index + 1);
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return; // Expected during user-initiated stop
        }
        if (!isCancelled) {
          if (callbacks?.onError) {
            callbacks.onError({
              message: 'Voice playback encountered an issue.',
              code: e.error,
            });
          }
          speakChunk(index + 1); // attempt next chunk instead of stalling
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);

    return {
      stop: () => {
        isCancelled = true;
        window.speechSynthesis.cancel();
        if (callbacks?.onEnd) callbacks.onEnd();
      },
      pause: () => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
        }
      },
      resume: () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      },
    };
  }
}

/**
 * High-level Voice Coordinator managing STT + TTS lifecycle and state transitions.
 */
export class VoiceServiceManager {
  private sttProvider: STTProvider;
  private ttsProvider: TTSProvider;
  private activeTtsController: { stop: () => void; pause?: () => void; resume?: () => void } | null = null;
  private activeSttController: { stop: () => void; abort: () => void } | null = null;

  constructor(
    stt: STTProvider = new BrowserSTTProvider(),
    tts: TTSProvider = new BrowserTTSProvider()
  ) {
    this.sttProvider = stt;
    this.ttsProvider = tts;
  }

  setSTTProvider(provider: STTProvider): void {
    this.sttProvider = provider;
  }

  setTTSProvider(provider: TTSProvider): void {
    this.ttsProvider = provider;
  }

  getSTTProvider(): STTProvider {
    return this.sttProvider;
  }

  getTTSProvider(): TTSProvider {
    return this.ttsProvider;
  }

  isSttSupported(): boolean {
    return this.sttProvider.isSupported();
  }

  isTtsSupported(): boolean {
    return this.ttsProvider.isSupported();
  }

  startListening(
    language: string,
    callbacks: STTCallbacks
  ): { stop: () => void; abort: () => void } {
    this.stopSpeaking();
    const controller = this.sttProvider.start(language, {
      ...callbacks,
      onEnd: () => {
        this.activeSttController = null;
        callbacks.onEnd();
      },
    });
    this.activeSttController = controller;
    return controller;
  }

  stopListening(): void {
    if (this.activeSttController) {
      this.activeSttController.stop();
      this.activeSttController = null;
    }
  }

  speak(
    text: string,
    language: string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): () => void {
    this.stopListening();
    this.stopSpeaking();

    const controller = this.ttsProvider.synthesize(text, language, {
      onEnd: () => {
        this.activeTtsController = null;
        if (onEnd) onEnd();
      },
      onError: (err) => {
        this.activeTtsController = null;
        if (onError) onError(err);
      },
    });

    this.activeTtsController = controller;

    return () => {
      controller.stop();
      this.activeTtsController = null;
    };
  }

  stopSpeaking(): void {
    if (this.activeTtsController) {
      this.activeTtsController.stop();
      this.activeTtsController = null;
    }
  }

  pauseSpeaking(): void {
    if (this.activeTtsController?.pause) {
      this.activeTtsController.pause();
    }
  }

  resumeSpeaking(): void {
    if (this.activeTtsController?.resume) {
      this.activeTtsController.resume();
    }
  }

  // Backward compatibility wrapper for existing ChatMessage and MessageComposer
  createRecognizer(
    lang: 'en' | 'te',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): { start: () => void; stop: () => void; abort: () => void } | null {
    if (!this.isSttSupported()) return null;
    let controller: { stop: () => void; abort: () => void } | null = null;

    return {
      start: () => {
        controller = this.startListening(lang, {
          onResult: (res) => onResult(res.transcript, res.isFinal),
          onError: (e) => onError(e),
          onEnd: () => onEnd(),
        });
      },
      stop: () => {
        if (controller) controller.stop();
      },
      abort: () => {
        if (controller) controller.abort();
      },
    };
  }
}

export const voiceService = new VoiceServiceManager();
