/**
 * Student domain API service layer (Phase 3 Bricks 10 & 11).
 * All communication with backend /api/student/* endpoints goes through this service.
 * Never calls fetch() or axios() directly in React components.
 */

import { apiClient } from '@/lib/apiClient';
import {
  StudentDashboardData,
  StudentProfileDetail,
  StudentProfileUpdatePayload,
} from '@/types/student';

const MOCK_PROFILE_KEY = 'sih_mock_student_profile';

export const studentService = {
  /**
   * Fetches real, scoped dashboard context for the authenticated student.
   * Derived strictly from the session JWT on the backend.
   */
  async getDashboard(): Promise<StudentDashboardData> {
    const token = localStorage.getItem('sih_auth_token');

    // Offline developer mode fallback if running with mock session
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem('sih_auth_user');
      const user = stored ? JSON.parse(stored) : null;
      const storedProfile = localStorage.getItem(MOCK_PROFILE_KEY);
      const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;

      return {
        profile: {
          id: user?.student_id || 1,
          name: parsedProfile?.name || user?.name || 'Aarav Sharma',
          email: user?.email || 'student@sih.gov.in',
          phone: user?.phone || '+919876543210',
          education_level: parsedProfile?.education_level || user?.education_level || 'Class 10 Passed',
          education_stream: parsedProfile?.education_stream || 'General',
          location: parsedProfile?.location || `${user?.district || 'Medak'}, ${user?.state || 'Telangana'}`,
          interests: parsedProfile?.interests || ['Electronics', 'Automotive'],
          skills: parsedProfile?.skills || ['Basic Electricals', 'Problem Solving'],
          profile_completion_percentage: parsedProfile?.profile_completion_percentage || 60,
        },
        current_career: null,
        recommended_careers: [],
        latest_counselling_session: null,
        family_status: {
          has_linked_parent: true,
          parent_name: 'Sunita Sharma',
          relationship_type: 'Mother',
          linked_at: new Date().toISOString(),
        },
      };
    }

    return apiClient<StudentDashboardData>('/api/student/dashboard', {
      method: 'GET',
    });
  },

  /**
   * Fetches comprehensive progressive profile for the authenticated student.
   */
  async getProfile(): Promise<StudentProfileDetail> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem('sih_auth_user');
      const user = stored ? JSON.parse(stored) : null;
      const storedProfile = localStorage.getItem(MOCK_PROFILE_KEY);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }

      return {
        id: 1,
        user_id: user?.id || 1,
        name: user?.name || 'Aarav Sharma',
        email: user?.email || 'student@sih.gov.in',
        phone: user?.phone || '+919876543210',
        age: 17,
        location: `${user?.district || 'Medak'}, ${user?.state || 'Telangana'}, India`,
        education_level: 'Class 10 Passed',
        education_stream: 'General',
        institution: 'Government High School, Medak',
        academic_strengths: ['Mathematics', 'Science'],
        household_income_range: '₹1–3 lakh',
        interests: ['Technology', 'Skilled Trades', 'Automotive'],
        skills: ['Basic Electricals', 'Problem Solving'],
        work_location_preferences: ['Local / Near Home', 'Same State'],
        career_preferences: ['Technical / Hands-on', 'Skilled Trade'],
        profile_completion_percentage: 100,
        section_completion: {
          about_you: true,
          education: true,
          family_context: true,
          interests: true,
          work_preferences: true,
        },
      };
    }

    return apiClient<StudentProfileDetail>('/api/student/profile', {
      method: 'GET',
    });
  },

  /**
   * Partially updates one or more sections of the student profile.
   */
  async updateProfile(payload: StudentProfileUpdatePayload): Promise<StudentProfileDetail> {
    const token = localStorage.getItem('sih_auth_token');

    if (token && token.startsWith('mock-')) {
      const current = await this.getProfile();
      const updated = {
        ...current,
        ...payload,
      };
      // Recompute mock completion
      const s1 = bool(updated.name && updated.age && updated.location);
      const s2 = bool(updated.education_level && (updated.education_stream || updated.institution));
      const s3 = bool(updated.household_income_range);
      const s4 = bool(updated.interests && updated.interests.length > 0);
      const s5 = bool(
        (updated.work_location_preferences && updated.work_location_preferences.length > 0) ||
        (updated.career_preferences && updated.career_preferences.length > 0)
      );

      updated.section_completion = {
        about_you: s1,
        education: s2,
        family_context: s3,
        interests: s4,
        work_preferences: s5,
      };
      const count = [s1, s2, s3, s4, s5].filter(Boolean).length;
      updated.profile_completion_percentage = count * 20;

      localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    }

    return apiClient<StudentProfileDetail>('/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

function bool(val: any): boolean {
  return Boolean(val);
}

export default studentService;
