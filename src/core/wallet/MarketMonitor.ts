import { webSocketManager } from '../websocket/WebSocketManager';
import { alertEngine } from './AlertEngine';
import { eventEngine } from './EventEngine';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export class MarketMonitor {
  private static instance: MarketMonitor | null = null;
  private activeSubscriptions: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): MarketMonitor {
    if (!MarketMonitor.instance) {
      MarketMonitor.instance = new MarketMonitor();
    }
    return MarketMonitor.instance;
  }

  // Initialize market monitor subscriptions
  public startMonitoring(): void {
    if (!featureFlagsManager.isEnabled('ENABLE_MARKET_MONITOR')) {
      logger.info('[MarketMonitor] Market monitoring disabled by feature flag.');
      return;
    }

    logger.info('[MarketMonitor] Starting market telemetry monitors...');

    // Subscribe to live price stream updates
    const unsubscribePrice = webSocketManager.subscribe('price_stream', (payload: any) => {
      this.handlePriceUpdate(payload);
    });
    this.activeSubscriptions.push(unsubscribePrice);

    // Subscribe to large trades / swaps stream
    const unsubscribeSwaps = webSocketManager.subscribe('large_swaps', (payload: any) => {
      this.handleLargeSwapUpdate(payload);
    });
    this.activeSubscriptions.push(unsubscribeSwaps);
  }

  public stopMonitoring(): void {
    logger.info('[MarketMonitor] Stopping market telemetry monitors.');
    this.activeSubscriptions.forEach(unsub => unsub());
    this.activeSubscriptions = [];
  }

  // Handle incoming live price feed
  private async handlePriceUpdate(payload: any): Promise<void> {
    const { mint, price, volume_24h, mcap, previous_price } = payload;
    if (!mint || price === undefined) return;

    logger.debug(`[MarketMonitor] Price update for ${mint}: $${price}`);

    // 1. Evaluate Price Alerts
    await alertEngine.processTelemetry('price', mint, price, { previousValue: previous_price });

    // 2. Evaluate Volume & Market Cap Alerts
    if (volume_24h !== undefined) {
      await alertEngine.processTelemetry('liquidity', mint, volume_24h);
    }
    if (mcap !== undefined) {
      await alertEngine.processTelemetry('whale', mint, mcap);
    }

    // 3. Publish generic price tick event
    await eventEngine.publish({
      event_id: `evt_price_${mint}_${Date.now()}`,
      topic: 'market_ticks',
      event_type: 'price_update',
      priority: 'low',
      payload: { mint, price, volume_24h, mcap },
      timestamp: Date.now(),
    });
  }

  // Handle incoming large swaps feed
  private async handleLargeSwapUpdate(payload: any): Promise<void> {
    const { swap_id, token_mint, amount_usd, sender, route } = payload;
    if (!token_mint || !amount_usd) return;

    logger.info(`[MarketMonitor] Large Swap detected: ${amount_usd} USD on ${token_mint}`);

    // Whale alert check (e.g. swap > $100,000)
    await alertEngine.processTelemetry('whale', token_mint, amount_usd, { sender, swap_id, route });

    // Publish large swap event
    await eventEngine.publish({
      event_id: `evt_swap_${swap_id || Date.now()}`,
      topic: 'large_swaps',
      event_type: 'whale_swap',
      priority: amount_usd >= 500000 ? 'high' : 'medium',
      payload: { swap_id, token_mint, amount_usd, sender, route },
      timestamp: Date.now(),
    });
  }

  // Simulate injecting a feed tick for testing
  public simulateFeedTick(topic: string, payload: any): void {
    if (topic === 'price_stream') {
      this.handlePriceUpdate(payload);
    } else if (topic === 'large_swaps') {
      this.handleLargeSwapUpdate(payload);
    }
  }
}

export const marketMonitor = MarketMonitor.getInstance();
