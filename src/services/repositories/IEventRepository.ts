import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO, AutomationHistoryDTO } from '../../core/api/AutomationDTOs';

export interface IEventRepository {
  // Events
  saveEvent(event: EventDTO): Promise<void>;
  getPendingEvents(): Promise<EventDTO[]>;
  getEventHistory(): Promise<EventDTO[]>;
  clearEventHistory(): Promise<void>;

  // Alerts
  saveAlert(alert: AlertDTO): Promise<void>;
  getAlerts(unreadOnly?: boolean): Promise<AlertDTO[]>;
  markAlertAsRead(alertId: string): Promise<void>;
  markAllAlertsAsRead(): Promise<void>;
  saveAlertRule(rule: AlertRuleDTO): Promise<void>;
  getAlertRules(): Promise<AlertRuleDTO[]>;

  // Automation Rules
  saveAutomationRule(rule: AutomationRuleDTO): Promise<void>;
  getAutomationRules(): Promise<AutomationRuleDTO[]>;
  saveAutomationHistory(log: AutomationHistoryDTO): Promise<void>;
  getAutomationHistory(): Promise<AutomationHistoryDTO[]>;
}
