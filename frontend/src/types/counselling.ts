/**
 * Canonical Types for Vocational Guidance AI Counselling (Phase 5 Brick 21).
 * Mirrors backend Pydantic contracts in backend/schemas/counselling.py.
 */

export interface CounsellingCareer {
  id: number | null;
  title: string;
  description: string;
  compatibility_score: number | null;
  reasons: string[];
}

export interface CounsellingEvidenceItem {
  id: string;
  type: string;
  title: string;
  content: string;
  relevance: number;
  verified: boolean;
  source: string;
  source_url: string | null;
}

export interface CounsellingCareerPathStep {
  id?: string;
  step: number;
  title: string;
  description: string;
  duration?: string | null;
  qualification?: string | null;
  nsqf_level?: string | null;
  type?: 'education' | 'career' | 'further_education' | string | null;
  is_current?: boolean | null;
  course_id?: number | null;
}

export interface CounsellingSourceItem {
  title: string;
  source: string;
  url: string | null;
  type: string;
}

export interface CounsellingCareerMetrics {
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  salary_period?: string;
  experience_level?: string | null;
  salary_source?: string | null;
  salary_source_url?: string | null;
  placement_rate?: number | null;
  placement_period?: string | null;
  placement_source?: string | null;
  placement_source_url?: string | null;
  training_duration?: string | null;
  qualification?: string | null;
  nsqf_level?: string | null;
  training_type?: string | null;
  training_source?: string | null;
  training_source_url?: string | null;
  job_availability?: string | null;
  job_openings_count?: number | null;
  job_region?: string | null;
  job_availability_source?: string | null;
  job_availability_source_url?: string | null;
}

export interface CounsellingResponse {
  message: string;
  language: string;
  career: CounsellingCareer;
  evidence: CounsellingEvidenceItem[];
  career_path: CounsellingCareerPathStep[];
  further_education?: string[] | null;
  career_metrics?: CounsellingCareerMetrics | null;
  suggested_questions: string[];
  confidence: number;
  requires_human: boolean;
  sources: CounsellingSourceItem[];
  session_id?: number | null;
  created_at?: string | null;
}

export interface CounsellingMessageItem {
  id: number;
  session_id: number;
  sender_type: 'student' | 'parent' | 'ai' | 'counsellor' | 'system';
  content: string;
  created_at: string;
}

export interface CounsellingSessionSummary {
  id: number;
  student_profile_id?: number;
  status: string;
  started_at: string;
  ended_at?: string | null;
  message_count: number;
  last_message_preview?: string | null;
}

export interface CounsellingSessionDetail {
  id: number;
  student_profile_id: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  messages: CounsellingMessageItem[];
}

export type CounsellingIntent =
  | 'explain_career'
  | 'explain_course'
  | 'explain_provider'
  | 'explain_salary'
  | 'explain_placement'
  | 'explain_training'
  | 'explain_career_growth'
  | 'explain_job_availability'
  | 'explain_nsqf'
  | 'explain_further_education';

export type CounsellingEntityType =
  | 'career'
  | 'occupation'
  | 'course'
  | 'provider'
  | 'salary'
  | 'placement'
  | 'training'
  | 'pathway'
  | 'evidence';

export interface CounsellingContext {
  intent: CounsellingIntent;
  entity_type: CounsellingEntityType;
  entity_id: string | number;
  entity_title?: string;
}

export interface CreateCounsellingSessionRequest {
  student_id?: number | null;
  initial_question?: string | null;
  career_id?: number | null;
  language?: string | null;
  context?: CounsellingContext | null;
}

export interface SendCounsellingMessageRequest {
  message: string;
  career_id?: number | null;
  language?: string | null;
  context?: CounsellingContext | null;
}

export interface CreateEscalationRequest {
  session_id?: number | null;
  career_id?: number | null;
  concern?: string | null;
  language?: string | null;
  notes?: string | null;
}

export interface EscalationResponse {
  id: number;
  student_id?: number | null;
  parent_id?: number | null;
  career_id?: number | null;
  career_title?: string | null;
  counselling_session_id?: number | null;
  concern?: string | null;
  language: string;
  conversation_summary?: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

