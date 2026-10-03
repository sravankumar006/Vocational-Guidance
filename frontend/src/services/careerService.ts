/**
 * Career Exploration API service layer (Phase 3 Bricks 12 & 13).
 * Interacts with /api/careers and /api/student/career-intent.
 * Never calls fetch() or axios() directly in React components.
 */

import { apiClient } from '@/lib/apiClient';
import {
  CareerSearchResponse,
  CareerSearchParams,
  CareerDetail,
  CareerFilterOptions,
  CareerIntent,
  CareerRecommendationsResponse,
} from '@/types/career';

const MOCK_INTENT_KEY = 'sih_mock_career_intent';

export const careerService = {
  /**
   * Search and filter vocational careers backed by the real MSDE/NSDC database.
   */
  async searchCareers(params: CareerSearchParams = {}): Promise<CareerSearchResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.sector) query.set('sector', params.sector);
    if (params.education) query.set('education', params.education);
    if (params.duration) query.set('duration', params.duration);
    if (params.location) query.set('location', params.location);
    if (params.min_salary !== undefined && params.min_salary > 0) {
      query.set('min_salary', params.min_salary.toString());
    }
    if (params.max_salary !== undefined && params.max_salary > 0) {
      query.set('max_salary', params.max_salary.toString());
    }
    if (params.min_placement_rate !== undefined && params.min_placement_rate > 0) {
      query.set('min_placement_rate', params.min_placement_rate.toString());
    }
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());

    const queryString = query.toString();
    const endpoint = `/api/careers${queryString ? `?${queryString}` : ''}`;

    return apiClient<CareerSearchResponse>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Fetch detailed vocational pathway, related courses, and empirical metrics for a career.
   */
  async getCareerDetail(careerId: number): Promise<CareerDetail> {
    return apiClient<CareerDetail>(`/api/careers/${careerId}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch available filter choices directly derived from active database records.
   */
  async getFilterOptions(): Promise<CareerFilterOptions> {
    return apiClient<CareerFilterOptions>('/api/careers/meta/filters', {
      method: 'GET',
    });
  },

  /**
   * Retrieve the authenticated student's saved career exploration intent.
   */
  async getCareerIntent(): Promise<{ career_intent: CareerIntent | null }> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      const stored = localStorage.getItem(MOCK_INTENT_KEY);
      return { career_intent: (stored as CareerIntent) || null };
    }

    return apiClient<{ career_intent: CareerIntent | null }>('/api/student/career-intent', {
      method: 'GET',
    });
  },

  /**
   * Persistently update the student's career exploration intent.
   */
  async saveCareerIntent(intent: CareerIntent): Promise<{ career_intent: CareerIntent; message: string }> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      localStorage.setItem(MOCK_INTENT_KEY, intent);
      return { career_intent: intent, message: 'Career intent saved successfully' };
    }

    return apiClient<{ career_intent: CareerIntent; message: string }>('/api/student/career-intent', {
      method: 'PUT',
      body: JSON.stringify({ career_intent: intent }),
    });
  },

  /**
   * Fetch deterministic Top 3 career recommendations for authenticated student.
   * Derived from structured profile attributes and empirical database records.
   */
  async getRecommendations(): Promise<CareerRecommendationsResponse> {
    const token = localStorage.getItem('sih_auth_token');
    if (token && token.startsWith('mock-')) {
      return {
        recommendations: [
          {
            career: {
              id: 11,
              name: 'Electrician',
              sector: 'Electrical',
              description: 'Installs, maintains, and repairs electrical power systems and wiring.',
              common_roles: ['Electrician', 'Wireman', 'Panel Assembler'],
              self_employment: 'High',
              salary_min: 7000,
              salary_max: 24000,
              salary_currency: 'INR',
              average_placement_rate: 79.3,
              qualification_levels: ['NSQF Level 3'],
              training_durations: ['3 Months', '5 Months'],
              courses_count: 5,
              providers_count: 5,
              top_regions: ['Rajasthan', 'Karnataka', 'Andhra Pradesh'],
              source: 'Ministry of Skill Development & Entrepreneurship (MSDE) / NSDC',
            },
            compatibility_score: 91,
            matched_factors: [
              {
                factor: 'interests',
                result: 'strong_match',
                summary: 'Direct alignment with your selected interest in Electrical & Technology.',
                score: 1.0,
              },
              {
                factor: 'education',
                result: 'compatible',
                summary: 'Your secondary qualification meets entry requirements for NSQF Level 3.',
                score: 0.85,
              },
              {
                factor: 'employment',
                result: 'strong_match',
                summary: 'High self-employment and contractor opportunities (79.3% placement record).',
                score: 0.95,
              },
            ],
            mismatched_factors: [],
            unknown_factors: [
              {
                factor: 'salary',
                result: 'salary_preference_unspecified',
                summary: 'Salary preference not specified in profile',
                score: null,
              },
            ],
          },
          {
            career: {
              id: 6,
              name: 'Electronics Technician',
              sector: 'Electronics',
              description: 'Assembles, maintains, and troubleshoots electronic equipment and appliances.',
              common_roles: ['Electronics Technician', 'Hardware Assembler'],
              self_employment: 'Medium',
              salary_min: 8000,
              salary_max: 28500,
              salary_currency: 'INR',
              average_placement_rate: 73.6,
              qualification_levels: ['NSQF Level 3'],
              training_durations: ['4 Months', '5 Months'],
              courses_count: 5,
              providers_count: 5,
              top_regions: ['Rajasthan', 'Kerala'],
              source: 'Ministry of Skill Development & Entrepreneurship (MSDE) / NSDC',
            },
            compatibility_score: 84,
            matched_factors: [
              {
                factor: 'interests',
                result: 'good_match',
                summary: 'Good alignment with your vocational skills in Basic Electricals.',
                score: 0.85,
              },
              {
                factor: 'education',
                result: 'compatible',
                summary: 'Your education qualifies for this trade.',
                score: 0.85,
              },
            ],
            mismatched_factors: [],
            unknown_factors: [],
          },
          {
            career: {
              id: 4,
              name: 'Automotive Service Technician',
              sector: 'Automotive',
              description: 'Performs servicing and maintenance on commercial and domestic motor vehicles.',
              common_roles: ['Auto Technician', 'Service Advisor'],
              self_employment: 'Medium',
              salary_min: 8000,
              salary_max: 29500,
              salary_currency: 'INR',
              average_placement_rate: 75.4,
              qualification_levels: ['NSQF Level 3'],
              training_durations: ['5 Months', '6 Months'],
              courses_count: 5,
              providers_count: 5,
              top_regions: ['Rajasthan', 'Karnataka'],
              source: 'Ministry of Skill Development & Entrepreneurship (MSDE) / NSDC',
            },
            compatibility_score: 79,
            matched_factors: [
              {
                factor: 'interests',
                result: 'good_match',
                summary: 'Matches your interest in Automotive.',
                score: 0.85,
              },
            ],
            mismatched_factors: [
              {
                factor: 'training',
                result: 'longer_duration',
                summary: 'Duration (6 Months) is slightly longer than fast-track preference.',
                score: 0.5,
              },
            ],
            unknown_factors: [],
          },
        ],
        weights_used: {
          education: 0.25,
          interests: 0.25,
          location: 0.15,
          salary: 0.15,
          training: 0.1,
          employment: 0.1,
        },
        algorithm: 'deterministic_compatibility_v1',
      };
    }

    return apiClient<CareerRecommendationsResponse>('/api/careers/recommendations', {
      method: 'GET',
    });
  },
};
