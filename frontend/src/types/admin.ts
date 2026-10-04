export interface AdminOverviewStats {
  total_families: number;
  total_students: number;
  total_parents: number;
  total_sessions: number;
  total_escalations: number;
  active_sessions: number;
  pending_escalations: number;
}

export interface AdminFamilyStudent {
  id: number;
  name: string;
  education_level?: string;
  career_interest?: string;
  location?: string;
}

export interface AdminFamilyParent {
  id: number;
  name: string;
  relationship?: string;
  occupation?: string;
}

export interface AdminFamilyItem {
  id: string;
  name: string;
  students_count: number;
  parents_count: number;
  students: AdminFamilyStudent[];
  parents: AdminFamilyParent[];
  last_activity: string;
  status: string;
}

export interface AdminStudentItem {
  id: number;
  name: string;
  family_id: string;
  family_name: string;
  education_level: string;
  location: string;
  career_interest: string;
  sessions_count: number;
  last_activity: string;
  status: string;
}

export interface AdminParentItem {
  id: number;
  name: string;
  family_id: string;
  relationship_to_student: string;
  linked_student_name: string;
  linked_student_id?: number | null;
  contact_identifier: string;
  occupation?: string;
  concerns_count: number;
  last_activity: string;
  status: string;
}

export interface AdminSessionItem {
  id: number;
  student_id: number;
  student_name: string;
  family_name: string;
  session_type: string;
  counsellor: string;
  messages_count: number;
  status: string;
  has_escalation: boolean;
  escalation_priority?: string | null;
  started_at: string;
  ended_at?: string | null;
}

export interface AdminEscalationItem {
  id: number;
  counselling_session_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  parent_name?: string | null;
  career_title?: string | null;
  concern?: string | null;
  reason?: string | null;
  priority?: string | null;
  status: string;
  assigned_counsellor?: string | null;
  conversation_summary?: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
}

export interface AdminOverviewResponse {
  stats: AdminOverviewStats;
  recent_sessions: AdminSessionItem[];
  recent_escalations: AdminEscalationItem[];
}

// =========================================================================
// A2 — Admin Analytics Types
// =========================================================================

export interface AdminAnalyticsSummary {
  total_sessions: number;
  total_messages: number;
  total_concerns: number;
  total_escalations: number;
  resolved_escalations: number;
  observed_sentiment_shift?: string | null;
  has_sentiment_data: boolean;
}

export interface VolumeDataPoint {
  date: string;
  sessions: number;
  messages: number;
}

export interface CounsellingVolumeAnalytics {
  total_sessions: number;
  total_messages: number;
  activity_trends: VolumeDataPoint[];
}

export interface ConcernCategoryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface ConcernSeverityItem {
  severity: string;
  count: number;
  percentage: number;
}

export interface ConcernStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface ConcernTrendPoint {
  date: string;
  count: number;
  categories: Record<string, number>;
}

export interface ConcernTrendItem {
  period: string;
  count: number;
  categories?: Record<string, number>;
}

export interface CareerConcernBreakdownItem {
  career_title: string;
  count: number;
  top_concern?: string | null;
  percentage: number;
}

export interface ParentConcernsAnalytics {
  total?: number;
  total_concerns: number;
  categories: ConcernCategoryItem[];
  trend?: ConcernTrendItem[];
  trends?: ConcernTrendPoint[];
  by_severity?: ConcernSeverityItem[];
  by_status?: ConcernStatusItem[];
  highest_concern?: string | null;
  high_severity_count?: number;
  resolved_count?: number;
  resolution_rate?: number;
  career_breakdown?: CareerConcernBreakdownItem[];
}

export interface ResistanceByCareerItem {
  career_title: string;
  count: number;
  top_concern?: string | null;
}

export interface ResistanceAreaItem {
  area: string;
  count: number;
  percentage: number;
}

export interface ResistanceTrendPoint {
  date: string;
  count: number;
}

export interface ParentResistanceAnalytics {
  parents_expressing_concerns: number;
  total_resistance_events: number;
  top_resistance_areas: ResistanceAreaItem[];
  resistance_by_career: ResistanceByCareerItem[];
  resistance_trends: ResistanceTrendPoint[];
}

export interface EscalationBreakdownItem {
  key: string;
  count: number;
  percentage: number;
}

export interface EscalationTrendPoint {
  date: string;
  count: number;
}

export interface EscalationAnalytics {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  dismissed: number;
  trends: EscalationTrendPoint[];
  by_status: EscalationBreakdownItem[];
  by_priority: EscalationBreakdownItem[];
  by_concern: EscalationBreakdownItem[];
  by_career: EscalationBreakdownItem[];
  by_language: EscalationBreakdownItem[];
}

export interface SentimentCategoryCount {
  sentiment: string;
  count: number;
  percentage: number;
}

export interface SentimentStageData {
  stage_name: string;
  is_available: boolean;
  total: number;
  distribution: Record<string, number>;
  categories: SentimentCategoryCount[];
}

export interface SentimentComparisonItem {
  sentiment: string;
  before_count: number;
  before_percentage: number;
  during_count?: number | null;
  during_percentage?: number | null;
  after_count: number;
  after_percentage: number;
  change_percentage?: number | null;
}

export interface SentimentTrendPoint {
  date: string;
  positive: number;
  neutral: number;
  concerned: number;
  negative: number;
  total: number;
}

export interface SentimentShiftAnalytics {
  title?: string;
  has_sentiment_data: boolean;
  total_events: number;
  total_sessions_analyzed?: number;
  has_before_data?: boolean;
  has_during_data?: boolean;
  has_after_data?: boolean;
  can_compare?: boolean;
  status_message: string;
  methodology_note?: string;
  before?: SentimentStageData;
  during?: SentimentStageData | null;
  after?: SentimentStageData;
  comparison?: SentimentComparisonItem[];
  trends?: SentimentTrendPoint[];
  initial_distribution: Record<string, number>;
  final_distribution: Record<string, number>;
  overall_distribution: Record<string, number>;
  positive_shift_rate?: number | null;
}

export interface FilterOptionItem {
  id: string | number;
  label: string;
}

export interface AnalyticsFilterOptions {
  careers: FilterOptionItem[];
  concerns: string[];
  languages: string[];
  severities?: string[];
  statuses?: string[];
}

export interface AdminAnalyticsResponse {
  summary: AdminAnalyticsSummary;
  volume: CounsellingVolumeAnalytics;
  concerns: ParentConcernsAnalytics;
  resistance: ParentResistanceAnalytics;
  escalations: EscalationAnalytics;
  sentiment: SentimentShiftAnalytics;
  filter_options: AnalyticsFilterOptions;
  applied_date_range: string;
}

export interface AnalyticsFiltersState {
  date_range: string;
  career_id?: number | null;
  concern?: string | null;
  language?: string | null;
  severity?: string | null;
  concern_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

// =========================================================================
// A5: Geographic Concentration Analytics Types
// =========================================================================

export interface GeographicLocationItem {
  location: string;
  count: number;
  percentage: number;
}

export interface GeographicTrendPoint {
  date: string;
  count: number;
}

export interface GeographicSummary {
  total: number;
  top_state?: string | null;
  top_district?: string | null;
  top_region?: string | null;
  top_career?: string | null;
  top_concern?: string | null;
  is_demo_data: boolean;
}

export interface GeographicAnalyticsResponse {
  is_demo_data: boolean;
  demo_note: string;
  summary: GeographicSummary;
  states: GeographicLocationItem[];
  districts: GeographicLocationItem[];
  regions: GeographicLocationItem[];
  trend: GeographicTrendPoint[];
  available_states: string[];
  available_districts: string[];
  available_regions: string[];
  state_districts: Record<string, string[]>;
  available_concerns: string[];
  available_careers: FilterOptionItem[];
}

export interface GeographicFiltersState {
  state?: string | null;
  district?: string | null;
  region?: string | null;
  career_id?: number | null;
  concern?: string | null;
  date_range: string;
  start_date?: string | null;
  end_date?: string | null;
}

// =========================================================================
// A6: AI Performance Analytics Types
// =========================================================================

export interface AIPerformanceSummary {
  total_sessions: number;
  total_ai_responses: number;
  total_user_questions: number;
  resolved_sessions: number;
  resolution_rate: number;
  escalated_sessions: number;
  escalation_rate: number;
  low_confidence_responses: number;
  low_confidence_rate: number;
  unanswered_questions: number;
  unanswered_rate: number;
}

export interface AIResolutionBreakdown {
  resolved: number;
  escalated: number;
  active_unresolved: number;
}

export interface AIPerformanceTrendPoint {
  date: string;
  total_sessions: number;
  resolved: number;
  escalated: number;
  low_confidence: number;
}

export interface AIUnansweredCategoryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface AIPerformanceAnalyticsResponse {
  is_demo_data: boolean;
  demo_note: string;
  confidence_threshold: number;
  summary: AIPerformanceSummary;
  resolution_breakdown: AIResolutionBreakdown;
  trend: AIPerformanceTrendPoint[];
  unanswered_categories: AIUnansweredCategoryItem[];
  deterministic_summary: string[];
}

export interface AIPerformanceFiltersState {
  date_range: string;
  start_date?: string | null;
  end_date?: string | null;
}

