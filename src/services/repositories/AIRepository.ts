import { IAIRepository } from './IAIRepository';
import { AILocalDataSource } from '../datasources/AILocalDataSource';
import { AIRemoteDataSource } from '../datasources/AIRemoteDataSource';
import { AIConversationDTO, AIFeedbackDTO, AIMessageDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';
import { AIContextSnapshotDTO } from '../../core/api/AIContextDTOs';
import { AIMapper } from './AIMapper';

export class AIRepository implements IAIRepository {
  private localDS: AILocalDataSource;
  private remoteDS: AIRemoteDataSource;

  constructor() {
    this.localDS = new AILocalDataSource();
    this.remoteDS = new AIRemoteDataSource();
  }

  public async getConversation(conversationId: string): Promise<AIConversationDTO | null> {
    const data = this.localDS.getConversation(conversationId);
    return data ? AIMapper.mapConversationToModel(data) : null;
  }

  public async saveConversation(conversation: AIConversationDTO): Promise<void> {
    this.localDS.saveConversation(conversation);
  }

  public async clearConversation(conversationId: string): Promise<void> {
    this.localDS.deleteConversation(conversationId);
  }

  public async saveFeedback(feedback: AIFeedbackDTO): Promise<void> {
    this.localDS.saveFeedback(feedback);
  }

  public async getFeedbackList(): Promise<AIFeedbackDTO[]> {
    return this.localDS.getFeedback();
  }

  public async getInsights(category?: string): Promise<AIInsightDTO[]> {
    const cached = this.localDS.getInsights();
    if (category) {
      return cached.filter(i => i.category === category).map(AIMapper.mapInsightToModel);
    }
    return cached.map(AIMapper.mapInsightToModel);
  }

  public async saveInsight(insight: AIInsightDTO): Promise<void> {
    const list = this.localDS.getInsights();
    // Exclude duplicates
    const filtered = list.filter(i => i.insight_id !== insight.insight_id);
    filtered.unshift(insight);
    // Keep max 50 insights
    if (filtered.length > 50) {
      filtered.pop();
    }
    this.localDS.saveInsights(filtered);
  }

  public async clearInsights(): Promise<void> {
    this.localDS.saveInsights([]);
  }

  public async getRecommendations(): Promise<AIRecommendationDTO[]> {
    const cached = this.localDS.getRecommendations();
    return cached.map(AIMapper.mapRecommendationToModel);
  }

  public async saveRecommendation(recommendation: AIRecommendationDTO): Promise<void> {
    const list = this.localDS.getRecommendations();
    const filtered = list.filter(r => r.recommendation_id !== recommendation.recommendation_id);
    filtered.unshift(recommendation);
    if (filtered.length > 20) {
      filtered.pop();
    }
    this.localDS.saveRecommendations(filtered);
  }

  public async clearRecommendations(): Promise<void> {
    this.localDS.saveRecommendations([]);
  }

  public async getPredictions(): Promise<AIPredictionDTO[]> {
    const cached = this.localDS.getPredictions();
    return cached.map(AIMapper.mapPredictionToModel);
  }

  public async savePrediction(prediction: AIPredictionDTO): Promise<void> {
    const list = this.localDS.getPredictions();
    const filtered = list.filter(p => p.prediction_id !== prediction.prediction_id);
    filtered.unshift(prediction);
    if (filtered.length > 20) {
      filtered.pop();
    }
    this.localDS.savePredictions(filtered);
  }

  public async clearPredictions(): Promise<void> {
    this.localDS.savePredictions([]);
  }

  // Triggered externally by engines to run remote batch updates
  public async fetchRemoteBatchAnalysis(context: AIContextSnapshotDTO): Promise<{
    insights: AIInsightDTO[];
    recommendations: AIRecommendationDTO[];
    predictions: AIPredictionDTO[];
  }> {
    const [insights, recommendations, predictions] = await Promise.all([
      this.remoteDS.generateInsights(context),
      this.remoteDS.generateRecommendations(context),
      this.remoteDS.generatePredictions(context),
    ]);

    // Save fetched items locally
    this.localDS.saveInsights(insights);
    this.localDS.saveRecommendations(recommendations);
    this.localDS.savePredictions(predictions);

    return { insights, recommendations, predictions };
  }

  // Generates chat responses remotely
  public async fetchRemoteChatResponse(prompt: string, history: AIMessageDTO[], context: AIContextSnapshotDTO): Promise<string> {
    return await this.remoteDS.generateChatResponse(prompt, history, context);
  }
}
