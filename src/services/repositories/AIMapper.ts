import { AIConversationDTO, AIMessageDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';

export class AIMapper {
  public static mapMessageToModel(dto: AIMessageDTO): AIMessageDTO {
    return { ...dto };
  }

  public static mapConversationToModel(dto: AIConversationDTO): AIConversationDTO {
    return {
      ...dto,
      messages: dto.messages.map(this.mapMessageToModel),
    };
  }

  public static mapInsightToModel(dto: AIInsightDTO): AIInsightDTO {
    return { ...dto };
  }

  public static mapPredictionToModel(dto: AIPredictionDTO): AIPredictionDTO {
    return { ...dto };
  }

  public static mapRecommendationToModel(dto: AIRecommendationDTO): AIRecommendationDTO {
    return { ...dto };
  }
}
