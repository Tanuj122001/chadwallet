import { localStorage } from '../../core/storage';
import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO, AutomationHistoryDTO } from '../../core/api/AutomationDTOs';

export class EventLocalDataSource {
  private readonly EVENTS_KEY = 'events_history_list';
  private readonly ALERTS_KEY = 'alerts_history_list';
  private readonly ALERT_RULES_KEY = 'alerts_rules_list';
  private readonly AUTOMATION_RULES_KEY = 'automation_rules_list';
  private readonly AUTOMATION_HISTORY_KEY = 'automation_history_list';

  public getEvents(): EventDTO[] {
    const raw = localStorage.getString(this.EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public saveEvents(events: EventDTO[]): void {
    localStorage.setString(this.EVENTS_KEY, JSON.stringify(events));
  }

  public getAlerts(): AlertDTO[] {
    const raw = localStorage.getString(this.ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAlerts(alerts: AlertDTO[]): void {
    localStorage.setString(this.ALERTS_KEY, JSON.stringify(alerts));
  }

  public getAlertRules(): AlertRuleDTO[] {
    const raw = localStorage.getString(this.ALERT_RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAlertRules(rules: AlertRuleDTO[]): void {
    localStorage.setString(this.ALERT_RULES_KEY, JSON.stringify(rules));
  }

  public getAutomationRules(): AutomationRuleDTO[] {
    const raw = localStorage.getString(this.AUTOMATION_RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAutomationRules(rules: AutomationRuleDTO[]): void {
    localStorage.setString(this.AUTOMATION_RULES_KEY, JSON.stringify(rules));
  }

  public getAutomationHistory(): AutomationHistoryDTO[] {
    const raw = localStorage.getString(this.AUTOMATION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public saveAutomationHistory(history: AutomationHistoryDTO[]): void {
    localStorage.setString(this.AUTOMATION_HISTORY_KEY, JSON.stringify(history));
  }
}
