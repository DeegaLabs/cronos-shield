/**
 * Crypto.com WebSocket Service
 * Handles real-time price updates via WebSocket
 */

import WebSocket from 'ws';
import { PriceData } from './crypto-com.service';

export class CryptoComWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private priceCache: Map<string, PriceData> = new Map();
  private subscribers: Set<(pair: string, price: PriceData) => void> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // Crypto.com WebSocket public endpoint
      // Note: Using public market data endpoint (no auth required)
      const wsUrl = 'wss://stream.crypto.com/v2/market';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('✅ Connected to Crypto.com WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribeToPairs();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.scheduleReconnect();
      });

      this.ws.on('close', (code, reason) => {
        console.log(`WebSocket closed (code: ${code}, reason: ${reason.toString()}), reconnecting...`);
        this.isConnecting = false;
        this.scheduleReconnect();
      });
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private subscribeToPairs() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Subscribe to ticker updates for major pairs
    // Format: ETH_USDT, BTC_USDT, CRO_USDT, etc.
    const pairs = ['ETH_USDT', 'BTC_USDT', 'CRO_USDT', 'CRO_USDC', 'ATOM_USDT', 'USDC_USDT'];
    
    const subscribeMessage = {
      id: 1,
      method: 'subscribe',
      params: {
        channels: pairs.map(pair => `ticker.${pair}`)
      }
    };

    try {
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log(`📡 Subscribed to ${pairs.length} trading pairs`);
    } catch (error) {
      console.error('❌ Failed to subscribe to pairs:', error);
    }
  }

  private handleMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle ticker updates
      if (message.method === 'ticker.update' && message.result) {
        const result = message.result;
        const instrumentName = result.instrument_name || result.i || '';
        
        if (!instrumentName) {
          return;
        }

        // Convert format: ETH_USDT -> ETH-USDT
        const pair = instrumentName.replace('_', '-');
        
        // Extract price from various possible fields
        const price = parseFloat(
          result.last_price || 
          result.l || 
          result.a || 
          result.b || 
          '0'
        );

        if (isNaN(price) || price <= 0) {
          return;
        }

        const priceData: PriceData = {
          price: price.toString(),
          timestamp: result.t || result.timestamp || Date.now(),
          source: 'CEX',
          pair,
        };

        // Update cache
        this.priceCache.set(pair, priceData);

        // Notify subscribers
        this.subscribers.forEach(callback => {
          try {
            callback(pair, priceData);
          } catch (error) {
            console.error('❌ Error in subscriber callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached. WebSocket will not reconnect.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Max 30s delay

    console.log(`⏳ Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to price updates
   * @param callback Function to call when price updates
   * @returns Unsubscribe function
   */
  subscribe(callback: (pair: string, price: PriceData) => void): () => void {
    this.subscribers.add(callback);
    
    // Send current cached prices to new subscriber
    this.priceCache.forEach((price, pair) => {
      try {
        callback(pair, price);
      } catch (error) {
        console.error('❌ Error sending cached price to subscriber:', error);
      }
    });

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get cached price for a pair
   * @param pair Trading pair (e.g., 'ETH-USDT')
   * @returns PriceData or null if not cached
   */
  getPrice(pair: string): PriceData | null {
    return this.priceCache.get(pair) || null;
  }

  /**
   * Get all cached prices
   * @returns Map of pairs to PriceData
   */
  getAllPrices(): Map<string, PriceData> {
    return new Map(this.priceCache);
  }

  /**
   * Check if WebSocket is connected
   * @returns true if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === 1; // WebSocket.OPEN = 1
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribers.clear();
    this.priceCache.clear();
  }
}
