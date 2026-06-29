import { SolanaRpcClient } from './SolanaRpcClient';
import { envLoader } from '../../config/envLoader';
import { logger } from '../../utils/logger';
import { RpcError } from '../errors';

export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

interface RpcEndpoint {
  url: string;
  latencyMs: number;
  isHealthy: boolean;
}

class RpcConnectionManager {
  private activeCluster: SolanaCluster = 'devnet';
  
  // Endpoint list registry categorized by cluster
  private endpoints: Record<SolanaCluster, RpcEndpoint[]> = {
    'mainnet-beta': [
      { url: envLoader.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com', latencyMs: 0, isHealthy: true },
      { url: 'https://solana-mainnet.g.allthatnode.com', latencyMs: 0, isHealthy: true },
      { url: 'https://rpc.ankr.com/solana', latencyMs: 0, isHealthy: true }
    ],
    'devnet': [
      { url: 'https://api.devnet.solana.com', latencyMs: 0, isHealthy: true },
      { url: 'https://solana-devnet.g.allthatnode.com', latencyMs: 0, isHealthy: true },
      { url: 'https://rpc.ankr.com/solana_devnet', latencyMs: 0, isHealthy: true }
    ],
    'testnet': [
      { url: 'https://api.testnet.solana.com', latencyMs: 0, isHealthy: true }
    ]
  };

  private activeClient: SolanaRpcClient;
  private activeEndpointIndex = 0;

  constructor() {
    // Resolve startup cluster state from env Loader settings
    const isProd = envLoader.get('NODE_ENV') === 'production';
    this.activeCluster = isProd ? 'mainnet-beta' : 'devnet';
    
    const activeUrl = this.endpoints[this.activeCluster][0]!.url;
    this.activeClient = new SolanaRpcClient(activeUrl);
    
    // Execute background health checks on initialization
    this.runHealthChecks();
  }

  // Active Client Getter
  public getActiveClient(): SolanaRpcClient {
    return this.activeClient;
  }

  // Active Cluster switcher
  public setCluster(cluster: SolanaCluster): void {
    if (!this.endpoints[cluster] || this.endpoints[cluster]!.length === 0) {
      logger.error(`[RpcConnectionManager] Unsupported cluster: ${cluster}`);
      return;
    }
    
    this.activeCluster = cluster;
    this.activeEndpointIndex = 0;
    const activeUrl = this.endpoints[cluster][0]!.url;
    
    this.activeClient = new SolanaRpcClient(activeUrl);
    logger.info(`[RpcConnectionManager] Switched active cluster to ${cluster} using ${activeUrl}`);
    this.runHealthChecks();
  }

  public getCluster(): SolanaCluster {
    return this.activeCluster;
  }

  // Failover Strategy: cycles to the next healthy RPC whitelisted endpoint
  public async handleFailover(failingEndpoint: string): Promise<void> {
    const list = this.endpoints[this.activeCluster];
    const currentIndex = list.findIndex(e => e.url === failingEndpoint);
    
    if (currentIndex === -1) return;

    // Flag failing endpoint as unhealthy
    list[currentIndex]!.isHealthy = false;
    
    // Find next healthy index
    let nextIndex = (currentIndex + 1) % list.length;

    for (let i = 0; i < list.length; i++) {
      if (list[nextIndex]!.isHealthy) {
        break;
      }
      nextIndex = (nextIndex + 1) % list.length;
    }

    this.activeEndpointIndex = nextIndex;
    const nextUrl = list[nextIndex]!.url;
    
    this.activeClient = new SolanaRpcClient(nextUrl);
    logger.warn(`[RpcConnectionManager] Failover activated! Endpoint ${failingEndpoint} failed. Redirected to healthy node: ${nextUrl}`);
  }

  // Health check: loops and pings endpoints to measure latencies
  public async runHealthChecks(): Promise<void> {
    logger.info(`[RpcConnectionManager] Starting RPC cluster health audits for ${this.activeCluster}`);
    const list = this.endpoints[this.activeCluster];

    for (const endpoint of list) {
      const start = Date.now();
      try {
        const pingClient = new SolanaRpcClient(endpoint.url);
        // Execute simple call as ping (request slot to verify parsing)
        await pingClient.request<number>('getSlot');
        endpoint.latencyMs = Date.now() - start;
        endpoint.isHealthy = true;
        logger.debug(`[RpcConnectionManager] Endpoint ${endpoint.url} health: OK (${endpoint.latencyMs}ms)`);
      } catch {
        endpoint.latencyMs = 9999;
        endpoint.isHealthy = false;
        logger.warn(`[RpcConnectionManager] Endpoint ${endpoint.url} health: FAIL`);
      }
    }

    // Sort endpoints within active cluster to place the lowest latency healthy endpoint first
    list.sort((a, b) => {
      if (!a.isHealthy && b.isHealthy) return 1;
      if (a.isHealthy && !b.isHealthy) return -1;
      return a.latencyMs - b.latencyMs;
    });

    // Reset active client to point to the fastest healthy node
    const fastest = list[0];
    if (fastest && fastest.isHealthy && fastest.url !== this.activeClient.getEndpoint()) {
      this.activeClient = new SolanaRpcClient(fastest.url);
      logger.info(`[RpcConnectionManager] Updated active node to the fastest healthy server: ${fastest.url} (${fastest.latencyMs}ms)`);
    }
  }

  // Wrap execute requests with automatic failover fallback
  public async executeRpcRequest<T>(requestFn: (client: SolanaRpcClient) => Promise<T>): Promise<T> {
    let retries = 0;
    const maxRetries = this.endpoints[this.activeCluster].length;

    while (retries < maxRetries) {
      const currentClient = this.activeClient;
      try {
        return await requestFn(currentClient);
      } catch (err: any) {
        if (err instanceof RpcError && (err.code.includes('RPC_TRANSPORT_FAILED') || err.message.includes('429') || err.message.includes('timeout'))) {
          retries += 1;
          await this.handleFailover(currentClient.getEndpoint());
          continue;
        }
        throw err;
      }
    }
    throw new Error('All whitelisted Solana RPC endpoints failed to resolve request.');
  }
}

export const rpcConnectionManager = new RpcConnectionManager();
export default rpcConnectionManager;
