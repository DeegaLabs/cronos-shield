/**
 * useDivergence Hook
 * 
 * Hook for fetching CEX-DEX price divergence analysis
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import type { DivergenceResponse } from '../types/divergence.types';

export type { DivergenceResponse } from '../types/divergence.types';

export interface DivergenceRequest {
  token: string;
  amount?: string;
}

export interface DivergenceAlert {
  pair: string;
  divergence: number;
  severity: 'high' | 'medium' | 'low';
  time: string;
  description: string;
}

export function useDivergence() {
  const analyzeMutation = useMutation({
    mutationFn: async (params: DivergenceRequest & { paymentId?: string }): Promise<DivergenceResponse> => {
      const headers: Record<string, string> = {};
      if (params.paymentId) {
        headers['x-payment-id'] = params.paymentId;
      }

      const response = await apiClient.get('/api/divergence/analyze', {
        params: {
          token: params.token,
          ...(params.amount && { amount: params.amount }),
        },
        headers,
      });

      return response.data;
    },
  });

  return {
    analyzeDivergence: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    divergenceData: analyzeMutation.data,
    error: analyzeMutation.error,
    reset: analyzeMutation.reset,
  };
}

export function useDivergenceHistory(token?: string, days: number = 7) {
  return useQuery({
    queryKey: ['divergence-history', token, days],
    queryFn: async () => {
      const params: Record<string, string> = { days: days.toString() };
      if (token) {
        params.token = token;
      }
      const response = await apiClient.get('/api/divergence/history', { params });
      return response.data.data as number[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useDivergenceAlerts(limit: number = 10) {
  return useQuery({
    queryKey: ['divergence-alerts', limit],
    queryFn: async () => {
      const response = await apiClient.get('/api/divergence/alerts', {
        params: { limit: limit.toString() },
      });
      return response.data.alerts as DivergenceAlert[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
