import { localStorage } from '../../core/storage';
import { AIConversationDTO, AIFeedbackDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';

export class AILocalDataSource {
  private readonly CONV_KEY_PREFIX = 'ai_conv_';
  private readonly FEEDBACK_KEY = 'ai_feedback_list';
  private readonly INSIGHTS_KEY = 'ai_insights_list';
  private readonly RECOMMS_KEY = 'ai_recomms_list';
  private readonly PREDICTS_KEY = 'ai_predicts_list';

  public getConversation(id: string): AIConversationDTO | null {
    try {
      const data = localStorage.getString(`${this.CONV_KEY_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveConversation(conv: AIConversationDTO): void {
    try {
      localStorage.setString(`${this.CONV_KEY_PREFIX}${conv.conversation_id}`, JSON.stringify(conv));
    } catch {}
  }

  public deleteConversation(id: string): void {
    try {
      localStorage.removeItem(`${this.CONV_KEY_PREFIX}${id}`);
    } catch {}
  }

  public getFeedback(): AIFeedbackDTO[] {
    try {
      const data = localStorage.getString(this.FEEDBACK_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveFeedback(feedback: AIFeedbackDTO): void {
    try {
      const list = this.getFeedback();
      list.push(feedback);
      localStorage.setString(this.FEEDBACK_KEY, JSON.stringify(list));
    } catch {}
  }

  public getInsights(): AIInsightDTO[] {
    try {
      const data = localStorage.getString(this.INSIGHTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveInsights(insights: AIInsightDTO[]): void {
    try {
      localStorage.setString(this.INSIGHTS_KEY, JSON.stringify(insights));
    } catch {}
  }

  public getRecommendations(): AIRecommendationDTO[] {
    try {
      const data = localStorage.getString(this.RECOMMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveRecommendations(recomms: AIRecommendationDTO[]): void {
    try {
      localStorage.setString(this.RECOMMS_KEY, JSON.stringify(recomms));
    } catch {}
  }

  public getPredictions(): AIPredictionDTO[] {
    try {
      const data = localStorage.getString(this.PREDICTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public savePredictions(predicts: AIPredictionDTO[]): void {
    try {
      localStorage.setString(this.PREDICTS_KEY, JSON.stringify(predicts));
    } catch {}
  }
}
