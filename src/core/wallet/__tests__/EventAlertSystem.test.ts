import { eventEngine } from '../EventEngine';
import { alertEngine } from '../AlertEngine';
import { marketMonitor } from '../MarketMonitor';
import { blockchainMonitor } from '../BlockchainMonitor';
import { securityMonitor } from '../SecurityMonitor';
import { automationEngine } from '../AutomationEngine';
import { backgroundSyncEngine } from '../BackgroundSyncEngine';
import { useNotificationStore, useEventStore, useAlertStore, useAutomationStore } from '../../../features/notifications/notificationStore';
import { serviceLocator } from '../../../services';
import { AlertRuleDTO } from '../../api/AlertDTOs';
import { AutomationRuleDTO } from '../../api/AutomationDTOs';

describe('Event, Alert, and Automation System Tests', () => {
  beforeEach(async () => {
    // Clear persistences
    await eventEngine.clearHistory();
    const repo = serviceLocator.getEventRepository();
    // Clear alerts & rules locally for clean testing
    const localDS = (repo as any).localDS;
    localDS.saveAlerts([]);
    localDS.saveAlertRules([]);
    localDS.saveAutomationRules([]);
    localDS.saveAutomationHistory([]);
    
    // Reset stores
    useEventStore.setState({ events: [], loading: false, error: null });
    useAlertStore.setState({ alerts: [], rules: [], unreadCount: 0, loading: false, error: null });
    useNotificationStore.setState({ notifications: [], unreadCount: 0, loading: false, error: null });
    useAutomationStore.setState({ rules: [], history: [], loading: false, error: null });

    // Stop schedulers
    eventEngine.stopScheduler();
    automationEngine.stopScheduler();
    backgroundSyncEngine.stopSyncScheduler();
  });

  afterAll(() => {
    eventEngine.stopScheduler();
    automationEngine.stopScheduler();
    backgroundSyncEngine.stopSyncScheduler();
  });

  // 1. EventEngine Verification
  describe('EventEngine Core Operations', () => {
    it('should publish and subscribe to priority-based event topics', async () => {
      const received: any[] = [];
      const unsub = eventEngine.subscribe('chain_ticks', (evt) => {
        received.push(evt);
      });

      await eventEngine.publish({
        event_id: 'evt_1',
        topic: 'chain_ticks',
        event_type: 'slot_updated',
        priority: 'high',
        payload: { slot: 100 },
        timestamp: Date.now(),
      });

      await new Promise(r => setTimeout(() => r(undefined), 20));

      expect(received).toHaveLength(1);
      expect(received[0].event_id).toBe('evt_1');
      expect(received[0].priority).toBe('high');
      
      unsub();
    });

    it('should filter duplicate events during publishing', async () => {
      const received: any[] = [];
      const unsub = eventEngine.subscribe('chain_ticks', (evt) => {
        received.push(evt);
      });

      await eventEngine.publish({
        event_id: 'evt_dup',
        topic: 'chain_ticks',
        event_type: 'slot_updated',
        priority: 'low',
        payload: { slot: 101 },
        timestamp: Date.now(),
      });

      await eventEngine.publish({
        event_id: 'evt_dup',
        topic: 'chain_ticks',
        event_type: 'slot_updated',
        priority: 'low',
        payload: { slot: 101 },
        timestamp: Date.now(),
      });

      await new Promise(r => setTimeout(() => r(undefined), 20));

      expect(received).toHaveLength(1);
      unsub();
    });

    it('should defer execution for delayed events', async () => {
      const received: any[] = [];
      const unsub = eventEngine.subscribe('chain_ticks', (evt) => {
        received.push(evt);
      });

      await eventEngine.publish({
        event_id: 'evt_delayed',
        topic: 'chain_ticks',
        event_type: 'slot_updated',
        priority: 'medium',
        payload: { slot: 102 },
        timestamp: Date.now(),
        delay_ms: 1000,
      });

      // Delayed, shouldn't dispatch immediately
      expect(received).toHaveLength(0);
      unsub();
    });
  });

  // 2. AlertEngine Verification
  describe('AlertEngine Evaluator Triggers', () => {
    it('should trigger alert rules when conditions are matched', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_sol_price',
        type: 'price',
        target: 'So11111111111111111111111111111111111111112',
        condition: 'gt',
        value: 150.0,
        severity: 'critical',
        is_active: true,
        created_at: Date.now(),
      };

      await alertEngine.registerRule(rule);
      
      // Target price Sol = 165 (gt 150) -> should trigger!
      await alertEngine.processTelemetry('price', 'So11111111111111111111111111111111111111112', 165);

      const triggered = await alertEngine.getTriggeredAlerts();
      expect(triggered).toHaveLength(1);
      expect(triggered[0].severity).toBe('critical');
      expect(triggered[0].payload.current_value).toBe(165);
    });

    it('should not trigger rule if conditions are not satisfied', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_sol_price_lt',
        type: 'price',
        target: 'So11111111111111111111111111111111111111112',
        condition: 'lt',
        value: 100.0,
        severity: 'warning',
        is_active: true,
        created_at: Date.now(),
      };

      await alertEngine.registerRule(rule);
      await alertEngine.processTelemetry('price', 'So11111111111111111111111111111111111111112', 120);

      const triggered = await alertEngine.getTriggeredAlerts();
      expect(triggered).toHaveLength(0);
    });
  });

  // 3. Monitors Verification
  describe('Telemetry Monitors', () => {
    it('should evaluate price breakout alerts in MarketMonitor', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_btc_breakout',
        type: 'price',
        target: 'BTC_mint',
        condition: 'gt',
        value: 60000,
        severity: 'warning',
        is_active: true,
        created_at: Date.now(),
      };
      await alertEngine.registerRule(rule);

      marketMonitor.simulateFeedTick('price_stream', {
        mint: 'BTC_mint',
        price: 65000,
        volume_24h: 5000000,
        mcap: 1200000000,
      });

      const triggered = await alertEngine.getTriggeredAlerts();
      expect(triggered).toHaveLength(1);
      expect(triggered[0].payload.target).toBe('BTC_mint');
    });

    it('should evaluate account transaction feeds in BlockchainMonitor', async () => {
      const testWallet = 'test_monitored_wallet';
      
      blockchainMonitor.simulateChainUpdate(testWallet, {
        signature: 'sig_blockchain_update_123',
        err: null,
        amount_lamports: 15000000000, // 15 SOL (triggers whale)
        counterparty: 'recipient_wallet_addr',
      });

      await new Promise(r => setTimeout(() => r(undefined), 20));

      const events = await eventEngine.getHistory();
      const txEvents = events.filter(e => e.topic === 'chain_transactions');
      expect(txEvents).toHaveLength(1);
      expect(txEvents[0].event_type).toBe('transaction_confirmed');
    });

    it('should catch security upgradeability hazards in SecurityMonitor', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_sec_upgrade',
        type: 'security',
        target: 'upgradeable_prog_id',
        condition: 'match',
        value: 'upgradeable_contract',
        severity: 'critical',
        is_active: true,
        created_at: Date.now(),
      };
      await alertEngine.registerRule(rule);

      await securityMonitor.monitorProgramUpgrade('upgradeable_prog_id', 'scam_wallet_address_12345', true);

      const triggered = await alertEngine.getTriggeredAlerts();
      expect(triggered).toHaveLength(1);
      expect(triggered[0].type).toBe('security');
    });
  });

  // 4. Automation & Background Sync Verification
  describe('Automation & Background Engine Tasks', () => {
    it('should schedule sync jobs and write logs in AutomationEngine', async () => {
      const rule: AutomationRuleDTO = {
        rule_id: 'rule_sync_now',
        name: 'Immediate Sync Rule',
        action_type: 'sync_portfolio',
        interval_seconds: 10,
        is_enabled: true,
        next_run_timestamp: Date.now() - 1000, // expired, triggers immediately
      };

      await automationEngine.registerRule(rule);
      
      // Force trigger rules evaluation tick
      await (automationEngine as any).evaluateRules();

      const history = await automationEngine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].rule_id).toBe('rule_sync_now');
      expect(history[0].status).toBe('success');
    });

    it('should queue sync actions during offline states in BackgroundSyncEngine', async () => {
      backgroundSyncEngine.setConnectionState(false); // Offline
      
      let syncCalled = false;
      backgroundSyncEngine.enqueueSyncAction('action_1', async () => {
        syncCalled = true;
        return true;
      });

      expect(syncCalled).toBe(false);
      expect(backgroundSyncEngine.getRetryQueueLength()).toBe(1);

      backgroundSyncEngine.setConnectionState(true); // Online -> triggers flush
      await new Promise(r => setTimeout(() => r(undefined), 10)); // Yield thread

      expect(syncCalled).toBe(true);
      expect(backgroundSyncEngine.getRetryQueueLength()).toBe(0);
    });
  });

  // 5. Stores Integration Verification
  describe('Zustand Stores Telemetry Integration', () => {
    it('should reflect unread counts and alerts correctly in AlertStore', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_test_store',
        type: 'portfolio',
        target: 'net_worth',
        condition: 'lt',
        value: 1000,
        severity: 'info',
        is_active: true,
        created_at: Date.now(),
      };
      await alertEngine.registerRule(rule);
      await alertEngine.processTelemetry('portfolio', 'net_worth', 850);

      // Fetch in AlertStore
      await useAlertStore.getState().fetchAlerts();

      const storeState = useAlertStore.getState();
      expect(storeState.alerts).toHaveLength(1);
      expect(storeState.unreadCount).toBe(1);
    });

    it('should sync notification list from alerts repository in NotificationStore', async () => {
      const rule: AlertRuleDTO = {
        rule_id: 'rule_test_notif',
        type: 'security',
        target: 'brute_force',
        condition: 'eq',
        value: 'active',
        severity: 'critical',
        is_active: true,
        created_at: Date.now(),
      };
      await alertEngine.registerRule(rule);
      await alertEngine.processTelemetry('security', 'brute_force', 'active');

      // Sync NotificationStore
      await useNotificationStore.getState().syncFromAlerts();

      const notifState = useNotificationStore.getState();
      expect(notifState.notifications).toHaveLength(1);
      expect(notifState.notifications[0].type).toBe('security');
      expect(notifState.unreadCount).toBe(1);
    });
  });
});
