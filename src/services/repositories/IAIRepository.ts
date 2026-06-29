import { AIConversationDTO, AIFeedbackDTO, AIMessageDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';
import { AIContextSnapshotDTO } from '../../core/api/AIContextDTOs';

export interface IAIRepository {
  // Chat conversations
  getConversation(conversationId: string): Promise<AIConversationDTO | null>;
  saveConversation(conversation: AIConversationDTO): Promise<void>;
  clearConversation(conversationId: string): Promise<void>;
  
  // Feedback
  saveFeedback(feedback: AIFeedbackDTO): Promise<void>;
  getFeedbackList(): Promise<AIFeedbackDTO[]>;

  // Insights
  getInsights(category?: string): Promise<AIInsightDTO[]>;
  saveInsight(insight: AIInsightDTO): Promise<void>;
  clearInsights(): Promise<void>;

  // Recommendations
  getRecommendations(): Promise<AIRecommendationDTO[]>;
  saveRecommendation(recommendation: AIRecommendationDTO): Promise<void>;
  clearRecommendations(): Promise<void>;

  // Predictions
  getPredictions(): Promise<AIPredictionDTO[]>;
  savePrediction(prediction: AIPredictionDTO): Promise<void>;
  clearPredictions(): Promise<void>;

  // Remote queries
  fetchRemoteBatchAnalysis(context: AIContextSnapshotDTO): Promise<{
    insights: AIInsightDTO[];
    recommendations: AIRecommendationDTO[];
    predictions: AIPredictionDTO[];
  }>;
  fetchRemoteChatResponse(prompt: string, history: AIMessageDTO[], context: AIContextSnapshotDTO): Promise<string>;
}
