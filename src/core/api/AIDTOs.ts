export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIMessageDTO {
  message_id: string;
  role: AIMessageRole;
  content: string;
  timestamp: number;
  context_snapshot_id?: string;
}

export interface AIConversationDTO {
  conversation_id: string;
  messages: AIMessageDTO[];
  created_at: number;
  last_active_at: number;
}

export interface AIFeedbackDTO {
  feedback_id: string;
  target_id: string; // e.g. message_id, insight_id, recommendation_id
  target_type: 'chat_response' | 'insight' | 'recommendation' | 'prediction';
  is_positive: boolean; // thumbs up vs down
  comment?: string;
  timestamp: number;
}
