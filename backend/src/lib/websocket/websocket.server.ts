/**
 * Cronos Shield WebSocket Server
 * Manages WebSocket connections for real-time price updates
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CryptoComWebSocketService } from '../../services/divergence/websocket.service';

export interface WebSocketMessage {
  type: 'price_update' | 'connection_status' | 'error';
  pair?: string;
  price?: any;
  connected?: boolean;
  error?: string;
}

export class CronosShieldWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private cryptoComService: CryptoComWebSocketService;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: false, // Disable compression for better performance
    });
    
    this.cryptoComService = new CryptoComWebSocketService();
    
    this.setup();
    this.startHeartbeat();
  }

  private setup() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress || 'unknown';
      console.log(`✅ New WebSocket client connected from ${clientIp}`);
      
      this.clients.add(ws);

      // Send initial connection status
      this.sendToClient(ws, {
        type: 'connection_status',
        connected: this.cryptoComService.isConnected(),
      });

      // Send initial cached prices
      this.sendInitialPrices(ws);

      // Subscribe to price updates from Crypto.com
      const unsubscribe = this.cryptoComService.subscribe((pair, price) => {
        this.sendToClient(ws, {
          type: 'price_update',
          pair,
          price,
        });
      });

      // Handle client messages (if needed in future)
      ws.on('message', (data: Buffer | string) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing client message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected from ${clientIp}`);
        this.clients.delete(ws);
        unsubscribe();
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket client error from ${clientIp}:`, error);
        this.clients.delete(ws);
        unsubscribe();
      });

      // Individual client heartbeat
      const clientHeartbeat = setInterval(() => {
        if (ws.readyState === 1) { // WebSocket.OPEN = 1
          ws.ping();
        } else {
          clearInterval(clientHeartbeat);
        }
      }, 30000); // Ping every 30 seconds

      ws.on('pong', () => {
        // Client is alive
      });
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    // Handle future client messages here
    // For now, we only support server-to-client updates
    if (message.type === 'ping') {
      this.sendToClient(ws, { type: 'connection_status', connected: true });
    }
  }

  private sendInitialPrices(ws: WebSocket) {
    const allPrices = this.cryptoComService.getAllPrices();
    
    if (allPrices.size === 0) {
      return;
    }

    allPrices.forEach((price, pair) => {
      this.sendToClient(ws, {
        type: 'price_update',
        pair,
        price,
      });
    });
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === 1) { // WebSocket.OPEN = 1
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Error sending message to client:', error);
        this.clients.delete(ws);
      }
    } else {
      // Remove dead connections
      this.clients.delete(ws);
    }
  }

  private broadcast(message: WebSocketMessage) {
    const data = JSON.stringify(message);
    const deadClients: WebSocket[] = [];
    
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        try {
          client.send(data);
        } catch (error) {
          console.error('❌ Error broadcasting to client:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    });

    // Clean up dead connections
    deadClients.forEach(client => {
      this.clients.delete(client);
    });
  }

  private startHeartbeat() {
    // Broadcast connection status every 60 seconds
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'connection_status',
        connected: this.cryptoComService.isConnected(),
      });
    }, 60000);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Check if Crypto.com WebSocket is connected
   */
  isCryptoComConnected(): boolean {
    return this.cryptoComService.isConnected();
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.close();
      }
    });
    this.clients.clear();

    // Close WebSocket server
    this.wss.close(() => {
      console.log('🔌 WebSocket server closed');
    });

    // Disconnect Crypto.com service
    this.cryptoComService.disconnect();
  }
}
