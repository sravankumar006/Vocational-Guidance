import { apiClient } from '@/lib/apiClient';
import type { HealthCheckResponse } from '@/types';

/**
 * Foundation API service layer.
 * Business service functions will be integrated in subsequent bricks.
 */

export const healthService = {
  getHealth: async (): Promise<HealthCheckResponse> => {
    return apiClient<HealthCheckResponse>('/health');
  },
};
