export type CareerIntent =
  | 'I already have a career in mind'
  | 'Help me choose a career'
  | 'I want a job soon'
  | 'I want vocational training'
  | 'I want to continue studying';

export interface TrainingProviderBasic {
  id: number;
  name: string;
  location?: string | null;
  provider_type?: string | null;
  contact_info?: Record<string, unknown> | null;
}

export interface CourseSummary {
  id: number;
  name: string;
  duration?: string | null;
  qualification_level?: string | null;
  sector?: string | null;
  delivery_mode?: string | null;
  provider?: TrainingProviderBasic | null;
  data_source_name?: string | null;
}

export interface CareerSummary {
  id: number;
  name: string;
  sector?: string | null;
  description?: string | null;
  common_roles: string[];
  self_employment?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  average_placement_rate?: number | null;
  qualification_levels: string[];
  training_durations: string[];
  courses_count: number;
  providers_count: number;
  top_regions: string[];
  source: string;
}

export interface SalaryStatistics {
  min_monthly?: number | null;
  max_monthly?: number | null;
  avg_min_monthly?: number | null;
  avg_max_monthly?: number | null;
  currency: string;
}

export interface PlacementStatistics {
  average_placement_rate?: number | null;
  total_empirical_records: number;
}

export interface RegionalDistributionItem {
  region: string;
  average_placement_rate?: number | null;
  recorded_batches: number;
}

export interface DataProvenance {
  source_name: string;
  source_type?: string | null;
  version?: string | null;
  url?: string | null;
  is_verified: boolean;
  total_records: number;
  notice: string;
}

export interface CareerDetail {
  id: number;
  name: string;
  sector?: string | null;
  description?: string | null;
  common_roles: string[];
  self_employment?: string | null;
  progression_ladder: string[];
  further_education_options?: string | null;
  courses: CourseSummary[];
  salary_statistics: SalaryStatistics;
  placement_statistics: PlacementStatistics;
  regional_distribution: RegionalDistributionItem[];
  data_provenance: DataProvenance;
}

export interface CareerFilterOptions {
  sectors: string[];
  qualification_levels: string[];
  durations: string[];
  states: string[];
  min_salary_bound: number;
  max_salary_bound: number;
}

export interface CareerSearchParams {
  search?: string;
  sector?: string;
  education?: string;
  duration?: string;
  location?: string;
  min_salary?: number;
  max_salary?: number;
  min_placement_rate?: number;
  sort_by?: 'name_asc' | 'name_desc' | 'salary_high' | 'salary_low' | 'placement_rate';
  page?: number;
  page_size?: number;
}

export interface CareerSearchResponse {
  items: CareerSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  filter_options: CareerFilterOptions;
}

export interface FactorEvaluation {
  factor: string;
  result: string;
  summary: string;
  score?: number | null;
}

export interface CareerRecommendationItem {
  career: CareerSummary;
  compatibility_score: number;
  score?: number;
  matched_factors: FactorEvaluation[];
  mismatched_factors: FactorEvaluation[];
  unknown_factors: FactorEvaluation[];
}

export interface CareerRecommendationsResponse {
  recommendations: CareerRecommendationItem[];
  weights_used: Record<string, number>;
  algorithm: string;
}
