import { useState, useEffect } from 'react';
import { healthService } from '@/services/api';
import type { HealthCheckResponse } from '@/types';

export function useHealth() {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await healthService.getHealth();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reach API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return { data, loading, error, refetch: check };
}
