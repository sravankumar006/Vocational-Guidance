export interface EscalationMessageItem {
  id: number;
  sender_type: 'student' | 'parent' | 'ai' | 'counsellor' | string;
  content: string;
  confidence?: number | null;
  requires_human?: boolean | null;
  created_at: string;
}

export interface EscalationListItem {
  id: number;
  student_id?: number | null;
  student_name: string;
  parent_id?: number | null;
  parent_name?: string | null;
  career_id?: number | null;
  career_title: string;
  concern: string;
  language: string;
  conversation_summary?: string | null;
  reason?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: 'pending' | 'in_progress' | 'resolved' | string;
  counselling_session_id?: number | null;
  assigned_counsellor?: string | null;
  started_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
  is_demo: boolean;
}

export interface EscalationDetailItem {
  id: number;
  student_id?: number | null;
  student_name: string;
  student_education?: string | null;
  student_location?: string | null;
  parent_id?: number | null;
  parent_name?: string | null;
  career_id?: number | null;
  career_title: string;
  career_sector?: string | null;
  career_description?: string | null;
  concern: string;
  language: string;
  conversation_summary?: string | null;
  reason?: string | null;
  priority: string;
  status: 'pending' | 'in_progress' | 'resolved' | string;
  counselling_session_id?: number | null;
  assigned_to_user_id?: number | null;
  assigned_counsellor?: string | null;
  resolved_by_user_id?: number | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  started_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
  is_demo: boolean;
  conversation_messages: EscalationMessageItem[];
}

export interface EscalationStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
}

export interface AdminEscalationsPaginatedResponse {
  items: EscalationListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats: EscalationStats;
}

export interface EscalationFilterParams {
  status?: string;
  language?: string;
  concern?: string;
  career?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface EscalationStatusUpdateRequest {
  status: 'Pending' | 'In Progress' | 'Resolved' | string;
  resolution_notes?: string;
  assigned_to_user_id?: number;
}

export interface CounsellorOption {
  id: number;
  name: string;
  email?: string | null;
  role: string;
}
