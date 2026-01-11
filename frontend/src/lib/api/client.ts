/**
 * API Client
 * 
 * Centralized API client for backend communication
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth headers
apiClient.interceptors.request.use((config) => {
  const paymentId = localStorage.getItem('x-payment-id');
  if (paymentId) {
    config.headers['x-payment-id'] = paymentId;
  }
  return config;
});

export default apiClient;
