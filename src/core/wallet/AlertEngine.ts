import { AlertDTO, AlertRuleDTO, AlertSeverity, AlertType } from '../api/AlertDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';
import { eventEngine } from './EventEngine';
import { featureFlagsManager } from '../api/FeatureFlags';

export class AlertEngine {
  private static instance: AlertEngine | null = null;
  private alertQueue: AlertDTO[] = [];
  private alertCache = new Map<string, AlertRuleDTO[]>(); // type -> rules

  private constructor() {
    this.loadRulesIntoCache();
  }

  public static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  // Load rules from storage to memory
  public async loadRulesIntoCache(): Promise<void> {
    try {
      const repo = serviceLocator.getEventRepository();
      const rules = await repo.getAlertRules();
      this.alertCache.clear();
      rules.forEach(rule => {
        if (rule.is_active) {
          let list = this.alertCache.get(rule.type);
          if (!list) {
            list = [];
            this.alertCache.set(rule.type, list);
          }
          list.push(rule);
        }
      });
      logger.debug('[AlertEngine] Loaded alert rules cache successfully.');
    } catch (err) {
      logger.error('[AlertEngine] Failed to load alert rules into cache', err);
    }
  }

  // Process incoming telemetry / event to see if it triggers any alerts
  public async processTelemetry(type: AlertType, target: string, currentValue: any, meta?: Record<string, any>): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_ALERTS')) {
      return;
    }

    const rules = this.alertCache.get(type) || [];
    const matchedRules = rules.filter(rule => rule.target === target);

    for (const rule of matchedRules) {
      let isTriggered = false;

      switch (rule.condition) {
        case 'gt':
          isTriggered = Number(currentValue) > Number(rule.value);
          break;
        case 'lt':
          isTriggered = Number(currentValue) < Number(rule.value);
          break;
        case 'eq':
          isTriggered = currentValue === rule.value;
          break;
        case 'match':
          isTriggered = String(currentValue).toLowerCase() === String(rule.value).toLowerCase();
          break;
        case 'regex':
          try {
            const regex = new RegExp(rule.value, 'i');
            isTriggered = regex.test(String(currentValue));
          } catch {
            isTriggered = false;
          }
          break;
        case 'pct_change':
          // For percent change, expect value to contain threshold percentage
          const previous = meta?.previousValue;
          if (previous && previous !== 0) {
            const diff = Math.abs(currentValue - previous);
            const pct = (diff / previous) * 100;
            isTriggered = pct >= Number(rule.value);
          }
          break;
      }

      if (isTriggered) {
        await this.triggerAlert(rule, currentValue, meta);
      }
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRuleDTO, currentValue: any, meta?: Record<string, any>): Promise<void> {
    const alertId = `alert_${rule.type}_${rule.rule_id}_${Date.now()}`;
    const title = `Alert Triggered: ${rule.type.toUpperCase()}`;
    const message = `Condition met for target ${rule.target}. Threshold ${rule.condition} ${rule.value}, current value is ${currentValue}.`;

    const alert: AlertDTO = {
      alert_id: alertId,
      rule_id: rule.rule_id,
      type: rule.type,
      title,
      message,
      severity: rule.severity,
      timestamp: Date.now(),
      payload: {
        target: rule.target,
        current_value: currentValue,
        condition: rule.condition,
        threshold: rule.value,
        ...meta,
      },
      is_read: false,
    };

    logger.warn(`[AlertEngine] [TRIGGERED] [${rule.severity.toUpperCase()}] ${title}: ${message}`);

    // Queue alert for dispatcher
    this.alertQueue.push(alert);
    
    // Save to persistence
    const repo = serviceLocator.getEventRepository();
    await repo.saveAlert(alert);

    // Publish alert event to Event Engine
    await eventEngine.publish({
      event_id: `evt_alert_${alertId}`,
      topic: 'alert_triggered',
      event_type: `alert_${rule.type}`,
      priority: rule.severity === 'critical' ? 'critical' : rule.severity === 'warning' ? 'high' : 'medium',
      payload: alert as unknown as Record<string, any>,
      timestamp: Date.now(),
    });
  }

  // Set / Register a new alert rule
  public async registerRule(rule: AlertRuleDTO): Promise<void> {
    const repo = serviceLocator.getEventRepository();
    await repo.saveAlertRule(rule);
    await this.loadRulesIntoCache();
  }

  // Retrieve alert list
  public async getTriggeredAlerts(unreadOnly?: boolean): Promise<AlertDTO[]> {
    const repo = serviceLocator.getEventRepository();
    return await repo.getAlerts(unreadOnly);
  }

  // Mark single alert read
  public async markAlertAsRead(alertId: string): Promise<void> {
    const repo = serviceLocator.getEventRepository();
    await repo.markAlertAsRead(alertId);
  }

  // Mark all alerts read
  public async markAllAlertsAsRead(): Promise<void> {
    const repo = serviceLocator.getEventRepository();
    await repo.markAllAlertsAsRead();
  }
}

export const alertEngine = AlertEngine.getInstance();
