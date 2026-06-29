import { AutomationRuleDTO, AutomationHistoryDTO } from '../api/AutomationDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';
import { eventEngine } from './EventEngine';
import { featureFlagsManager } from '../api/FeatureFlags';

export class AutomationEngine {
  private static instance: AutomationEngine | null = null;
  private rulesCache: AutomationRuleDTO[] = [];
  private schedulerInterval?: any;

  private constructor() {
    this.loadRules();
    this.startScheduler();
  }

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  // Load automation rules from database
  public async loadRules(): Promise<void> {
    try {
      const repo = serviceLocator.getEventRepository();
      this.rulesCache = await repo.getAutomationRules();
      
      // Initialize default rules if empty
      if (this.rulesCache.length === 0) {
        await this.initializeDefaultRules();
      }
    } catch (err) {
      logger.error('[AutomationEngine] Failed to load automation rules', err);
    }
  }

  private async initializeDefaultRules(): Promise<void> {
    const defaults: AutomationRuleDTO[] = [
      {
        rule_id: 'auto_sync_portfolio',
        name: 'Auto Portfolio Refresh',
        action_type: 'sync_portfolio',
        interval_seconds: 60, // Refresh every 1 min
        is_enabled: true,
        next_run_timestamp: Date.now() + 60000,
      },
      {
        rule_id: 'auto_cleanup_cache',
        name: 'Auto Cache Purge',
        action_type: 'cleanup_cache',
        interval_seconds: 3600, // Clean every hour
        is_enabled: true,
        next_run_timestamp: Date.now() + 3600000,
      },
    ];

    const repo = serviceLocator.getEventRepository();
    for (const rule of defaults) {
      await repo.saveAutomationRule(rule);
    }
    this.rulesCache = defaults;
  }

  // Register a rule
  public async registerRule(rule: AutomationRuleDTO): Promise<void> {
    const repo = serviceLocator.getEventRepository();
    await repo.saveAutomationRule(rule);
    await this.loadRules();
  }

  // Scheduler evaluation tick
  private startScheduler(): void {
    this.schedulerInterval = setInterval(() => {
      this.evaluateRules();
    }, 1000);
  }

  public stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }

  // Evaluate enabled rules
  private async evaluateRules(): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_AUTOMATION')) return;

    const now = Date.now();
    for (const rule of this.rulesCache) {
      if (rule.is_enabled && now >= rule.next_run_timestamp) {
        // Execute rule action
        await this.executeAction(rule);
      }
    }
  }

  // Action executor
  private async executeAction(rule: AutomationRuleDTO): Promise<void> {
    const start = Date.now();
    logger.info(`[AutomationEngine] [EXECUTING] Action type: ${rule.action_type} for rule ${rule.name}`);

    let status: 'success' | 'failure' = 'success';
    let errorMessage: string | undefined;

    try {
      switch (rule.action_type) {
        case 'sync_portfolio':
          // Publish synchronization event
          await eventEngine.publish({
            event_id: `evt_auto_sync_${Date.now()}`,
            topic: 'portfolio_sync',
            event_type: 'sync_refresh_trigger',
            priority: 'medium',
            payload: { trigger_source: 'automation_scheduler' },
            timestamp: Date.now(),
          });
          break;

        case 'cleanup_cache':
          // Purges analytical caches
          await eventEngine.publish({
            event_id: `evt_auto_clean_${Date.now()}`,
            topic: 'cache_operations',
            event_type: 'cache_purge_trigger',
            priority: 'low',
            payload: { trigger_source: 'automation_scheduler' },
            timestamp: Date.now(),
          });
          break;

        case 'trigger_dca':
        case 'trigger_stop_loss':
        case 'trigger_take_profit':
          // Automated trading features are disabled by feature flags in this version
          throw new Error(`Action ${rule.action_type} is disabled by current active Feature Flags.`);
      }
    } catch (err: any) {
      status = 'failure';
      errorMessage = err.message || 'Unknown automation execution failure';
      logger.error(`[AutomationEngine] Execution failed for rule ${rule.name}`, err);
    }

    const duration = Date.now() - start;

    // Save execution history log
    const log: AutomationHistoryDTO = {
      log_id: `log_auto_${rule.rule_id}_${Date.now()}`,
      rule_id: rule.rule_id,
      action_type: rule.action_type,
      status,
      error_message: errorMessage,
      execution_duration_ms: duration,
      timestamp: Date.now(),
    };

    const repo = serviceLocator.getEventRepository();
    await repo.saveAutomationHistory(log);

    // Schedule next run
    rule.last_run_timestamp = start;
    rule.next_run_timestamp = Date.now() + rule.interval_seconds * 1000;
    await repo.saveAutomationRule(rule);
  }

  public async getHistory(): Promise<AutomationHistoryDTO[]> {
    const repo = serviceLocator.getEventRepository();
    return await repo.getAutomationHistory();
  }
}

export const automationEngine = AutomationEngine.getInstance();
