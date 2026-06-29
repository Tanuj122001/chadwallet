import { create } from 'zustand';
import { EventDTO } from '../../core/api/EventDTOs';
import { AlertDTO, AlertRuleDTO } from '../../core/api/AlertDTOs';
import { AutomationRuleDTO, AutomationHistoryDTO } from '../../core/api/AutomationDTOs';
import { Notification } from '../../core/models';
import { serviceLocator } from '../../services';
import { EventMapper } from '../../services/repositories/EventMapper';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------
// 1. Event Store
// ---------------------------------------------------------
export interface EventStoreState {
  events: EventDTO[];
  loading: boolean;
  error: string | null;
  cacheState: 'none' | 'hit' | 'stale';
  fetchEvents: () => Promise<void>;
  clearEvents: () => Promise<void>;
}

export const useEventStore = create<EventStoreState>((set) => ({
  events: [],
  loading: false,
  error: null,
  cacheState: 'none',
  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getEventRepository();
      const events = await repo.getEventHistory();
      set({ events, loading: false, cacheState: 'hit' });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch events', loading: false });
    }
  },
  clearEvents: async () => {
    set({ loading: true });
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.clearEventHistory();
      set({ events: [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to clear events', loading: false });
    }
  },
}));

// ---------------------------------------------------------
// 2. Alert Store
// ---------------------------------------------------------
export interface AlertStoreState {
  alerts: AlertDTO[];
  rules: AlertRuleDTO[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  cacheState: 'none' | 'hit' | 'stale';
  fetchAlerts: (unreadOnly?: boolean) => Promise<void>;
  fetchRules: () => Promise<void>;
  addRule: (rule: AlertRuleDTO) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  markAllAlertsAsRead: () => Promise<void>;
}

export const useAlertStore = create<AlertStoreState>((set, get) => ({
  alerts: [],
  rules: [],
  unreadCount: 0,
  loading: false,
  error: null,
  cacheState: 'none',
  fetchAlerts: async (unreadOnly) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getEventRepository();
      const alerts = await repo.getAlerts(unreadOnly);
      const allAlerts = await repo.getAlerts();
      set({ 
        alerts, 
        unreadCount: allAlerts.filter(a => !a.is_read).length, 
        loading: false,
        cacheState: 'hit' 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch alerts', loading: false });
    }
  },
  fetchRules: async () => {
    try {
      const repo = serviceLocator.getEventRepository();
      const rules = await repo.getAlertRules();
      set({ rules });
    } catch (err: any) {
      logger.error('Failed to fetch alert rules in store', err);
    }
  },
  addRule: async (rule) => {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.saveAlertRule(rule);
      await get().fetchRules();
    } catch (err: any) {
      set({ error: err.message || 'Failed to add alert rule' });
    }
  },
  markAlertAsRead: async (alertId) => {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.markAlertAsRead(alertId);
      await get().fetchAlerts();
    } catch (err: any) {
      set({ error: err.message || 'Failed to mark alert read' });
    }
  },
  markAllAlertsAsRead: async () => {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.markAllAlertsAsRead();
      await get().fetchAlerts();
    } catch (err: any) {
      set({ error: err.message || 'Failed to mark all alerts read' });
    }
  },
}));

// ---------------------------------------------------------
// 3. Notification Store (Maintains Backwards Compatibility)
// ---------------------------------------------------------
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  cacheState: 'none' | 'hit' | 'stale';
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  syncFromAlerts: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  cacheState: 'none',
  addNotification: (notification) => {
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },
  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      
      // Mirror to repo if it exists as alert
      const repo = serviceLocator.getEventRepository();
      repo.markAlertAsRead(id).catch(err => {
        logger.error(`Failed to mirror alert read status for ${id}`, err);
      });

      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },
  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
      
      const repo = serviceLocator.getEventRepository();
      repo.markAllAlertsAsRead().catch(err => {
        logger.error('Failed to mirror all alert read status', err);
      });

      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },
  syncFromAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getEventRepository();
      const alerts = await repo.getAlerts();
      const mapped = alerts.map(a => EventMapper.toNotificationModel(EventMapper.alertToNotificationDTO(a)));
      set({ 
        notifications: mapped, 
        unreadCount: mapped.filter(n => !n.isRead).length,
        loading: false,
        cacheState: 'hit'
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to sync notifications', loading: false });
    }
  },
}));

// ---------------------------------------------------------
// 4. Automation Store
// ---------------------------------------------------------
export interface AutomationStoreState {
  rules: AutomationRuleDTO[];
  history: AutomationHistoryDTO[];
  loading: boolean;
  error: string | null;
  cacheState: 'none' | 'hit' | 'stale';
  fetchRules: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  addRule: (rule: AutomationRuleDTO) => Promise<void>;
}

export const useAutomationStore = create<AutomationStoreState>((set, get) => ({
  rules: [],
  history: [],
  loading: false,
  error: null,
  cacheState: 'none',
  fetchRules: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getEventRepository();
      const rules = await repo.getAutomationRules();
      set({ rules, loading: false, cacheState: 'hit' });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch automation rules', loading: false });
    }
  },
  fetchHistory: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getEventRepository();
      const history = await repo.getAutomationHistory();
      set({ history, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch automation history', loading: false });
    }
  },
  addRule: async (rule) => {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.saveAutomationRule(rule);
      await get().fetchRules();
    } catch (err: any) {
      set({ error: err.message || 'Failed to add automation rule' });
    }
  },
}));

export default useNotificationStore;
