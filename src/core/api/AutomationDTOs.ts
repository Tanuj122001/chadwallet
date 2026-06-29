export type AutomationActionType = 
  | 'sync_portfolio' 
  | 'cleanup_cache' 
  | 'refresh_prices' 
  | 'trigger_dca' 
  | 'trigger_stop_loss' 
  | 'trigger_take_profit';

export interface AutomationRuleDTO {
  rule_id: string;
  name: string;
  action_type: AutomationActionType;
  interval_seconds: number;
  is_enabled: boolean;
  last_run_timestamp?: number;
  next_run_timestamp: number;
  params?: Record<string, any>;
}

export interface AutomationHistoryDTO {
  log_id: string;
  rule_id: string;
  action_type: AutomationActionType;
  status: 'success' | 'failure';
  error_message?: string;
  execution_duration_ms: number;
  timestamp: number;
}
