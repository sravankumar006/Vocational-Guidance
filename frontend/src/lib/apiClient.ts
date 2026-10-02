/**
 * Base HTTP client configured with environment variables and authorization persistence.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('sih_auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
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
}

export { API_BASE_URL };
