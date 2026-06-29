import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO } from '../../core/api/AutomationDTOs';

export class EventRemoteDataSource {
  // Simulates remote syncing. Returns true if sync succeeds.
  public async syncEvents(_events: EventDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAlerts(_alerts: AlertDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAlertRules(_rules: AlertRuleDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }

  public async syncAutomationRules(_rules: AutomationRuleDTO[]): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 50);
    });
  }
}
