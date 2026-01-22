/**
 * useWebSocket Hook
 * 
 * Hook for real-time price updates via WebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface PriceData {
  price: string;
  timestamp: number;
  source: 'CEX' | 'DEX';
  pair: string;
}

export interface WebSocketMessage {
  type: 'price_update' | 'connection_status' | 'error';
  pair?: string;
  price?: PriceData;
  connected?: boolean;
  error?: string;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  onPriceUpdate?: (pair: string, price: PriceData) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, onPriceUpdate, onConnectionChange } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const reconnectDelayRef = useRef(1000); // Start with 1 second

  const getWebSocketUrl = useCallback(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    // Convert http:// to ws:// and https:// to wss://
    const wsUrl = backendUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000; // Reset delay
        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'price_update':
              if (message.pair && message.price) {
                setPrices((prev) => {
                  const newPrices = new Map(prev);
                  newPrices.set(message.pair!, message.price!);
                  return newPrices;
                });
                onPriceUpdate?.(message.pair, message.price);
              }
              break;

            case 'connection_status':
              if (message.connected !== undefined) {
                setIsConnected(message.connected);
                onConnectionChange?.(message.connected);
              }
              break;

            case 'error':
              console.error('WebSocket error:', message.error);
              setError(message.error || 'Unknown error');
              break;

            default:
              console.warn('Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onConnectionChange?.(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure and enabled
        if (enabled && event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(reconnectDelayRef.current * reconnectAttemptsRef.current, 30000);
          reconnectDelayRef.current = delay;

          console.log(`⏳ Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached. Please refresh the page.');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to WebSocket');
      setIsConnecting(false);
    }
  }, [enabled, getWebSocketUrl, onPriceUpdate, onConnectionChange, isConnecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const getPrice = useCallback((pair: string): PriceData | null => {
    return prices.get(pair) || null;
  }, [prices]);

  return {
    isConnected,
    isConnecting,
    error,
    prices,
    getPrice,
    connect,
    disconnect,
  };
}
