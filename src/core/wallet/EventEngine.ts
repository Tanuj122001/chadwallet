import { EventDTO, EventPriority } from '../api/EventDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export type EventCallback = (event: EventDTO) => void | Promise<void>;

export class EventEngine {
  private static instance: EventEngine | null = null;
  private subscribers = new Map<string, Set<EventCallback>>();
  private eventQueue: EventDTO[] = [];
  private isProcessing = false;
  private schedulerInterval?: any;

  private constructor() {
    this.startScheduler();
  }

  public static getInstance(): EventEngine {
    if (!EventEngine.instance) {
      EventEngine.instance = new EventEngine();
    }
    return EventEngine.instance;
  }

  // Publish an event
  public async publish(eventInput: Omit<EventDTO, 'status' | 'retry_count'>): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_EVENTS')) {
      logger.info('[EventEngine] Events disabled by feature flag. Skipping.');
      return;
    }

    const event: EventDTO = {
      ...eventInput,
      status: 'pending',
      retry_count: 0,
    };

    // Deduplication check
    const history = await this.getHistory();
    const isDuplicate = history.some(h => h.event_id === event.event_id);
    if (isDuplicate) {
      logger.warn(`[EventEngine] Duplicate event detected: ${event.event_id}. Skipping.`);
      return;
    }

    logger.debug(`[EventEngine] Publishing event ${event.event_id} on topic ${event.topic}`);

    // If it has a delay, schedule it for later
    if (event.delay_ms && event.delay_ms > 0) {
      this.eventQueue.push(event);
      await this.persistEvent(event);
      return;
    }

    // Otherwise, push to priority queue and process
    this.enqueuePriority(event);
    await this.persistEvent(event);
    this.processQueue();
  }

  // Subscribe to a topic
  public subscribe(topic: string, callback: EventCallback): () => void {
    logger.debug(`[EventEngine] Subscribing to topic: ${topic}`);
    let subs = this.subscribers.get(topic);
    if (!subs) {
      subs = new Set<EventCallback>();
      this.subscribers.set(topic, subs);
    }
    subs.add(callback);

    return () => {
      logger.debug(`[EventEngine] Unsubscribing from topic: ${topic}`);
      const current = this.subscribers.get(topic);
      if (current) {
        current.delete(callback);
        if (current.size === 0) {
          this.subscribers.delete(topic);
        }
      }
    };
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;

        // Skip if delayed and not ready
        if (event.delay_ms && event.delay_ms > 0 && Date.now() < event.timestamp + event.delay_ms) {
          // Re-queue delayed event
          this.eventQueue.push(event);
          // Yield to prevent infinite loop
          await new Promise(r => setTimeout(() => r(undefined), 10));
          continue;
        }

        event.status = 'processing';
        await this.persistEvent(event);

        try {
          const topicSubs = this.subscribers.get(event.topic);
          if (topicSubs && topicSubs.size > 0) {
            const promises = Array.from(topicSubs).map(cb => {
              try {
                return Promise.resolve(cb(event));
              } catch (err) {
                logger.error(`[EventEngine] Error in subscriber callback for topic ${event.topic}`, err);
                return Promise.reject(err);
              }
            });
            await Promise.all(promises);
          }

          event.status = 'completed';
          await this.persistEvent(event);
        } catch (err) {
          logger.error(`[EventEngine] Failed to dispatch event ${event.event_id}`, err);
          event.status = 'failed';
          event.retry_count += 1;
          await this.persistEvent(event);

          // Retry logic (max 3 retries)
          if (event.retry_count < 3) {
            logger.info(`[EventEngine] Retrying event ${event.event_id} (Attempt ${event.retry_count})`);
            event.status = 'pending';
            this.enqueuePriority(event);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper to insert event into queue based on priority
  private enqueuePriority(event: EventDTO): void {
    const priorityWeights: Record<EventPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const weight = priorityWeights[event.priority] || 0;
    let index = 0;
    while (index < this.eventQueue.length) {
      const currentWeight = priorityWeights[this.eventQueue[index].priority] || 0;
      if (weight > currentWeight) {
        break;
      }
      index++;
    }
    this.eventQueue.splice(index, 0, event);
  }

  // Replay events from history
  public async replayEvents(topic?: string): Promise<void> {
    logger.info(`[EventEngine] Replaying events. Filter: ${topic || 'all'}`);
    const history = await this.getHistory();
    const filtered = topic ? history.filter(h => h.topic === topic) : history;
    
    // Sort oldest first for replay order
    const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const event of sorted) {
      this.enqueuePriority({
        ...event,
        event_id: `${event.event_id}_replay_${Date.now()}`,
        status: 'pending',
        retry_count: 0,
      });
    }
    this.processQueue();
  }

  // Start periodic scheduler for delayed/background events
  private startScheduler(): void {
    this.schedulerInterval = setInterval(() => {
      // Flush eligible delayed events
      this.processQueue();
    }, 1000);
  }

  // Stop scheduler (used for cleanup or tests)
  public stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }

  // Persists event to repository
  private async persistEvent(event: EventDTO): Promise<void> {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.saveEvent(event);
    } catch (err) {
      logger.error('[EventEngine] Failed to persist event to repository', err);
    }
  }

  // Retrieve event history
  public async getHistory(): Promise<EventDTO[]> {
    try {
      const repo = serviceLocator.getEventRepository();
      return await repo.getEventHistory();
    } catch {
      return [];
    }
  }

  public async clearHistory(): Promise<void> {
    try {
      const repo = serviceLocator.getEventRepository();
      await repo.clearEventHistory();
      this.eventQueue = [];
    } catch (err) {
      logger.error('[EventEngine] Failed to clear event history', err);
    }
  }
}

export const eventEngine = EventEngine.getInstance();
