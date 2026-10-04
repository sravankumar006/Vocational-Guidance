/**
 * Centralized Application Error Normalization (Phase 9 Brick 33).
 *
 * Guarantees that parents, students, and low-literacy users NEVER see raw
 * technical error strings, stack traces, database exceptions, or HTTP codes.
 */

export type AppErrorCode =
  | 'AI_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'VOICE_UNAVAILABLE'
  | 'INVALID_AI_RESPONSE'
  | 'NO_CAREER_MATCH'
  | 'NO_VERIFIED_EVIDENCE'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'REQUEST_TIMEOUT'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export type ErrorRecoveryAction =
  | 'retry'
  | 'human_counsellor'
  | 'login'
  | 'change_preferences'
  | 'type_question'
  | 'refresh';

export interface AppErrorData {
  code: AppErrorCode;
  message: string;
  userMessageEn: string;
  userMessageTe: string;
  retryable: boolean;
  action: ErrorRecoveryAction;
  correlationId?: string;
  statusCode?: number;
}

export class AppError extends Error implements AppErrorData {
  public readonly code: AppErrorCode;
  public readonly userMessageEn: string;
  public readonly userMessageTe: string;
  public readonly retryable: boolean;
  public readonly action: ErrorRecoveryAction;
  public readonly correlationId?: string;
  public readonly statusCode?: number;

  constructor(data: AppErrorData) {
    super(data.message);
    this.name = 'AppError';
    this.code = data.code;
    this.userMessageEn = data.userMessageEn;
    this.userMessageTe = data.userMessageTe;
    this.retryable = data.retryable;
    this.action = data.action;
    this.correlationId = data.correlationId;
    this.statusCode = data.statusCode;
  }

  /**
   * Returns human-friendly message in the selected language.
   */
  public getUserMessage(language: string = 'en'): string {
    return language === 'te' ? this.userMessageTe : this.userMessageEn;
  }
}

/**
 * Curated parent-first error messages in English and Telugu.
 */
const ERROR_DEFINITIONS: Record<AppErrorCode, { en: string; te: string; action: ErrorRecoveryAction; retryable: boolean }> = {
  AI_UNAVAILABLE: {
    en: 'The AI counsellor is temporarily unavailable. Please try again in a little while.',
    te: 'AI కౌన్సిలర్ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
  DATABASE_UNAVAILABLE: {
    en: "We couldn't load this information right now. Please try again shortly.",
    te: 'ఈ సమాచారాన్ని ఇప్పుడు లోడ్ చేయలేకపోయాము. దయచేసి కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
  VOICE_UNAVAILABLE: {
    en: "Voice isn't available right now. You can type your question instead.",
    te: 'వాయిస్ ఇన్‌పుట్ ప్రస్తుతం అందుబాటులో లేదు. మీరు టైప్ చేసి ప్రశ్నించవచ్చు.',
    action: 'type_question',
    retryable: false,
  },
  INVALID_AI_RESPONSE: {
    en: 'The answer could not be fully verified. Please ask again or talk to a human counsellor.',
    te: 'సమాధానం పూర్తిగా ధృవీకరించబడలేదు. దయచేసి మళ్ళీ అడగండి లేదా మానవ కౌన్సిలర్‌తో మాట్లాడండి.',
    action: 'human_counsellor',
    retryable: true,
  },
  NO_CAREER_MATCH: {
    en: "We couldn't find a career that matches these preferences yet. Try changing your preferences.",
    te: 'ఈ ప్రాధాన్యతలకు సరిపోయే వృత్తి ఇంకా కనుగొనబడలేదు. దయచేసి మీ ఎంపికలను మార్చి చూడండి.',
    action: 'change_preferences',
    retryable: false,
  },
  NO_VERIFIED_EVIDENCE: {
    en: "I don't have enough verified information to answer that with full confidence.",
    te: 'ఖచ్చితంగా సమాధానం ఇవ్వడానికి నా వద్ద తగినంత ధృవీకరించబడిన సమాచారం లేదు.',
    action: 'human_counsellor',
    retryable: false,
  },
  NETWORK_ERROR: {
    en: "We couldn't connect right now. Please check your internet connection and try again.",
    te: 'ఇంటర్నెట్ కనెక్షన్ సమస్య ఏర్పడింది. దయచేసి మీ నెట్‌వర్క్‌ను తనిఖీ చేసి మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
  AUTHENTICATION_REQUIRED: {
    en: 'Your session has expired. Please sign in again.',
    te: 'మీ సెషన్ ముగిసింది. దయచేసి మళ్ళీ సైన్ ఇన్ చేయండి.',
    action: 'login',
    retryable: false,
  },
  FORBIDDEN: {
    en: "You don't have access to this information.",
    te: 'ఈ సమాచారాన్ని వీక్షించడానికి మీకు అనుమతి లేదు.',
    action: 'refresh',
    retryable: false,
  },
  VALIDATION_ERROR: {
    en: 'Some information is missing or incomplete. Please check your input and try again.',
    te: 'కొంత సమాచారం అసంపూర్తిగా ఉంది. దయచేసి వివరాలను పరిశీలించి మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: false,
  },
  RATE_LIMITED: {
    en: "You're sending requests too quickly. Please wait a moment and try again.",
    te: 'అభ్యర్థనలు చాలా వేగంగా పంపబడ్డాయి. దయచేసి కొద్దిసేపు వేచి ఉండి మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
  REQUEST_TIMEOUT: {
    en: 'The request is taking longer than expected. Please try again.',
    te: 'అభ్యర్థన ఊహించిన దాని కంటే ఎక్కువ సమయం తీసుకుంటోంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
  INTERNAL_ERROR: {
    en: 'Something went wrong on our end. Please try refreshing or try again shortly.',
    te: 'మా వైపు సాంకేతిక సమస్య ఏర్పడింది. దయచేసి పేజీని రీఫ్రెష్ చేయండి లేదా కాసేపటి తర్వాత ప్రయత్నించండి.',
    action: 'refresh',
    retryable: true,
  },
  UNKNOWN_ERROR: {
    en: 'Something went wrong. Please try again shortly.',
    te: 'సాంకేతిక సమస్య ఏర్పడింది. దయచేసి కాసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.',
    action: 'retry',
    retryable: true,
  },
};

/**
 * Normalizes any error (Axios, Fetch, backend JSON, AbortError, Error)
 * into a structured, safe AppError.
 */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  // 1. Check if it is a structured backend API error response
  const maybeObj = err as any;
  const backendError = maybeObj?.error || maybeObj?.response?.data?.error;
  const correlationId = backendError?.correlation_id || maybeObj?.correlationId;
  const statusCode = maybeObj?.status || maybeObj?.statusCode || maybeObj?.response?.status;

  if (backendError && backendError.code && ERROR_DEFINITIONS[backendError.code as AppErrorCode]) {
    const code = backendError.code as AppErrorCode;
    const def = ERROR_DEFINITIONS[code];
    return new AppError({
      code,
      message: backendError.message || def.en,
      userMessageEn: backendError.message || def.en,
      userMessageTe: def.te,
      retryable: typeof backendError.retryable === 'boolean' ? backendError.retryable : def.retryable,
      action: def.action,
      correlationId,
      statusCode,
    });
  }

  // 2. Check HTTP status code mapping
  if (statusCode === 401) {
    const def = ERROR_DEFINITIONS.AUTHENTICATION_REQUIRED;
    return new AppError({
      code: 'AUTHENTICATION_REQUIRED',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: false,
      action: 'login',
      correlationId,
      statusCode: 401,
    });
  }

  if (statusCode === 403) {
    const def = ERROR_DEFINITIONS.FORBIDDEN;
    return new AppError({
      code: 'FORBIDDEN',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: false,
      action: 'refresh',
      correlationId,
      statusCode: 403,
    });
  }

  if (statusCode === 429) {
    const def = ERROR_DEFINITIONS.RATE_LIMITED;
    return new AppError({
      code: 'RATE_LIMITED',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: true,
      action: 'retry',
      correlationId,
      statusCode: 429,
    });
  }

  if (statusCode === 503 || statusCode === 502) {
    const def = ERROR_DEFINITIONS.AI_UNAVAILABLE;
    return new AppError({
      code: 'AI_UNAVAILABLE',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: true,
      action: 'retry',
      correlationId,
      statusCode,
    });
  }

  // 3. Check browser/fetch errors (Network, Abort, Timeout)
  const rawMsg = String(maybeObj?.message || maybeObj || '').toLowerCase();

  if (
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('networkerror') ||
    rawMsg.includes('net::err') ||
    rawMsg.includes('offline') ||
    rawMsg.includes('load failed')
  ) {
    const def = ERROR_DEFINITIONS.NETWORK_ERROR;
    return new AppError({
      code: 'NETWORK_ERROR',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: true,
      action: 'retry',
    });
  }

  if (
    rawMsg.includes('timeout') ||
    rawMsg.includes('timed out') ||
    rawMsg.includes('aborterror') ||
    rawMsg.includes('signal is aborted')
  ) {
    const def = ERROR_DEFINITIONS.REQUEST_TIMEOUT;
    return new AppError({
      code: 'REQUEST_TIMEOUT',
      message: def.en,
      userMessageEn: def.en,
      userMessageTe: def.te,
      retryable: true,
      action: 'retry',
    });
  }

  // 4. Voice-specific failures
  if (rawMsg.includes('not-allowed') || rawMsg.includes('permission denied')) {
    return new AppError({
      code: 'VOICE_UNAVAILABLE',
      message: 'Microphone access is turned off. Please allow microphone access to use voice.',
      userMessageEn: 'Microphone access is turned off. Please allow microphone access to use voice.',
      userMessageTe: 'మైక్రోఫోన్ అనుమతి నిలిపివేయబడింది. వాయిస్ ఉపయోగించడానికి దయచేసి మైక్రోఫోన్ అనుమతిని ఇవ్వండి.',
      retryable: false,
      action: 'type_question',
    });
  }

  // 5. Default internal/unknown fallback
  const def = ERROR_DEFINITIONS.UNKNOWN_ERROR;
  return new AppError({
    code: 'UNKNOWN_ERROR',
    message: def.en,
    userMessageEn: def.en,
    userMessageTe: def.te,
    retryable: true,
    action: 'refresh',
    correlationId,
    statusCode,
  });
}
