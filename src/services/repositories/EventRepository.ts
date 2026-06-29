import { IEventRepository } from './IEventRepository';
import { EventLocalDataSource } from '../datasources/EventLocalDataSource';
import { EventRemoteDataSource } from '../datasources/EventRemoteDataSource';
import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO, AutomationHistoryDTO } from '../../core/api/AutomationDTOs';
import { logger } from '../../utils/logger';

export class EventRepository implements IEventRepository {
  private localDS: EventLocalDataSource;
  private remoteDS: EventRemoteDataSource;

  constructor(localDS?: EventLocalDataSource, remoteDS?: EventRemoteDataSource) {
    this.localDS = localDS || new EventLocalDataSource();
    this.remoteDS = remoteDS || new EventRemoteDataSource();
  }

  // 1. Events
  public async saveEvent(event: EventDTO): Promise<void> {
    logger.debug(`[EventRepository] Saving event: ${event.event_id}`);
    const events = this.localDS.getEvents();
    
    // Deduplication check
    const exists = events.some(e => e.event_id === event.event_id);
    if (exists) {
      // Update status
      const updated = events.map(e => e.event_id === event.event_id ? event : e);
      this.localDS.saveEvents(updated);
      return;
    }

    events.unshift(event);
    // Keep max 100 events locally
    if (events.length > 100) {
      events.pop();
    }
    this.localDS.saveEvents(events);

    // Sync to remote in background
    this.remoteDS.syncEvents([event]).catch(err => {
      logger.error(`[EventRepository] Failed to sync event ${event.event_id} to remote`, err);
    });
  }

  public async getPendingEvents(): Promise<EventDTO[]> {
    const events = this.localDS.getEvents();
    return events.filter(e => e.status === 'pending');
  }

  public async getEventHistory(): Promise<EventDTO[]> {
    return this.localDS.getEvents();
  }

  public async clearEventHistory(): Promise<void> {
    this.localDS.saveEvents([]);
  }

  // 2. Alerts
  public async saveAlert(alert: AlertDTO): Promise<void> {
    logger.debug(`[EventRepository] Saving alert: ${alert.alert_id}`);
    const alerts = this.localDS.getAlerts();
    
    // Deduplication
    const exists = alerts.some(a => a.alert_id === alert.alert_id);
    if (exists) {
      const updated = alerts.map(a => a.alert_id === alert.alert_id ? alert : a);
      this.localDS.saveAlerts(updated);
      return;
    }

    alerts.unshift(alert);
    if (alerts.length > 100) {
      alerts.pop();
    }
    this.localDS.saveAlerts(alerts);

    this.remoteDS.syncAlerts([alert]).catch(err => {
      logger.error(`[EventRepository] Failed to sync alert ${alert.alert_id} to remote`, err);
    });
  }

  public async getAlerts(unreadOnly?: boolean): Promise<AlertDTO[]> {
    const alerts = this.localDS.getAlerts();
    if (unreadOnly) {
      return alerts.filter(a => !a.is_read);
    }
    return alerts;
  }

  public async markAlertAsRead(alertId: string): Promise<void> {
    const alerts = this.localDS.getAlerts();
    const updated = alerts.map(a => a.alert_id === alertId ? { ...a, is_read: true } : a);
    this.localDS.saveAlerts(updated);
  }

  public async markAllAlertsAsRead(): Promise<void> {
    const alerts = this.localDS.getAlerts();
    const updated = alerts.map(a => ({ ...a, is_read: true }));
    this.localDS.saveAlerts(updated);
  }

  public async saveAlertRule(rule: AlertRuleDTO): Promise<void> {
    logger.debug(`[EventRepository] Saving alert rule: ${rule.rule_id}`);
    const rules = this.localDS.getAlertRules();
    const updated = rules.filter(r => r.rule_id !== rule.rule_id);
    updated.push(rule);
    this.localDS.saveAlertRules(updated);

    this.remoteDS.syncAlertRules([rule]).catch(err => {
      logger.error(`[EventRepository] Failed to sync alert rule ${rule.rule_id} to remote`, err);
    });
  }

  public async getAlertRules(): Promise<AlertRuleDTO[]> {
    return this.localDS.getAlertRules();
  }

  // 3. Automation Rules
  public async saveAutomationRule(rule: AutomationRuleDTO): Promise<void> {
    logger.debug(`[EventRepository] Saving automation rule: ${rule.rule_id}`);
    const rules = this.localDS.getAutomationRules();
    const updated = rules.filter(r => r.rule_id !== rule.rule_id);
    updated.push(rule);
    this.localDS.saveAutomationRules(updated);

    this.remoteDS.syncAutomationRules([rule]).catch(err => {
      logger.error(`[EventRepository] Failed to sync automation rule ${rule.rule_id} to remote`, err);
    });
  }

  public async getAutomationRules(): Promise<AutomationRuleDTO[]> {
    return this.localDS.getAutomationRules();
  }

  public async saveAutomationHistory(log: AutomationHistoryDTO): Promise<void> {
    logger.debug(`[EventRepository] Saving automation history entry: ${log.log_id}`);
    const history = this.localDS.getAutomationHistory();
    history.unshift(log);
    if (history.length > 100) {
      history.pop();
    }
    this.localDS.saveAutomationHistory(history);
  }

  public async getAutomationHistory(): Promise<AutomationHistoryDTO[]> {
    return this.localDS.getAutomationHistory();
  }
}
