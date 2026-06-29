import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO } from '../../core/api/AutomationDTOs';

export class EventRemoteDataSource {
  // Simulates remote syncing. Returns true if sync succeeds.
  public async syncEvents(events: EventDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAlerts(alerts: AlertDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAlertRules(rules: AlertRuleDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAutomationRules(rules: AutomationRuleDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }
}
