export interface AIRecommendationDTO {
  recommendation_id: string;
  title: string;
  action_type: 'rebalance' | 'diversify' | 'security_patch' | 'stake' | 'none';
  action_description: string;
  rationale: string;
  risk_assessment: string;
  target_assets?: Array<{
    mint: string;
    symbol: string;
    current_percentage: number;
    target_percentage: number;
  }>;
  confidence_score: number; // 0.0 to 1.0
  timestamp: number;
}
