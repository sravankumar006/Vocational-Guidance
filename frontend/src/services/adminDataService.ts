/**
 * Admin Data Management Service (A7 — Data Management).
 * Communicates with /api/admin/data endpoints for Courses, Occupations, Providers,
 * Outcomes, Career Paths, and Sources.
 */

import { apiClient } from '@/lib/apiClient';
import type {
  PaginatedResponse,
  DataStatsResponse,
  DataOptionsResponse,
  DataFilterParams,
  DataTabKey,
  CourseRecord,
  OccupationRecord,
  TrainingProviderRecord,
  JobOutcomeRecord,
  CareerPathRecord,
  DataSourceRecord,
  BulkActionResponse,
  ImportCsvResponse,
  RagSyncResponse,
} from '@/types/adminData';

function buildQuery(params?: DataFilterParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params.q) searchParams.append('q', params.q);
  if (params.status && params.status !== 'all') searchParams.append('status', params.status);
  if (params.sector) searchParams.append('sector', params.sector);
  if (params.occupation_id) searchParams.append('occupation_id', params.occupation_id.toString());
  if (params.career_path_id) searchParams.append('career_path_id', params.career_path_id.toString());
  if (params.provider_id) searchParams.append('provider_id', params.provider_id.toString());
  if (params.data_source_id) searchParams.append('data_source_id', params.data_source_id.toString());
  if (params.region) searchParams.append('region', params.region);

  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export const adminDataService = {
  // --------------------------------------------------------------------------
  // Global Stats & Options
  // --------------------------------------------------------------------------
  async getStats(): Promise<DataStatsResponse> {
    return await apiClient<DataStatsResponse>('/api/admin/data/stats');
  },

  async getOptions(): Promise<DataOptionsResponse> {
    return await apiClient<DataOptionsResponse>('/api/admin/data/options');
  },

  // --------------------------------------------------------------------------
  // Courses
  // --------------------------------------------------------------------------
  async getCourses(params?: DataFilterParams): Promise<PaginatedResponse<CourseRecord>> {
    return await apiClient<PaginatedResponse<CourseRecord>>(`/api/admin/data/courses${buildQuery(params)}`);
  },

  async getCourse(id: number): Promise<CourseRecord> {
    return await apiClient<CourseRecord>(`/api/admin/data/courses/${id}`);
  },

  async createCourse(payload: Partial<CourseRecord>): Promise<CourseRecord> {
    return await apiClient<CourseRecord>('/api/admin/data/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCourse(id: number, payload: Partial<CourseRecord>): Promise<CourseRecord> {
    return await apiClient<CourseRecord>(`/api/admin/data/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifyCourse(id: number): Promise<CourseRecord> {
    return await apiClient<CourseRecord>(`/api/admin/data/courses/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateCourse(id: number): Promise<CourseRecord> {
    return await apiClient<CourseRecord>(`/api/admin/data/courses/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateCourse(id: number): Promise<CourseRecord> {
    return await apiClient<CourseRecord>(`/api/admin/data/courses/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Occupations
  // --------------------------------------------------------------------------
  async getOccupations(params?: DataFilterParams): Promise<PaginatedResponse<OccupationRecord>> {
    return await apiClient<PaginatedResponse<OccupationRecord>>(`/api/admin/data/occupations${buildQuery(params)}`);
  },

  async getOccupation(id: number): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>(`/api/admin/data/occupations/${id}`);
  },

  async createOccupation(payload: Partial<OccupationRecord>): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>('/api/admin/data/occupations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateOccupation(id: number, payload: Partial<OccupationRecord>): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>(`/api/admin/data/occupations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifyOccupation(id: number): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>(`/api/admin/data/occupations/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateOccupation(id: number): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>(`/api/admin/data/occupations/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateOccupation(id: number): Promise<OccupationRecord> {
    return await apiClient<OccupationRecord>(`/api/admin/data/occupations/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Training Providers
  // --------------------------------------------------------------------------
  async getProviders(params?: DataFilterParams): Promise<PaginatedResponse<TrainingProviderRecord>> {
    return await apiClient<PaginatedResponse<TrainingProviderRecord>>(`/api/admin/data/providers${buildQuery(params)}`);
  },

  async getProvider(id: number): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>(`/api/admin/data/providers/${id}`);
  },

  async createProvider(payload: Partial<TrainingProviderRecord>): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>('/api/admin/data/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProvider(id: number, payload: Partial<TrainingProviderRecord>): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>(`/api/admin/data/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifyProvider(id: number): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>(`/api/admin/data/providers/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateProvider(id: number): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>(`/api/admin/data/providers/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateProvider(id: number): Promise<TrainingProviderRecord> {
    return await apiClient<TrainingProviderRecord>(`/api/admin/data/providers/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Job Outcomes
  // --------------------------------------------------------------------------
  async getOutcomes(params?: DataFilterParams): Promise<PaginatedResponse<JobOutcomeRecord>> {
    return await apiClient<PaginatedResponse<JobOutcomeRecord>>(`/api/admin/data/outcomes${buildQuery(params)}`);
  },

  async getOutcome(id: number): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>(`/api/admin/data/outcomes/${id}`);
  },

  async createOutcome(payload: Partial<JobOutcomeRecord>): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>('/api/admin/data/outcomes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateOutcome(id: number, payload: Partial<JobOutcomeRecord>): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>(`/api/admin/data/outcomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifyOutcome(id: number): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>(`/api/admin/data/outcomes/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateOutcome(id: number): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>(`/api/admin/data/outcomes/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateOutcome(id: number): Promise<JobOutcomeRecord> {
    return await apiClient<JobOutcomeRecord>(`/api/admin/data/outcomes/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Career Paths
  // --------------------------------------------------------------------------
  async getCareerPaths(params?: DataFilterParams): Promise<PaginatedResponse<CareerPathRecord>> {
    return await apiClient<PaginatedResponse<CareerPathRecord>>(`/api/admin/data/career-paths${buildQuery(params)}`);
  },

  async getCareerPath(id: number): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>(`/api/admin/data/career-paths/${id}`);
  },

  async createCareerPath(payload: Partial<CareerPathRecord>): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>('/api/admin/data/career-paths', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCareerPath(id: number, payload: Partial<CareerPathRecord>): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>(`/api/admin/data/career-paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifyCareerPath(id: number): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>(`/api/admin/data/career-paths/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateCareerPath(id: number): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>(`/api/admin/data/career-paths/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateCareerPath(id: number): Promise<CareerPathRecord> {
    return await apiClient<CareerPathRecord>(`/api/admin/data/career-paths/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Data Sources
  // --------------------------------------------------------------------------
  async getSources(params?: DataFilterParams): Promise<PaginatedResponse<DataSourceRecord>> {
    return await apiClient<PaginatedResponse<DataSourceRecord>>(`/api/admin/data/sources${buildQuery(params)}`);
  },

  async getSource(id: number): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>(`/api/admin/data/sources/${id}`);
  },

  async createSource(payload: Partial<DataSourceRecord>): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>('/api/admin/data/sources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateSource(id: number, payload: Partial<DataSourceRecord>): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>(`/api/admin/data/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async verifySource(id: number): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>(`/api/admin/data/sources/${id}/verify`, {
      method: 'PATCH',
    });
  },

  async deactivateSource(id: number): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>(`/api/admin/data/sources/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  async reactivateSource(id: number): Promise<DataSourceRecord> {
    return await apiClient<DataSourceRecord>(`/api/admin/data/sources/${id}/reactivate`, {
      method: 'PATCH',
    });
  },

  // --------------------------------------------------------------------------
  // Bulk Actions, CSV Import/Export & RAG Sync
  // --------------------------------------------------------------------------
  async executeBulkAction(
    entity: DataTabKey,
    action: 'verify' | 'deactivate',
    ids: number[]
  ): Promise<BulkActionResponse> {
    return await apiClient<BulkActionResponse>(`/api/admin/data/${entity}/bulk-action`, {
      method: 'POST',
      body: JSON.stringify({ action, ids }),
    });
  },

  async importCsv(entity: DataTabKey, csvText: string): Promise<ImportCsvResponse> {
    return await apiClient<ImportCsvResponse>(`/api/admin/data/${entity}/import-csv`, {
      method: 'POST',
      body: JSON.stringify({ csv_text: csvText }),
    });
  },

  getExportCsvUrl(entity: DataTabKey, params?: DataFilterParams): string {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.sector) searchParams.append('sector', params.sector);
    const qs = searchParams.toString();
    return `/api/admin/data/export/${entity}${qs ? `?${qs}` : ''}`;
  },

  async syncRagKnowledgeBase(): Promise<RagSyncResponse> {
    return await apiClient<RagSyncResponse>('/api/admin/data/rag/sync', {
      method: 'POST',
    });
  },
};
