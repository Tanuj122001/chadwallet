/**
 * Mainnet Cluster Manager — Dynamic Mainnet/Devnet switching, RPC prioritization, reputation scoring, automatic unhealthy RPC removal, latency ranking, usage statistics, and quota monitors
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export interface IRpcNode {
  url: string;
  cluster: 'mainnet' | 'devnet';
  latencyMs: number;
  reputationScore: number; // 0 to 100, 100 = flawless
  consecutiveFailures: number;
  totalRequests: number;
  totalErrors: number;
  quotaLimit: number;
  quotaUsed: number;
  isActive: boolean;
}

export class MainnetClusterManager {
  private rpcNodes: Map<string, IRpcNode> = new Map();
  private activeCluster: 'mainnet' | 'devnet' = 'devnet';

  constructor() {
    this.initializeDefaultNodes();
  }

  private initializeDefaultNodes(): void {
    // Add default Devnet RPC endpoints
    this.addNode({
      url: 'https://api.devnet.solana.com',
      cluster: 'devnet',
      latencyMs: 120,
      reputationScore: 100,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalErrors: 0,
      quotaLimit: 100000,
      quotaUsed: 0,
      isActive: true,
    });

    this.addNode({
      url: 'https://devnet.helius-rpc.com/?api-key=mock',
      cluster: 'devnet',
      latencyMs: 90,
      reputationScore: 100,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalErrors: 0,
      quotaLimit: 50000,
      quotaUsed: 0,
      isActive: true,
    });

    // Add default Mainnet RPC endpoints
    this.addNode({
      url: 'https://api.mainnet-beta.solana.com',
      cluster: 'mainnet',
      latencyMs: 80,
      reputationScore: 100,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalErrors: 0,
      quotaLimit: 100000,
      quotaUsed: 0,
      isActive: true,
    });

    this.addNode({
      url: 'https://mainnet.helius-rpc.com/?api-key=mock',
      cluster: 'mainnet',
      latencyMs: 45,
      reputationScore: 100,
      consecutiveFailures: 0,
      totalRequests: 0,
      totalErrors: 0,
      quotaLimit: 250000,
      quotaUsed: 0,
      isActive: true,
    });
  }

  public addNode(node: IRpcNode): void {
    this.rpcNodes.set(node.url, node);
    logger.debug(`[ClusterManager] Added RPC node: ${node.url} (cluster=${node.cluster})`);
  }

  public removeNode(url: string): boolean {
    logger.warn(`[ClusterManager] Removing RPC node: ${url}`);
    return this.rpcNodes.delete(url);
  }

  public switchCluster(cluster: 'mainnet' | 'devnet'): void {
    if (cluster === 'mainnet' && !featureFlagsManager.isEnabled('ENABLE_MAINNET')) {
      logger.warn('[ClusterManager] Mainnet requested but disabled by feature flag.');
      return;
    }
    this.activeCluster = cluster;
    logger.info(`[ClusterManager] Active cluster switched to: ${cluster}`);
  }

  public getActiveCluster(): 'mainnet' | 'devnet' {
    return this.activeCluster;
  }

  public recordRequest(url: string, success: boolean, latencyMs: number): void {
    const node = this.rpcNodes.get(url);
    if (!node) return;

    node.totalRequests++;
    node.quotaUsed++;
    node.latencyMs = latencyMs;

    if (success) {
      node.consecutiveFailures = 0;
      // Recover reputation slowly
      node.reputationScore = Math.min(100, node.reputationScore + 2);
    } else {
      node.totalErrors++;
      node.consecutiveFailures++;
      // Penalize reputation severely
      node.reputationScore = Math.max(0, node.reputationScore - 20 * node.consecutiveFailures);

      if (node.consecutiveFailures >= 5) {
        node.isActive = false;
        logger.error(`[ClusterManager] RPC node deactivated due to high failures: ${url}`);
      }
    }
  }

  public getPrioritizedNodes(): IRpcNode[] {
    const activeNodes = Array.from(this.rpcNodes.values()).filter(
      node => node.cluster === this.activeCluster && node.isActive && node.quotaUsed < node.quotaLimit
    );

    // Sort by reputation score (descending) and then latency (ascending)
    return activeNodes.sort((a, b) => {
      if (b.reputationScore !== a.reputationScore) {
        return b.reputationScore - a.reputationScore;
      }
      return a.latencyMs - b.latencyMs;
    });
  }

  public getActiveEndpoint(): string {
    const nodes = this.getPrioritizedNodes();
    if (nodes.length > 0) {
      return nodes[0].url;
    }
    // Fallback: return default node if all deactivated
    return this.activeCluster === 'mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';
  }

  public getNodeStats(url: string): IRpcNode | null {
    return this.rpcNodes.get(url) || null;
  }

  public getAllNodes(): IRpcNode[] {
    return Array.from(this.rpcNodes.values());
  }

  public resetStats(): void {
    this.rpcNodes.forEach(node => {
      node.totalRequests = 0;
      node.totalErrors = 0;
      node.consecutiveFailures = 0;
      node.reputationScore = 100;
      node.quotaUsed = 0;
      node.isActive = true;
    });
  }
}

export const mainnetClusterManager = new MainnetClusterManager();
export default mainnetClusterManager;
