import { solanaWebSocketManager } from '../websocket/WebSocketManager';
import { alertEngine } from './AlertEngine';
import { eventEngine } from './EventEngine';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export class BlockchainMonitor {
  private static instance: BlockchainMonitor | null = null;
  private activeUnsubscribers: (() => void)[] = [];
  private lastSlotTime = Date.now();
  private slotDelayThresholdMs = 2000; // slot delays > 2s indicate network lag

  private constructor() {}

  public static getInstance(): BlockchainMonitor {
    if (!BlockchainMonitor.instance) {
      BlockchainMonitor.instance = new BlockchainMonitor();
    }
    return BlockchainMonitor.instance;
  }

  // Start monitoring chain accounts and slots
  public async startMonitoring(walletAddresses: string[]): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_BLOCKCHAIN_MONITOR')) {
      logger.info('[BlockchainMonitor] Blockchain monitoring disabled by feature flag.');
      return;
    }

    logger.info(`[BlockchainMonitor] Starting blockchain monitors for ${walletAddresses.length} addresses...`);

    // 1. Subscribe to slots to check network latency & delays
    try {
      const unsubSlot = await solanaWebSocketManager.subscribeSlot((slotData: any) => {
        this.handleSlotTick(slotData);
      });
      this.activeUnsubscribers.push(unsubSlot);
    } catch (err) {
      logger.error('[BlockchainMonitor] Failed to subscribe to slot ticks', err);
    }

    // 2. Subscribe to each active wallet address
    for (const address of walletAddresses) {
      try {
        const unsubAccount = await solanaWebSocketManager.subscribeAccount(address, (accountData: any) => {
          this.handleAccountTxUpdate(address, accountData);
        });
        this.activeUnsubscribers.push(unsubAccount);
      } catch (err) {
        logger.error(`[BlockchainMonitor] Failed to subscribe to account ${address}`, err);
      }
    }
  }

  public stopMonitoring(): void {
    logger.info('[BlockchainMonitor] Stopping chain monitors.');
    this.activeUnsubscribers.forEach(unsub => unsub());
    this.activeUnsubscribers = [];
  }

  // Handles account transaction ticks
  private async handleAccountTxUpdate(address: string, txData: any): Promise<void> {
    const { signature, err, type, amount_lamports, counterparty } = txData;
    logger.info(`[BlockchainMonitor] TX update on address ${address}: Sig ${signature}, Err: ${err}`);

    // Determine type: incoming or outgoing transfer
    const isError = !!err;
    const alertType = isError ? 'rpc' : 'transaction';

    // 1. Evaluate Alert Trigger
    await alertEngine.processTelemetry(
      alertType, 
      address, 
      isError ? 'failed_tx' : 'confirmed_tx',
      { signature, amount_lamports, counterparty, err }
    );

    // If large transfer (e.g. > 10 SOL or 1,000,000,000 lamports)
    if (amount_lamports && amount_lamports >= 10000000000) {
      await alertEngine.processTelemetry('whale', address, amount_lamports, { signature, counterparty });
    }

    // 2. Publish event
    await eventEngine.publish({
      event_id: `evt_tx_${signature || Date.now()}`,
      topic: 'chain_transactions',
      event_type: isError ? 'transaction_failed' : 'transaction_confirmed',
      priority: isError ? 'high' : 'medium',
      payload: { address, signature, err, type, amount_lamports, counterparty },
      timestamp: Date.now(),
    });
  }

  // Handles slot updates to monitor network health & delays
  private async handleSlotTick(slotData: any): Promise<void> {
    const { slot, parent } = slotData;
    const now = Date.now();
    const delay = now - this.lastSlotTime;
    this.lastSlotTime = now;

    logger.debug(`[BlockchainMonitor] Slot Tick: Slot ${slot}, parent: ${parent}, time elapsed: ${delay}ms`);

    // If time between slots exceeds delay thresholds, check RPC health status
    if (delay > this.slotDelayThresholdMs) {
      logger.warn(`[BlockchainMonitor] Slot delay warning: ${delay}ms delay detected between slots.`);
      
      await alertEngine.processTelemetry('rpc', 'slot_delay', delay, { slot });

      await eventEngine.publish({
        event_id: `evt_slot_delay_${slot}_${now}`,
        topic: 'chain_health',
        event_type: 'network_slot_delay',
        priority: 'high',
        payload: { slot, parent, delay_ms: delay },
        timestamp: now,
      });
    } else {
      // Normal slot tick event
      await eventEngine.publish({
        event_id: `evt_slot_${slot}`,
        topic: 'chain_ticks',
        event_type: 'slot_updated',
        priority: 'low',
        payload: { slot, parent },
        timestamp: now,
      });
    }
  }

  // Simulate injecting chain updates for tests
  public simulateChainUpdate(address: string, data: any): void {
    this.handleAccountTxUpdate(address, data);
  }

  public simulateSlotTick(data: any): void {
    this.handleSlotTick(data);
  }
}

export const blockchainMonitor = BlockchainMonitor.getInstance();
