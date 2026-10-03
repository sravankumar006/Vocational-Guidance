import React from 'react';

export type UserRole = 'student' | 'parent' | 'admin';

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  family_id?: string;
  student_id?: number;
  linked_student_name?: string;
  relationship_to_student?: string;
  education_level?: string;
  district?: string;
  state?: string;
  title?: string;
  department?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthCheckResponse {
  status: string;
  environment?: string;
  project?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface NavigationItem {
  label: string;
  labelTe?: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type Language = 'en' | 'te';

export * from './student';
export * from './career';
