import { envLoader } from '../../config/envLoader';
import { logger } from '../../utils/logger';

export interface WebSocketMessage {
  topic: string;
  event: string;
  payload: unknown;
}

export type WebSocketCallback = (payload: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 1000;
  private heartbeatIntervalMs = 30000;
  private heartbeatTimer?: any;
  private pongTimeoutTimer?: any;
  
  // Connection Health Monitor attributes
  private pingSentTime = 0;
  private connectionLatencyMs = 0;
  
  // Message Queue / Offline Buffer
  private offlineBuffer: unknown[] = [];
  
  // Topic -> Callback Set (Topic Router / Event Dispatcher)
  private subscriptions = new Map<string, Set<WebSocketCallback>>();

  constructor() {
    this.url = envLoader.get('WS_PRICE_STREAM_URL');
  }

  public connect(): void {
    if (this.isConnected || this.ws) {
      logger.warn('[WS] Already connected or connecting.');
      return;
    }

    logger.info(`[WS] Connecting to ${this.url}`);
    try {
      this.ws = new WebSocket(this.url);
      this.setupHandlers();
    } catch (err) {
      logger.error('[WS] Connection attempt failed', err);
      this.handleReconnect();
    }
  }

  public disconnect(): void {
    logger.info('[WS] Disconnecting WebSocket.');
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('[WS] Connected successfully.');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.resubscribeToAll();
      this.flushOfflineBuffer();
    };

    this.ws.onmessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong' || data.event === 'pong') {
          this.handlePong();
          return;
        }
        this.dispatchMessage(data);
      } catch (err) {
        logger.error('[WS] Failed to parse message event data', err);
      }
    };

    this.ws.onerror = (error) => {
      logger.error('[WS] Connection error occurred', error);
    };

    this.ws.onclose = (event) => {
      logger.warn(`[WS] Connection closed: Code ${event.code}, Reason: ${event.reason}`);
      this.isConnected = false;
      this.ws = null;
      this.stopHeartbeat();
      this.handleReconnect();
    };
  }

  // Subscription Manager
  public subscribe(topic: string, callback: WebSocketCallback): () => void {
    logger.info(`[WS] Subscribing to topic: ${topic}`);
    let set = this.subscriptions.get(topic);
    if (!set) {
      set = new Set<WebSocketCallback>();
      this.subscriptions.set(topic, set);
    }
    set.add(callback);

    // If already connected, send subscription message to server
    if (this.isConnected && this.ws) {
      this.send({ event: 'subscribe', topic });
    }

    return () => {
      logger.info(`[WS] Unsubscribing from topic: ${topic}`);
      const currentSet = this.subscriptions.get(topic);
      if (currentSet) {
        currentSet.delete(callback);
        if (currentSet.size === 0) {
          this.subscriptions.delete(topic);
          if (this.isConnected && this.ws) {
            this.send({ event: 'unsubscribe', topic });
          }
        }
      }
    };
  }

  private resubscribeToAll(): void {
    this.subscriptions.forEach((_, topic) => {
      this.send({ event: 'subscribe', topic });
    });
  }

  // Message Dispatcher & Topic Router
  private dispatchMessage(message: any): void {
    const topic = message.topic || message.channel;
    if (!topic) return;

    const set = this.subscriptions.get(topic);
    if (set) {
      set.forEach(callback => {
        try {
          callback(message.payload || message.data);
        } catch (err) {
          logger.error(`[WS] Error executing subscription callback for topic: ${topic}`, err);
        }
      });
    }
  }

  // Heartbeat - sends Ping to keep connection alive
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        logger.debug('[WS] Sending heartbeat ping...');
        this.pingSentTime = Date.now();
        this.send({ type: 'ping', event: 'ping', timestamp: this.pingSentTime });
        
        // Expect pong within 5 seconds
        this.pongTimeoutTimer = setTimeout(() => {
          logger.warn('[WS] Heartbeat timeout. Reconnecting...');
          this.disconnect();
          this.handleReconnect();
        }, 5000);
      }
    }, this.heartbeatIntervalMs);
  }

  private handlePong(): void {
    const now = Date.now();
    this.connectionLatencyMs = this.pingSentTime > 0 ? now - this.pingSentTime : 0;
    logger.debug(`[WS] Heartbeat pong received. Latency: ${this.connectionLatencyMs}ms`);
    
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pongTimeoutTimer) clearTimeout(this.pongTimeoutTimer);
  }

  // Reconnect: exponential backoff reconnect strategy
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[WS] Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);
    logger.warn(`[WS] Attempting reconnection in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Send message - with Offline buffering / Message Queue support
  public send(data: unknown): void {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (err) {
        logger.error('[WS] Send message failed. Adding to buffer.', err);
        this.offlineBuffer.push(data);
      }
    } else {
      logger.warn('[WS] Socket is not connected. Queuing message to offline buffer.');
      this.offlineBuffer.push(data);
    }
  }

  // Flushes the offline buffer after connection opens
  private flushOfflineBuffer(): void {
    if (this.offlineBuffer.length === 0) return;
    logger.info(`[WS] Flushing ${this.offlineBuffer.length} buffered messages from offline buffer.`);
    const buffer = [...this.offlineBuffer];
    this.offlineBuffer = [];
    
    buffer.forEach(msg => {
      this.send(msg);
    });
  }

  // Public getters for connection health indicators
  public getLatency(): number {
    return this.connectionLatencyMs;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketManager = new WebSocketManager();
export default webSocketManager;
