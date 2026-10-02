/**
 * Base HTTP client configured with environment variables, authorization persistence,
 * and fast-failing timeouts to prevent UI hang on offline backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 2500;

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('sih_auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Fast timeout to guarantee UI navigation is never blocked
  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || response.statusText;
      } catch {
        const errorText = await response.text().catch(() => '');
        if (errorText) errorDetail = errorText;
      }
      throw new Error(errorDetail || `API Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
