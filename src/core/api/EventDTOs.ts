export type EventPriority = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EventDTO {
  event_id: string;
  topic: string;
  event_type: string;
  priority: EventPriority;
  payload: Record<string, any>;
  timestamp: number;
  delay_ms?: number;
  status: EventStatus;
  retry_count: number;
}
