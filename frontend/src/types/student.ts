/**
 * TypeScript definitions for the Student Portal, Dashboard, and Progressive Profile (Phase 3 Bricks 10 & 11).
 */

export interface StudentProfileSummary {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  education_level?: string | null;
  education_stream?: string | null;
  location?: string | null;
  interests: string[];
  skills: string[];
  profile_completion_percentage: number;
}

export interface CurrentCareerInfo {
  id: number;
  name: string;
  sector?: string | null;
  description?: string | null;
}

export interface RecommendedCareerInfo {
  id: number;
  name: string;
  sector?: string | null;
  match_reason?: string | null;
}

import type { CounsellingSessionSummary } from './counselling';


export interface FamilyStatusInfo {
  has_linked_parent: boolean;
  parent_name?: string | null;
  relationship_type?: string | null;
  linked_at?: string | null;
}

export interface StudentDashboardData {
  profile: StudentProfileSummary;
  current_career: CurrentCareerInfo | null;
  recommended_careers: RecommendedCareerInfo[];
  latest_counselling_session: CounsellingSessionSummary | null;
  family_status: FamilyStatusInfo;
}

export interface StudentProfileDetail {
  id: number;
  user_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  location?: string | null;
  education_level?: string | null;
  education_stream?: string | null;
  institution?: string | null;
  academic_strengths: string[];
  household_income_range?: string | null;
  interests: string[];
  skills: string[];
  work_location_preferences: string[];
  career_preferences: string[];
  profile_completion_percentage: number;
  section_completion: {
    about_you: boolean;
    education: boolean;
    family_context: boolean;
    interests: boolean;
    work_preferences: boolean;
  };
}

export interface StudentProfileUpdatePayload {
  name?: string;
  age?: number | null;
  location?: string | null;
  education_level?: string | null;
  education_stream?: string | null;
  institution?: string | null;
  academic_strengths?: string[];
  household_income_range?: string | null;
  interests?: string[];
  skills?: string[];
  work_location_preferences?: string[];
  career_preferences?: string[];
}
