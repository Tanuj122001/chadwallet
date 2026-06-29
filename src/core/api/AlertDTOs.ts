export type AlertType = 
  | 'price' 
  | 'portfolio' 
  | 'pnl' 
  | 'execution' 
  | 'simulation' 
  | 'mev' 
  | 'risk' 
  | 'whale' 
  | 'liquidity' 
  | 'wallet' 
  | 'security' 
  | 'transaction' 
  | 'gas' 
  | 'rpc';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRuleDTO {
  rule_id: string;
  type: AlertType;
  target: string; // e.g. token mint, symbol, 'portfolio_value'
  condition: 'gt' | 'lt' | 'eq' | 'pct_change' | 'regex' | 'match';
  value: any; // threshold value
  severity: AlertSeverity;
  is_active: boolean;
  created_at: number;
}

export interface AlertDTO {
  alert_id: string;
  rule_id?: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  payload: Record<string, any>;
  is_read: boolean;
}
