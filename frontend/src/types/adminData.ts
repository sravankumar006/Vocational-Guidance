/**
 * Type definitions for Admin Data Management (A7 — Data Management).
 */

export type DataRecordStatus = 'demo' | 'unverified' | 'verified' | 'inactive';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface EntityStatusCount {
  total: number;
  demo: number;
  unverified: number;
  verified: number;
  inactive: number;
}

export interface DataStatsResponse {
  courses: EntityStatusCount;
  occupations: EntityStatusCount;
  providers: EntityStatusCount;
  outcomes: EntityStatusCount;
  career_paths: EntityStatusCount;
  sources: EntityStatusCount;
}

export interface OptionItem {
  id: number;
  name: string;
  extra?: string;
}

export interface DataOptionsResponse {
  sources: OptionItem[];
  occupations: OptionItem[];
  providers: OptionItem[];
  career_paths: OptionItem[];
  sectors: string[];
}

export interface CourseRecord {
  id: number;
  name: string;
  description?: string | null;
  duration?: string | null;
  qualification_level?: string | null;
  sector?: string | null;
  delivery_mode?: string | null;
  provider_id?: number | null;
  provider_name?: string | null;
  data_source_id?: number | null;
  data_source_name?: string | null;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface OccupationRecord {
  id: number;
  name: string;
  description?: string | null;
  sector?: string | null;
  skill_requirements?: any;
  data_source_id?: number | null;
  data_source_name?: string | null;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingProviderRecord {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  provider_type?: string | null;
  contact_info?: any;
  data_source_id?: number | null;
  data_source_name?: string | null;
  course_count?: number;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobOutcomeRecord {
  id: number;
  occupation_id?: number | null;
  occupation_name?: string | null;
  career_path_id?: number | null;
  career_path_name?: string | null;
  data_source_id?: number | null;
  data_source_name?: string | null;
  employment_rate?: number | null;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency: string;
  experience_level?: string | null;
  region?: string | null;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CareerPathRecord {
  id: number;
  name: string;
  description?: string | null;
  progression_ladder?: any;
  estimated_duration?: string | null;
  data_source_id?: number | null;
  data_source_name?: string | null;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DataSourceRecord {
  id: number;
  name: string;
  source_type?: string | null;
  url?: string | null;
  description?: string | null;
  version?: string | null;
  retrieved_at?: string | null;
  status: DataRecordStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  created_at: string;
  updated_at: string;
}

export type DataTabKey = 'courses' | 'occupations' | 'providers' | 'outcomes' | 'career-paths' | 'sources';

export interface DataFilterParams {
  page?: number;
  page_size?: number;
  q?: string;
  status?: string;
  sector?: string;
  occupation_id?: number;
  career_path_id?: number;
  provider_id?: number;
  data_source_id?: number;
  region?: string;
}

export interface BulkActionResponse {
  action: string;
  total_requested: number;
  successful: number;
  failed: number;
  errors: string[];
}

export interface ImportCsvResponse {
  records_imported: number;
  records_rejected: number;
  validation_errors: string[];
}

export interface RagSyncResponse {
  status: string;
  message: string;
  verified_records_synced: number;
  synced_at: string;
}
