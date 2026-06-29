import { aiCopilot, AIContextBuilder, AIConversationManager, AIRecommendationEngine, AIReasoningEngine, AIInsightEngine, AIPromptBuilder, AITokenAnalyzer, AIHistoryManager, AIFeedbackManager } from '../AIEngine';
import { useAIStore } from '../../../features/ai/aiStore';
import { serviceLocator } from '../../../services';
import { AIConversationDTO } from '../../api/AIDTOs';
import { eventEngine } from '../EventEngine';
import { alertEngine } from '../AlertEngine';
import { AlertRuleDTO } from '../../api/AlertDTOs';

describe('AI Copilot & Intelligence System Tests', () => {
  const testWallet = 'test_wallet_address_555';
  const testConvId = 'conv_test_123';
  const storeConvId = 'conv_store_123';

  beforeEach(async () => {
    // Clear persistences
    const repo = serviceLocator.getAIRepository();
    const localDS = (repo as any).localDS;
    localDS.deleteConversation(testConvId);
    localDS.deleteConversation(storeConvId);
    localDS.saveInsights([]);
    localDS.saveRecommendations([]);
    localDS.savePredictions([]);
    await eventEngine.clearHistory();

    // Reset stores
    useAIStore.setState({
      insights: [],
      predictions: [],
      recommendations: [],
      activeConversation: null,
      loading: false,
      error: null,
      cacheState: 'none',
    });
  });

  // 1. Context Builder & Prompt Builder
  describe('AI Prompt & Context Builders', () => {
    it('should aggregate portfolio, market, and security metadata into a context snapshot', async () => {
      // Mock stats from analytics repo to cover line 30-33
      const pRepo = serviceLocator.getPortfolioAnalyticsRepository();
      jest.spyOn(pRepo, 'getPortfolioAnalytics').mockResolvedValueOnce({
        address: testWallet,
        net_worth_usd: 12000,
        change_24h_usd: -500,
        change_24h_percent: -4.0,
        change_7d_percent: 0,
        change_30d_percent: 0,
        change_90d_percent: 0,
        change_1y_percent: 0,
        all_time_performance_percent: 0,
        pnl: {} as any,
        allocation: {
          sectors: { 'DeFi': 30, 'L1': 50, 'Meme': 20 },
          tokens: {},
          largest_holding_mint: '',
          smallest_holding_mint: '',
          dust_mints: [],
          spam_mints: [],
        },
        performance: {} as any,
        insights: {} as any,
        timestamp: Date.now(),
      });

      const context = await AIContextBuilder.buildContext(testWallet);
      
      expect(context.portfolio.wallet_address).toBe(testWallet);
      expect(context.portfolio.total_value_usd).toBe(12000);
      expect(context.portfolio.assets).toHaveLength(3);
      expect(context.market.price_ticks.So11111111111111111111111111111111111111112.price).toBe(150);
      expect(context.security.is_locked).toBe(false);
    });

    it('should compile context datasets and query prompts into structural templates', async () => {
      // Publish a critical event to cover line 233 filter callback
      await eventEngine.publish({
        event_id: 'evt_critical_test',
        topic: 'security_audits',
        event_type: 'brute_force_alert',
        priority: 'critical',
        payload: { attempts: 5 },
        timestamp: Date.now(),
      });
      await new Promise(r => setTimeout(() => r(undefined), 20));

      const context = await AIContextBuilder.buildContext(testWallet);
      const userPrompt = 'Summarize my assets';
      
      const prompt = AIPromptBuilder.buildPrompt(userPrompt, context);
      
      expect(prompt).toContain('Antigravity Copilot');
      expect(prompt).toContain('Summarize my assets');
      expect(prompt).toContain('portfolio_total_usd');
      expect(prompt).toContain('brute_force_alert');
    });
  });

  // 2. Token Safety Analyzer
  describe('AITokenAnalyzer contract evaluation', () => {
    it('should flag upgradeable or blacklisted tokens as high threat spam', () => {
      const normalResult = AITokenAnalyzer.analyzeTokenContract('some_mint', 'Solana DeFi', 'safe_creator');
      expect(normalResult.isSpam).toBe(false);
      expect(normalResult.threatLevel).toBe('low');

      const blacklistedResult = AITokenAnalyzer.analyzeTokenContract('some_mint', 'Solana DeFi', 'rug_token_creator_address_54321');
      expect(blacklistedResult.isSpam).toBe(true);
      expect(blacklistedResult.threatLevel).toBe('high');
      expect(blacklistedResult.explanation).toContain('creator authority matches registered fraud blacklists');

      const nameSpamResult = AITokenAnalyzer.analyzeTokenContract('some_mint', 'CLAIM FREE USDC AIRDROP', 'creator_addr');
      expect(nameSpamResult.isSpam).toBe(true);
      expect(nameSpamResult.threatLevel).toBe('high');
      expect(nameSpamResult.explanation).toContain('Token name contains spam phrases');
    });
  });

  // 3. Reasoning & Explanation Engines
  describe('AIReasoningEngine explanations', () => {
    it('should formulate logic explanations for quote slippages and transaction failures', () => {
      const simulationExplanation = AIReasoningEngine.explainSimulationFailure('InstructionError 0x1');
      expect(simulationExplanation).toContain('InstructionError 0x1');
      expect(simulationExplanation).toContain('custom program logic rejection');

      const notFoundExplanation = AIReasoningEngine.explainSimulationFailure('AccountNotFound error');
      expect(notFoundExplanation).toContain('verify the recipient address');

      const genericExplanation = AIReasoningEngine.explainSimulationFailure('Generic failure');
      expect(genericExplanation).toContain('slippage discrepancies');

      const slippageExplanation = AIReasoningEngine.explainQuoteSlippage(100, 2.5); // 1.0% slip, 2.5% impact
      expect(slippageExplanation).toContain('High Price Impact detected');

      const lowSlippageExplanation = AIReasoningEngine.explainQuoteSlippage(50, 0.5);
      expect(lowSlippageExplanation).toContain('Price impact is optimal');
    });

    it('should generate portfolio ROI warnings under negative drawdown shifts', async () => {
      const context = await AIContextBuilder.buildContext(testWallet);
      
      // Negative ROI
      context.portfolio.recent_roi = -4.5;
      let insights = AIInsightEngine.generateInsights(context);
      expect(insights).toHaveLength(1);
      expect(insights[0].category).toBe('portfolio');
      expect(insights[0].severity).toBe('warning');

      // Positive ROI
      context.portfolio.recent_roi = 1.2;
      insights = AIInsightEngine.generateInsights(context);
      expect(insights).toHaveLength(0);
    });

    it('should return empty insights if portfolio AI features are disabled by flags', async () => {
      const isEnabledSpy = jest.spyOn(require('../../api/FeatureFlags').featureFlagsManager, 'isEnabled');
      isEnabledSpy.mockImplementation((flagKey) => {
        if (flagKey === 'ENABLE_AI_PORTFOLIO') return false;
        return true;
      });

      const context = await AIContextBuilder.buildContext(testWallet);
      context.portfolio.recent_roi = -4.5;

      const insights = AIInsightEngine.generateInsights(context);
      expect(insights).toHaveLength(0);

      isEnabledSpy.mockRestore();
    });

    it('should return raw error string for simulation if explanations are disabled by flags', () => {
      const isEnabledSpy = jest.spyOn(require('../../api/FeatureFlags').featureFlagsManager, 'isEnabled');
      isEnabledSpy.mockImplementation((flagKey) => {
        if (flagKey === 'ENABLE_AI_EXPLANATIONS') return false;
        return true;
      });

      const explanation = AIReasoningEngine.explainSimulationFailure('Fatal error code 9');
      expect(explanation).toBe('Simulation failed: Fatal error code 9');

      isEnabledSpy.mockRestore();
    });
  });

  // 4. Recommendation & Allocations Engine
  describe('AIRecommendationEngine evaluation', () => {
    it('should recommend rebalancing when meme allocation limits are breached', async () => {
      const context = await AIContextBuilder.buildContext(testWallet);
      context.portfolio.sector_allocations.Meme = 45; // 45% (exceeds 30% limit)

      const recommendations = AIRecommendationEngine.evaluatePortfolio(context);
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].action_type).toBe('rebalance');
      expect(recommendations[0].confidence_score).toBe(0.92);
    });

    it('should recommend NFT/Token isolation if scam alerts are registered', async () => {
      // Trigger a scam alert to cover line 145 recommendation block
      const rule: AlertRuleDTO = {
        rule_id: 'rule_scam_test',
        type: 'security',
        target: 'scam_address',
        condition: 'match',
        value: 'spam',
        severity: 'critical',
        is_active: true,
        created_at: Date.now(),
      };
      await alertEngine.registerRule(rule);
      await alertEngine.processTelemetry('security', 'scam_address', 'spam');

      const context = await AIContextBuilder.buildContext(testWallet);
      const recommendations = AIRecommendationEngine.evaluatePortfolio(context);
      
      const scamRec = recommendations.find(r => r.action_type === 'security_patch');
      expect(scamRec).toBeDefined();
      expect(scamRec?.title).toContain('NFT/Token Isolation');
    });

    it('should return empty recommendations if flags are disabled', async () => {
      const isEnabledSpy = jest.spyOn(require('../../api/FeatureFlags').featureFlagsManager, 'isEnabled');
      isEnabledSpy.mockImplementation((flagKey) => {
        if (flagKey === 'ENABLE_AI_RECOMMENDATIONS') return false;
        return true;
      });

      const context = await AIContextBuilder.buildContext(testWallet);
      context.portfolio.sector_allocations.Meme = 45;

      const recommendations = AIRecommendationEngine.evaluatePortfolio(context);
      expect(recommendations).toHaveLength(0);

      isEnabledSpy.mockRestore();
    });
  });

  // 5. Conversation, Compressions & History Manager
  describe('Conversation & History Pruning', () => {
    it('should fetch or instantiate a new conversation record', async () => {
      const conv = await AIHistoryManager.fetchConversation(testConvId);
      expect(conv.conversation_id).toBe(testConvId);
      expect(conv.messages).toHaveLength(0);
    });

    it('should append messages and compress records exceeding token limits', () => {
      let conv: AIConversationDTO = {
        conversation_id: testConvId,
        messages: [],
        created_at: Date.now(),
        last_active_at: Date.now(),
      };

      // Append 45 messages (threshold limit max is 40)
      for (let i = 0; i < 45; i++) {
        conv = AIConversationManager.appendMessage(conv, 'user', `Message ${i}`);
      }

      expect(conv.messages).toHaveLength(40);
      expect(conv.messages[0].content).toBe('Message 5'); // index shifted by 5 items
      expect(conv.messages[39].content).toBe('Message 44');
    });
  });

  // 6. User Feedback Rating Register
  describe('AIFeedbackManager logs', () => {
    it('should store user ratings and feedback comments', async () => {
      const feedback = await AIFeedbackManager.registerFeedback('msg_response_1', 'chat_response', true, 'Amazing explanation!');
      expect(feedback.target_id).toBe('msg_response_1');
      expect(feedback.is_positive).toBe(true);
      expect(feedback.comment).toBe('Amazing explanation!');
      
      const repo = serviceLocator.getAIRepository();
      const list = await repo.getFeedbackList();
      expect(list).toHaveLength(1);
      expect(list[0].feedback_id).toBe(feedback.feedback_id);
    });
  });

  // 7. AICopilot Coordinator Operations
  describe('AICopilot askCopilot interactions', () => {
    it('should respond to user chat prompts and cache conversational snapshots', async () => {
      const response = await aiCopilot.askCopilot(testConvId, 'Why is my portfolio down?', testWallet);
      
      expect(response).toContain('SOL');
      expect(response).toContain('Confidence Rating');
      
      const repo = serviceLocator.getAIRepository();
      const conv = await repo.getConversation(testConvId);
      expect(conv?.messages).toHaveLength(2); // contains user question and assistant answer
    });

    it('should query predictive trends and portfolio allocations in background analysis', async () => {
      const analysis = await aiCopilot.performBackgroundBatchAnalysis(testWallet);
      
      expect(analysis.insights).toHaveLength(3); // 2 remote mocks + 1 local roi correction
      expect(analysis.recommendations).toHaveLength(3); // 1 remote mock + 2 local advice items (concentration & security alert)
      expect(analysis.predictions).toHaveLength(1);
    });

    it('should fall back to error response message if remote fetch fails', async () => {
      const repo = serviceLocator.getAIRepository();
      jest.spyOn(repo, 'fetchRemoteChatResponse').mockRejectedValueOnce(new Error('Proxy connection failure'));
      
      const errResponse = await aiCopilot.askCopilot(testConvId, 'Force failure prompt', testWallet);
      expect(errResponse).toContain('trouble connecting');
    });

    it('should return default response if AI features are disabled by flags', async () => {
      // Mock disable flags
      const isEnabledSpy = jest.spyOn(require('../../api/FeatureFlags').featureFlagsManager, 'isEnabled');
      isEnabledSpy.mockImplementation((flagKey) => {
        if (flagKey === 'ENABLE_AI' || flagKey === 'ENABLE_AI_CHAT') return false;
        return true;
      });

      const response = await aiCopilot.askCopilot(testConvId, 'Hello', testWallet);
      expect(response).toContain('disabled by Feature Flags');

      const analysis = await aiCopilot.performBackgroundBatchAnalysis(testWallet);
      expect(analysis.insights).toHaveLength(0);

      isEnabledSpy.mockRestore();
    });
  });

  // 8. Store Integrations
  describe('Zustand store integrations', () => {
    it('should trigger store fetches and query SWR cache-hits', async () => {
      // 1. Fetch conversation
      await useAIStore.getState().fetchConversation(storeConvId);
      let storeState = useAIStore.getState();
      expect(storeState.activeConversation?.conversation_id).toBe(storeConvId);

      // 2. Chat update
      await useAIStore.getState().askCopilot(storeConvId, 'What happened today?', testWallet);
      storeState = useAIStore.getState();
      expect(storeState.activeConversation?.messages).toHaveLength(2);

      // 3. Batch analysis
      await useAIStore.getState().fetchBatchAnalysis(testWallet);
      storeState = useAIStore.getState();
      expect(storeState.insights).toHaveLength(3);
      expect(storeState.recommendations).toHaveLength(3);
      expect(storeState.predictions).toHaveLength(1);
      expect(storeState.cacheState).toBe('hit');
    });
  });
});
