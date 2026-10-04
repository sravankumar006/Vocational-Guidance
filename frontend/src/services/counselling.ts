/**
 * Counselling domain API service layer (Phase 5 Bricks 20, 21 & 22).
 * Consumes /api/counselling/* endpoints using the centralized apiClient.
 * Never executes unauthenticated or direct fetch() calls inside React components.
 */

import { apiClient } from '@/lib/apiClient';
import type {
  CounsellingResponse,
  CounsellingSessionSummary,
  CounsellingSessionDetail,
  CreateCounsellingSessionRequest,
  SendCounsellingMessageRequest,
  CreateEscalationRequest,
  EscalationResponse,
} from '@/types/counselling';

const MOCK_SESSIONS_STORAGE_KEY = 'sih_mock_counselling_sessions';
const MOCK_MESSAGES_STORAGE_KEY = 'sih_mock_counselling_messages_';

export const counsellingService = {
  /**
   * Retrieves all counselling sessions for the authenticated student context.
   */
  async listSessions(): Promise<CounsellingSessionSummary[]> {
    const token = localStorage.getItem('sih_auth_token');

    // Offline developer mode fallback if running with mock session token
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem(MOCK_SESSIONS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback to initial mock
        }
      }
      const initial: CounsellingSessionSummary[] = [
        {
          id: 1,
          student_profile_id: 1,
          status: 'active',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          ended_at: null,
          message_count: 2,
          last_message_preview: 'Electrician trade training requires 12 months at Government ITI.',
        },
      ];
      localStorage.setItem(MOCK_SESSIONS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    return apiClient<CounsellingSessionSummary[]>('/api/counselling/sessions');
  },

  /**
   * Fetches full chronological message details for a specific session.
   */
  async getSession(sessionId: number): Promise<CounsellingSessionDetail> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const storedMsgs = localStorage.getItem(`${MOCK_MESSAGES_STORAGE_KEY}${sessionId}`);
      if (storedMsgs) {
        try {
          return {
            id: sessionId,
            student_profile_id: 1,
            status: 'active',
            started_at: new Date().toISOString(),
            ended_at: null,
            messages: JSON.parse(storedMsgs),
          };
        } catch {
          // fallback
        }
      }
      return {
        id: sessionId,
        student_profile_id: 1,
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
        messages: [
          {
            id: 101,
            session_id: sessionId,
            sender_type: 'student',
            content: 'What are the course requirements for becoming an electrician?',
            created_at: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: 102,
            session_id: sessionId,
            sender_type: 'ai',
            content:
              'To become a certified Electrician in India, you typically complete a 12-to-24 month accredited program at a Government or Private ITI under NSQF Level 4.\n\n### Key Requirements\n- **Eligibility:** Class 10 passed with Science and Mathematics.\n- **Accreditation:** NCVT / SCVT approved curriculum.\n- **Practical Training:** Workshop safety, domestic house wiring, transformers, industrial control panels, and earthing installation.\n\nStarting entry-level monthly wages range from ₹12,000 to ₹26,000 depending on region and enterprise.',
            created_at: new Date(Date.now() - 1700000).toISOString(),
          },
        ],
      };
    }

    return apiClient<CounsellingSessionDetail>(`/api/counselling/sessions/${sessionId}`);
  },

  /**
   * Initiates a new counselling session, optionally passing an initial inquiry.
   */
  async createSession(payload?: CreateCounsellingSessionRequest): Promise<CounsellingSessionDetail> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const newId = Date.now();
      const newSession: CounsellingSessionSummary = {
        id: newId,
        student_profile_id: 1,
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
        message_count: payload?.initial_question ? 2 : 0,
        last_message_preview: payload?.initial_question || 'New Session',
      };

      const existingSessions = await this.listSessions();
      localStorage.setItem(MOCK_SESSIONS_STORAGE_KEY, JSON.stringify([newSession, ...existingSessions]));

      const initialMsgs = [];
      if (payload?.initial_question) {
        initialMsgs.push(
          {
            id: newId + 1,
            session_id: newId,
            sender_type: 'student' as const,
            content: payload.initial_question,
            created_at: new Date().toISOString(),
          },
          {
            id: newId + 2,
            session_id: newId,
            sender_type: 'ai' as const,
            content: 'Hello! I am your vocational guidance counselor. How can I assist you with your career and training choices today?',
            created_at: new Date().toISOString(),
          }
        );
      }
      localStorage.setItem(`${MOCK_MESSAGES_STORAGE_KEY}${newId}`, JSON.stringify(initialMsgs));

      return {
        id: newId,
        student_profile_id: 1,
        status: 'active',
        started_at: newSession.started_at,
        ended_at: null,
        messages: initialMsgs,
      };
    }

    return apiClient<CounsellingSessionDetail>('/api/counselling/sessions', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      timeout: 60000,
    });
  },

  /**
   * Posts a student question to the active session and receives the canonical CounsellingResponse.
   */
  async sendMessage(sessionId: number, payload: SendCounsellingMessageRequest): Promise<CounsellingResponse> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      // Mock response adhering strictly to Brick 21 canonical shape
      const mockResponse: CounsellingResponse = {
        message: `### Guidance on: ${payload.message}\n\nBased on verified National Skills Qualification Framework (NSQF) records, technical vocational trades provide strong foundational skills and clear career ladders.\n\n- **Accredited Training:** Government ITIs and NSTIs offer certified coursework with hands-on workshop training.\n- **Entry Requirements:** Secondary school completion (Class 10th).\n- **Placement Statistics:** Recorded historical batch placement rates average 75% to 85% in regional industrial corridors.\n\nAlways verify local center seat availability with your district vocational office.`,
        language: payload.language || 'en',
        career: {
          id: 1,
          title: 'Electrician',
          description: 'Specializes in electrical wiring, machinery maintenance, and industrial power distribution.',
          compatibility_score: 85,
          reasons: ['Education level matches entry requirements', 'High regional demand in your state'],
        },
        evidence: [
          {
            id: 'occ:1',
            type: 'occupation',
            title: 'Electrician (General)',
            content: 'Installs, tests, and maintains electrical wiring, control panels, and related electrical fixtures.',
            relevance: 0.89,
            verified: true,
            source: 'Ministry of Skill Development & Entrepreneurship (MSDE)',
            source_url: 'https://www.nqr.gov.in',
          },
          {
            id: 'crs:101',
            type: 'course',
            title: 'Craftsmen Training Scheme - Electrician Trade',
            content: 'Two-year technical curriculum covering safety rules, circuits, AC/DC machines, and wiring standards.',
            relevance: 0.84,
            verified: true,
            source: 'Directorate General of Training (DGT)',
            source_url: 'https://dgt.gov.in',
          },
        ],
        career_path: [
          {
            step: 1,
            title: 'Apprentice / Trainee Electrician',
            description: 'Hands-on practical training in workshop tools, circuit testing, and safety protocols.',
            course_id: null,
          },
          {
            step: 2,
            title: 'Certified Electrician (NSQF Level 4)',
            description: 'Independent installation of domestic wiring, meters, and sub-distribution boards.',
            course_id: null,
          },
          {
            step: 3,
            title: 'Industrial Electrical Technician',
            description: 'Maintenance of motor control centers, three-phase transformers, and PLC systems.',
            course_id: null,
          },
          {
            step: 4,
            title: 'Electrical Contractor / Supervisor',
            description: 'Licensed supervisor overseeing commercial electrical contracts and apprentice trainees.',
            course_id: null,
          },
        ],
        suggested_questions: [
          'What are the eligibility requirements for this course?',
          'Which government ITIs offer this trade in my state?',
          'What is the typical starting wage after graduation?',
          'How do I apply for apprentice training?',
        ],
        confidence: 0.88,
        requires_human: payload.message.toLowerCase().includes('counsellor') || payload.message.toLowerCase().includes('human'),
        sources: [
          {
            title: 'National Qualification Register - Electrician',
            source: 'MSDE / NCVET',
            url: 'https://www.nqr.gov.in',
            type: 'statutory_registry',
          },
          {
            title: 'Directorate General of Training Syllabus',
            source: 'Ministry of Skill Development & Entrepreneurship',
            url: 'https://dgt.gov.in',
            type: 'curriculum',
          },
        ],
        session_id: sessionId,
        created_at: new Date().toISOString(),
      };

      // Store in mock storage
      const detail = await this.getSession(sessionId);
      const updatedMsgs = [
        ...detail.messages,
        {
          id: Date.now(),
          session_id: sessionId,
          sender_type: 'student' as const,
          content: payload.message,
          created_at: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          session_id: sessionId,
          sender_type: 'ai' as const,
          content: mockResponse.message,
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`${MOCK_MESSAGES_STORAGE_KEY}${sessionId}`, JSON.stringify(updatedMsgs));

      return mockResponse;
    }

    return apiClient<CounsellingResponse>(`/api/counselling/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
      timeout: 60000,
    });
  },

  /**
   * Submits a human counsellor escalation request (Phase 9 Brick 31).
   */
  async createEscalation(payload: CreateEscalationRequest): Promise<EscalationResponse> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem('sih_mock_escalations');
      const existing: EscalationResponse[] = stored ? JSON.parse(stored) : [];
      // check active
      const active = existing.find(e => e.status === 'pending' || e.status === 'in_progress');
      if (active) return active;

      const newEsc: EscalationResponse = {
        id: Date.now(),
        student_id: 1,
        parent_id: token.includes('parent') ? 1 : null,
        career_id: payload.career_id || 1,
        career_title: 'Automobile Technician',
        counselling_session_id: payload.session_id || 1,
        concern: payload.concern || 'Income',
        language: payload.language || 'en',
        conversation_summary: 'User requested human counsellor consultation for personalized vocational guidance.',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      existing.unshift(newEsc);
      localStorage.setItem('sih_mock_escalations', JSON.stringify(existing));
      return newEsc;
    }

    return apiClient<EscalationResponse>('/api/counselling/escalations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves all escalation cases for the current authenticated user context.
   */
  async listEscalations(): Promise<EscalationResponse[]> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem('sih_mock_escalations');
      return stored ? JSON.parse(stored) : [];
    }
    return apiClient<EscalationResponse[]>('/api/counselling/escalations');
  },

  /**
   * Retrieves a specific escalation case by ID.
   */
  async getEscalation(id: number): Promise<EscalationResponse> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem('sih_mock_escalations');
      const existing: EscalationResponse[] = stored ? JSON.parse(stored) : [];
      const found = existing.find(e => e.id === id);
      if (found) return found;
    }
    return apiClient<EscalationResponse>(`/api/counselling/escalations/${id}`);
  },
};

export default counsellingService;
