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
  
  private pingSentTime = 0;
  private connectionLatencyMs = 0;
  private offlineBuffer: unknown[] = [];
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

  public subscribe(topic: string, callback: WebSocketCallback): () => void {
    logger.info(`[WS] Subscribing to topic: ${topic}`);
    let set = this.subscriptions.get(topic);
    if (!set) {
      set = new Set<WebSocketCallback>();
      this.subscriptions.set(topic, set);
    }
    set.add(callback);

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

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        logger.debug('[WS] Sending heartbeat ping...');
        this.pingSentTime = Date.now();
        this.send({ type: 'ping', event: 'ping', timestamp: this.pingSentTime });
        
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

  private flushOfflineBuffer(): void {
    if (this.offlineBuffer.length === 0) return;
    logger.info(`[WS] Flushing ${this.offlineBuffer.length} buffered messages from offline buffer.`);
    const buffer = [...this.offlineBuffer];
    this.offlineBuffer = [];
    
    buffer.forEach(msg => {
      this.send(msg);
    });
  }

  public getLatency(): number {
    return this.connectionLatencyMs;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// ---------------------------------------------------------
// Solana Dedicated WebSocket Manager Implementation
// ---------------------------------------------------------

export class SolanaWebSocketManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private activeUrl = 'wss://api.devnet.solana.com';
  
  // Maps pending request IDs to confirmation callbacks
  private pendingRequests = new Map<number, (subId: number) => void>();
  private requestCounter = 1;
  
  // Maps subscription IDs to callbacks
  private subMap = new Map<number, WebSocketCallback>();
  // Tracks logical subscriptions for reconnection recovery
  private activeSubs = new Set<{ method: string; params: unknown[]; callback: WebSocketCallback }>();

  public connect(clusterUrl: string): void {
    if (this.ws) {
      this.ws.close();
    }
    
    // Resolve secure WebSocket URL from HTTP endpoint
    this.activeUrl = clusterUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    logger.info(`[SolanaWS] Connecting to ${this.activeUrl}`);
    
    try {
      this.ws = new WebSocket(this.activeUrl);
      this.setupHandlers();
    } catch (e) {
      logger.error('[SolanaWS] Connection initialization failed', e);
    }
  }

  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('[SolanaWS] Connected successfully.');
      this.isConnected = true;
      this.recoverSubscriptions();
    };

    this.ws.onmessage = (event: any) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle subscription request confirmation
        if (message.id && this.pendingRequests.has(message.id)) {
          const resolve = this.pendingRequests.get(message.id)!;
          this.pendingRequests.delete(message.id);
          resolve(message.result); // result is subscription ID
          return;
        }

        // Handle subscription notification messages
        if (message.method && message.params) {
          const subId = message.params.subscription;
          const callback = this.subMap.get(subId);
          if (callback) {
            callback(message.params.result);
          }
        }
      } catch (err) {
        logger.error('[SolanaWS] Parsing payload error', err);
      }
    };

    this.ws.onclose = () => {
      logger.warn('[SolanaWS] Connection closed.');
      this.isConnected = false;
      this.ws = null;
    };
  }

  // Generic Solana RPC subscription dispatcher
  private async subscribeRpc(method: string, params: unknown[], _callback: WebSocketCallback): Promise<number> {
    return new Promise((resolve) => {
      const requestId = this.requestCounter++;
      this.pendingRequests.set(requestId, resolve);
      
      const payload = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      };

      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify(payload));
      } else {
        logger.warn('[SolanaWS] Socket not active. Postponing subscription.');
      }
    });
  }

  public async subscribeAccount(publicKey: string, callback: WebSocketCallback): Promise<() => void> {
    const method = 'accountSubscribe';
    const params = [publicKey, { commitment: 'confirmed', encoding: 'jsonParsed' }];
    
    const subObj = { method, params, callback };
    this.activeSubs.add(subObj);

    const subId = await this.subscribeRpc(method, params, callback);
    this.subMap.set(subId, callback);
    logger.info(`[SolanaWS] Account subscription confirmed: ${publicKey} -> SubID: ${subId}`);

    return () => {
      this.activeSubs.delete(subObj);
      this.subMap.delete(subId);
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: this.requestCounter++,
          method: 'accountUnsubscribe',
          params: [subId],
        }));
      }
    };
  }

  public async subscribeSlot(callback: WebSocketCallback): Promise<() => void> {
    const method = 'slotSubscribe';
    const params: unknown[] = [];
    
    const subObj = { method, params, callback };
    this.activeSubs.add(subObj);

    const subId = await this.subscribeRpc(method, params, callback);
    this.subMap.set(subId, callback);
    logger.info(`[SolanaWS] Slot subscription confirmed -> SubID: ${subId}`);

    return () => {
      this.activeSubs.delete(subObj);
      this.subMap.delete(subId);
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: this.requestCounter++,
          method: 'slotUnsubscribe',
          params: [subId],
        }));
      }
    };
  }

  private async recoverSubscriptions(): Promise<void> {
    if (this.activeSubs.size === 0) return;
    logger.info(`[SolanaWS] Recovering ${this.activeSubs.size} active subscriptions on reconnect.`);
    
    for (const sub of this.activeSubs) {
      const newSubId = await this.subscribeRpc(sub.method, sub.params, sub.callback);
      this.subMap.set(newSubId, sub.callback);
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketManager = new WebSocketManager();
export const solanaWebSocketManager = new SolanaWebSocketManager();
export default webSocketManager;
