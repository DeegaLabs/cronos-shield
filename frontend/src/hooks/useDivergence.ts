/**
 * useDivergence Hook
 * 
 * Hook for fetching CEX-DEX price divergence analysis
 */

import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import type { DivergenceResponse } from '../types/divergence.types';

export type { DivergenceResponse } from '../types/divergence.types';

export interface DivergenceRequest {
  token: string;
  amount?: string;
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
