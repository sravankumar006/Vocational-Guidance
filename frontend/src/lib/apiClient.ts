/**
 * Base HTTP client configured with environment variables, authorization persistence,
 * and fast-failing timeouts to prevent UI hang on offline backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 10000;

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

  const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms. The server may be busy or offline.`));
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
  } catch (err: any) {
    if (err.name === 'AbortError' || (err.message && err.message.includes('aborted'))) {
      throw new Error('Connection timed out. The backend server might be offline or slow to respond.');
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify it is running on port 8000.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { API_BASE_URL };
