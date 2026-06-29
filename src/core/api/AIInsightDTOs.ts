export type AIInsightCategory = 'portfolio' | 'market' | 'trade' | 'blockchain' | 'security' | 'predictive';
export type AIInsightSeverity = 'info' | 'warning' | 'critical';

export interface AIInsightDTO {
  insight_id: string;
  category: AIInsightCategory;
  title: string;
  description: string;
  explanation: string; // Explains everything
  severity: AIInsightSeverity;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AIPredictionDTO {
  prediction_id: string;
  metric: 'portfolio_trend' | 'pnl_trend' | 'risk_trend' | 'volatility_trend' | 'cash_flow_trend' | 'holding_concentration_trend' | 'market_exposure_trend';
  estimate_direction: 'up' | 'down' | 'flat';
  expected_value: number; // estimated value or index shift
  confidence_score: number; // 0.0 to 1.0
  reasoning_assumptions: string;
  timestamp: number;
}
