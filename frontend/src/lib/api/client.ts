/**
 * API Client
 * 
 * Centralized API client for backend communication
 */

import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for adding auth headers
apiClient.interceptors.request.use((config) => {
  const paymentId = localStorage.getItem('x-payment-id');
  if (paymentId) {
    config.headers['x-payment-id'] = paymentId;
  }
  return config;
});

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error. Please check your connection and try again.');
      return Promise.reject(networkError);
    }

    // Handle 402 Payment Required (x402)
    if (error.response.status === 402) {
      // Return the error as-is so components can handle it
      return Promise.reject(error);
    }

    // Handle other errors with better messages
    const message = (error.response.data as any)?.message || error.message || 'An error occurred';
    const enhancedError = new Error(message);
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
