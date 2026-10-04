/**
 * Parent domain API service layer (Phase 5 Brick 27).
 * Interacts with /api/parent/* endpoints.
 * Never calls raw fetch() or axios() directly in React components.
 */

import { apiClient } from '@/lib/apiClient';
import type { ParentChildContext } from '@/types/parent';

const MOCK_CHILD_STORAGE_KEY = 'sih_mock_parent_child_context';

export const parentService = {
  /**
   * Retrieves the authorized child/student context for the authenticated parent.
   * Derived strictly from server-side ParentStudentAssociation records.
   */
  async getChildContext(): Promise<ParentChildContext> {
    const token = localStorage.getItem('sih_auth_token');

    // Offline developer mode fallback if running with mock session token
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem(MOCK_CHILD_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback to default mock
        }
      }

      const defaultMock: ParentChildContext = {
        has_linked_student: true,
        student_id: 1,
        child_name: 'Aarav Sharma',
        relationship_type: 'Mother',
        education_level: 'Class 10 Passed',
        location: 'Medak, Telangana',
        career: {
          id: 1,
          title: 'Automotive Service Technician',
          sector: 'Automotive',
          is_selected: false,
          source: 'recommendation',
        },
        career_status_text: 'Automotive Service Technician',
      };
      localStorage.setItem(MOCK_CHILD_STORAGE_KEY, JSON.stringify(defaultMock));
      return defaultMock;
    }

    return apiClient<ParentChildContext>('/api/parent/child', {
      method: 'GET',
    });
  },

  /**
   * Records an authentic parental concern or objection (Phase 5 Brick 28).
   */
  async saveConcern(payload: import('@/types/parent').CreateParentConcernPayload): Promise<import('@/types/parent').ParentConcernItem> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const mockItem: import('@/types/parent').ParentConcernItem = {
        id: Date.now(),
        parent_profile_id: 1,
        student_profile_id: 1,
        concern_type: payload.concern_type,
        description: payload.description || null,
        severity: payload.severity || 'medium',
        status: 'open',
        created_at: new Date().toISOString(),
      };
      const key = 'sih_mock_parent_concerns';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([mockItem, ...existing]));
      return mockItem;
    }

    return apiClient<import('@/types/parent').ParentConcernItem>('/api/parent/concerns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves all recorded concerns for the authenticated parent.
   */
  async listConcerns(): Promise<import('@/types/parent').ParentConcernItem[]> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const key = 'sih_mock_parent_concerns';
      return JSON.parse(localStorage.getItem(key) || '[]');
    }

    return apiClient<import('@/types/parent').ParentConcernItem[]>('/api/parent/concerns', {
      method: 'GET',
    });
  },
};
