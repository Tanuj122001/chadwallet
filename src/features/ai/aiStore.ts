import { create } from 'zustand';
import { AIConversationDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';
import { serviceLocator } from '../../services';
import { aiCopilot, AIHistoryManager, AIFeedbackManager, AIConversationManager } from '../../core/wallet/AIEngine';

export interface AIStoreState {
  insights: AIInsightDTO[];
  predictions: AIPredictionDTO[];
  recommendations: AIRecommendationDTO[];
  activeConversation: AIConversationDTO | null;
  loading: boolean;
  error: string | null;
  cacheState: 'none' | 'hit' | 'stale';

  fetchBatchAnalysis: (walletAddress: string) => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<void>;
  askCopilot: (conversationId: string, prompt: string, walletAddress: string) => Promise<void>;
  submitFeedback: (targetId: string, targetType: any, positive: boolean, comment?: string) => Promise<void>;
}

export const useAIStore = create<AIStoreState>((set, _get) => ({
  insights: [],
  predictions: [],
  recommendations: [],
  activeConversation: null,
  loading: false,
  error: null,
  cacheState: 'none',

  fetchBatchAnalysis: async (walletAddress) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getAIRepository();
      
      // Serve SWR Cache first if hits exist
      const cachedInsights = await repo.getInsights();
      const cachedRecomms = await repo.getRecommendations();
      const cachedPredicts = await repo.getPredictions();

      if (cachedInsights.length > 0 || cachedRecomms.length > 0 || cachedPredicts.length > 0) {
        set({
          insights: cachedInsights,
          recommendations: cachedRecomms,
          predictions: cachedPredicts,
          cacheState: 'hit',
        });
      }

      // Background AI Preparation fetch
      const analysis = await aiCopilot.performBackgroundBatchAnalysis(walletAddress);

      set({
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        predictions: analysis.predictions,
        loading: false,
        cacheState: 'hit',
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch AI batch analysis', loading: false });
    }
  },

  fetchConversation: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      const conv = await AIHistoryManager.fetchConversation(conversationId);
      set({ activeConversation: conv, loading: false, cacheState: 'hit' });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch conversation history', loading: false });
    }
  },

  askCopilot: async (conversationId, prompt, walletAddress) => {
    try {
      const currentConv = _get().activeConversation || await AIHistoryManager.fetchConversation(conversationId);
      const updatedWithUser = AIConversationManager.appendMessage(currentConv, 'user', prompt, 'current');
      set({ activeConversation: updatedWithUser, loading: true, error: null });

      await aiCopilot.askCopilot(conversationId, prompt, walletAddress);
      
      // Refresh local active conversation state
      const updatedConv = await AIHistoryManager.fetchConversation(conversationId);
      set({ activeConversation: updatedConv, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to ask Copilot', loading: false });
    }
  },

  submitFeedback: async (targetId, targetType, positive, comment) => {
    try {
      await AIFeedbackManager.registerFeedback(targetId, targetType, positive, comment);
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit feedback' });
    }
  },
}));

export default useAIStore;
