/**
 * Admin Human Escalation Management Service (A8 — Human Escalation Management).
 * Communicates with /api/admin/escalations endpoints.
 */

import { apiClient } from '@/lib/apiClient';
import type {
  AdminEscalationsPaginatedResponse,
  EscalationDetailItem,
  EscalationFilterParams,
  EscalationStatusUpdateRequest,
} from '@/types/adminEscalation';

function buildQuery(params?: EscalationFilterParams): string {
  if (!params) return '?page=1&page_size=10';
  const searchParams = new URLSearchParams();

  // Always supply page and page_size to get structured paginated response
  searchParams.append('page', (params.page || 1).toString());
  searchParams.append('page_size', (params.page_size || 10).toString());

  if (params.search && params.search.trim()) {
    searchParams.append('search', params.search.trim());
  }
  if (params.status && params.status !== 'all') {
    searchParams.append('status', params.status);
  }
  if (params.language && params.language !== 'all') {
    searchParams.append('language', params.language);
  }
  if (params.concern && params.concern !== 'all') {
    searchParams.append('concern', params.concern);
  }
  if (params.career && params.career !== 'all') {
    searchParams.append('career', params.career);
  }
  if (params.start_date) {
    searchParams.append('start_date', params.start_date);
  }
  if (params.end_date) {
    searchParams.append('end_date', params.end_date);
  }
  if (params.sort) {
    searchParams.append('sort', params.sort);
  }

  return `?${searchParams.toString()}`;
}

export const adminEscalationService = {
  /**
   * Retrieves paginated escalations list with search, status filters, and stats.
   */
  async getEscalations(params?: EscalationFilterParams): Promise<AdminEscalationsPaginatedResponse> {
    return await apiClient<AdminEscalationsPaginatedResponse>(`/api/admin/escalations${buildQuery(params)}`);
  },

  /**
   * Retrieves full context for a specific escalation case including messages.
   */
  async getEscalation(id: number): Promise<EscalationDetailItem> {
    return await apiClient<EscalationDetailItem>(`/api/admin/escalations/${id}`);
  },

  /**
   * Transitions status (Pending -> In Progress -> Resolved) with server validation.
   */
  async updateStatus(id: number, payload: EscalationStatusUpdateRequest): Promise<EscalationDetailItem> {
    return await apiClient<EscalationDetailItem>(`/api/admin/escalations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
