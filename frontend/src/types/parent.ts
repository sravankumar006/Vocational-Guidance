/**
 * TypeScript definitions for the Parent domain and Child Context Dashboard (Phase 5 Brick 27).
 * Consumes /api/parent/* endpoints.
 */

export interface ParentChildCareer {
  id: number;
  title: string;
  sector?: string | null;
  is_selected: boolean;
  source: 'selected' | 'recommendation' | 'intent';
}

export interface ParentChildContext {
  has_linked_student: boolean;
  student_id?: number | null;
  child_name?: string | null;
  relationship_type?: string | null;
  education_level?: string | null;
  location?: string | null;
  career?: ParentChildCareer | null;
  career_status_text: string;
  message?: string | null;
}

export type ParentQuestionTopic =
  | 'income'
  | 'job_security'
  | 'further_education'
  | 'career_growth'
  | 'work_near_home'
  | 'talk_to_ai';

export interface ParentQuestionAction {
  id: ParentQuestionTopic;
  title: string;
  description: string;
  question: string | null;
  intent?: string;
}

/**
 * 8 Exact Canonical Parent Concern Categories (Phase 5 Brick 28).
 */
export type ParentConcernCategory =
  | 'Income'
  | 'Job Security'
  | 'Further Education'
  | 'Social Perception'
  | 'Distance'
  | 'Working Conditions'
  | 'Career Growth'
  | 'Other';

export interface CreateParentConcernPayload {
  concern_type: ParentConcernCategory | string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ParentConcernItem {
  id: number;
  parent_profile_id: number;
  student_profile_id?: number | null;
  concern_type: string;
  description?: string | null;
  severity: string;
  status: string;
  created_at: string;
}

export interface ParentConcernCardDef {
  category: ParentConcernCategory;
  intent: string;
  titleKey: string;
  subtitleKey: string;
  questionKey: string;
  iconName: string;
  accentColor: string;
}
