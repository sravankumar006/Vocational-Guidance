import React from 'react';

/**
 * Core application types and schemas.
 */

export interface HealthCheckResponse {
  status: string;
  environment: string;
  project: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

/**
 * Shared frontend architecture types.
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
