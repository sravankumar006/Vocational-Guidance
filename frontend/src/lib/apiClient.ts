/**
 * Centralized API Client (Phase 9 Brick 33).
 *
 * Provides:
 * - Safe response normalization using AppError
 * - Correlation ID tracking
 * - Bounded retry strategy for idempotent (GET) requests
 * - Non-leaking error transformations
 */

import { normalizeError } from '@/utils/errors';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://margadharshak.onrender.com';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 60000;
const MAX_IDEMPOTENT_RETRIES = 2;
const RETRY_DELAY_MS = 400;

export interface ApiClientOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiClient<T>(
  endpoint: string,
  options?: ApiClientOptions
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = (options?.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || options?.retry === true;
  const maxRetries = options?.maxRetries ?? (isIdempotent ? MAX_IDEMPOTENT_RETRIES : 0);

  let attempt = 0;

  while (true) {
    attempt++;
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('sih_auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        credentials: options?.credentials || 'include',
        ...options,
        signal: options?.signal || controller.signal,
        headers: {
          ...defaultHeaders,
          ...options?.headers,
        },
      });

      const correlationId = response.headers.get('X-Correlation-ID') || undefined;

      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text().catch(() => '');
          errorData = { message: text || response.statusText };
        }

        const normalized = normalizeError({
          statusCode: response.status,
          correlationId,
          error: errorData?.error,
          message: errorData?.detail || errorData?.message || response.statusText,
        });

        // Retry only if retryable and under retry limit for safe requests
        if (attempt <= maxRetries && (response.status >= 500 || response.status === 429)) {
          clearTimeout(timeoutId);
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }

        throw normalized;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      const normalized = normalizeError(err);

      // Retry network or timeout failures for idempotent requests
      if (attempt <= maxRetries && isIdempotent && normalized.retryable) {
        clearTimeout(timeoutId);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      throw normalized;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export { API_BASE_URL };
