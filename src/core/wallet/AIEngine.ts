import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';
import { AIConversationDTO, AIMessageDTO, AIFeedbackDTO } from '../api/AIDTOs';
import { AIContextSnapshotDTO, AIPortfolioContextDTO, AIMarketContextDTO, AISecurityContextDTO } from '../api/AIContextDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../api/AIInsightDTOs';
import { AIRecommendationDTO } from '../api/AIRecommendationDTOs';

// ---------------------------------------------------------
// 1. AI Context Builder
// ---------------------------------------------------------
export class AIContextBuilder {
  public static async buildContext(walletAddress: string): Promise<AIContextSnapshotDTO> {
    // 1. Build Portfolio Context
    let totalValue = 1500; // Mock default
    let assets = [
      { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', balance: 5, price_usd: 150, value_usd: 750, percentage: 50 },
      { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', balance: 250, price_usd: 1, value_usd: 250, percentage: 16.6 },
      { mint: 'meme_token_mint_addr', symbol: 'SHIB', balance: 50000000, price_usd: 0.00001, value_usd: 500, percentage: 33.4 },
    ];
    let recentPnl = -45.2;
    let recentRoi = -2.9;
    let sectorAllocations: Record<string, number> = { 'Defi': 16.6, 'L1': 50, 'Meme': 33.4 };

    // Try to load dynamic info from other service locators or stores if available
    try {
      const pAnalyticsRepo = serviceLocator.getPortfolioAnalyticsRepository();
      const stats = await pAnalyticsRepo.getPortfolioAnalytics(walletAddress);
      if (stats) {
        totalValue = stats.net_worth_usd;
        recentPnl = stats.change_24h_usd;
        recentRoi = stats.change_24h_percent;
        sectorAllocations = stats.allocation.sectors;
      }
    } catch {}

    const portfolio: AIPortfolioContextDTO = {
      wallet_address: walletAddress,
      total_value_usd: totalValue,
      assets,
      recent_pnl_24h: recentPnl,
      recent_roi: recentRoi,
      sector_allocations: sectorAllocations,
    };

    // 2. Build Market Context
    const market: AIMarketContextDTO = {
      price_ticks: {
        'So11111111111111111111111111111111111111112': { price: 150, volume_24h: 350000000, mcap: 68000000000, previous_price: 155 },
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { price: 1.0 },
        'meme_token_mint_addr': { price: 0.00001, volume_24h: 12000000, mcap: 500000000 },
      },
      trending_tokens: ['So11111111111111111111111111111111111111112', 'meme_token_mint_addr'],
    };

    // 3. Build Security Context
    let isLocked = false;
    let failedAttempts = 0;
    try {
      // In physical apps, query active settings/wallet store
    } catch {}

    const eventRepo = serviceLocator.getEventRepository();
    const threats = await eventRepo.getAlerts();
    const securityThreats = threats.filter(t => t.type === 'security');

    const security: AISecurityContextDTO = {
      is_locked: isLocked,
      failed_attempts: failedAttempts,
      recent_threats: securityThreats,
    };

    // 4. Gather recent event logs
    const recentEvents = await eventRepo.getEventHistory();

    return {
      snapshot_id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      portfolio,
      market,
      security,
      recent_events: recentEvents.slice(0, 10), // Limit history size context payload
    };
  }
}

// ---------------------------------------------------------
// 2. AI Conversation Manager
// ---------------------------------------------------------
export class AIConversationManager {
  private static readonly MAX_MESSAGES = 40; // Pruning threshold

  public static appendMessage(conv: AIConversationDTO, role: 'user' | 'assistant', content: string, snapshotId?: string): AIConversationDTO {
    const newMessage: AIMessageDTO = {
      message_id: `msg_${role}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      role,
      content,
      timestamp: Date.now(),
      context_snapshot_id: snapshotId,
    };

    const updatedMessages = [...conv.messages, newMessage];

    // Pruning logic - conversation compression
    if (updatedMessages.length > this.MAX_MESSAGES) {
      logger.info(`[AIConversationManager] Conversation length exceeded ${this.MAX_MESSAGES}. Pruning old logs.`);
      updatedMessages.splice(0, updatedMessages.length - this.MAX_MESSAGES);
    }

    return {
      ...conv,
      messages: updatedMessages,
      last_active_at: Date.now(),
    };
  }
}

// ---------------------------------------------------------
// 3. AI Recommendation Engine
// ---------------------------------------------------------
export class AIRecommendationEngine {
  public static evaluatePortfolio(context: AIContextSnapshotDTO): AIRecommendationDTO[] {
    if (!featureFlagsManager.isEnabled('ENABLE_AI_RECOMMENDATIONS')) return [];

    const recommendations: AIRecommendationDTO[] = [];

    // Concentration warnings (e.g. Meme allocation > 30%)
    const memePct = context.portfolio.sector_allocations['Meme'] || 0;
    if (memePct > 30) {
      recommendations.push({
        recommendation_id: `rec_concentration_${Date.now()}`,
        title: 'Meme Over-Concentration Risk Warning',
        action_type: 'rebalance',
        action_description: `Reduce Meme allocation from ${memePct.toFixed(1)}% to below 25%.`,
        rationale: 'Meme class assets present high-drawdown volatility risks. Reallocating speculative values into stables or L1 protects capital during corrections.',
        risk_assessment: 'Converting assets may trigger network swap fees, but improves portfolio volatility levels by 15-20%.',
        confidence_score: 0.92,
        timestamp: Date.now(),
      });
    }

    // Security warning triggers
    const scamThreats = context.security.recent_threats.filter(t => t.message.toLowerCase().includes('scam') || t.message.toLowerCase().includes('spam'));
    if (scamThreats.length > 0) {
      recommendations.push({
        recommendation_id: `rec_security_${Date.now()}`,
        title: 'Spam NFT/Token Isolation recommendation',
        action_type: 'security_patch',
        action_description: 'Isolate or ignore flagged scam token mints.',
        rationale: 'Airdropped spam assets often require interacting with suspicious smart contracts that steal credentials.',
        risk_assessment: 'Zero risk, simply ignore the token mints.',
        confidence_score: 0.99,
        timestamp: Date.now(),
      });
    }

    return recommendations;
  }
}

// ---------------------------------------------------------
// 4. AI Reasoning & Insight Engine
// ---------------------------------------------------------
export class AIReasoningEngine {
  public static explainSimulationFailure(errorMessage: string): string {
    if (!featureFlagsManager.isEnabled('ENABLE_AI_EXPLANATIONS')) {
      return `Simulation failed: ${errorMessage}`;
    }

    let explanation = `The transaction simulation failed with error: "${errorMessage}". `;

    if (errorMessage.includes('InstructionError') || errorMessage.includes('0x1')) {
      explanation += 'This usually indicates a custom program logic rejection. Check that your account holds sufficient SOL to execute, or that swap slippage bounds are wide enough.';
    } else if (errorMessage.includes('AccountNotFound')) {
      explanation += 'The target wallet or token account does not exist on-chain. Please verify the recipient address.';
    } else {
      explanation += 'This is likely caused by slippage discrepancies or block state shifts during transmission.';
    }

    return explanation;
  }

  public static explainQuoteSlippage(slippageBps: number, priceImpactPct: number): string {
    const isHighImpact = priceImpactPct > 2.0;
    const explanation = `Quote quality report: Price impact is ${priceImpactPct.toFixed(2)}%, slippage setting is ${(slippageBps / 100).toFixed(2)}%. ` +
      (isHighImpact 
        ? 'High Price Impact detected! This trade will shift pool prices significantly. Suggest splitting the order or searching higher liquidity pools.'
        : 'Price impact is optimal. Slippage parameters are sufficient for execution confidence under normal slot conditions.');
    return explanation;
  }
}

export class AIInsightEngine {
  public static generateInsights(context: AIContextSnapshotDTO): AIInsightDTO[] {
    if (!featureFlagsManager.isEnabled('ENABLE_AI_PORTFOLIO')) return [];

    const insights: AIInsightDTO[] = [];

    // Net worth change check
    const roi = context.portfolio.recent_roi;
    if (roi < -2.0) {
      insights.push({
        insight_id: `ins_roi_${Date.now()}`,
        category: 'portfolio',
        title: 'Significant Portfolio Value Correction',
        description: `Your portfolio experienced a ${roi.toFixed(1)}% correction today.`,
        explanation: 'Volatilities in holding assets SOL and Meme caused net asset values to drop. Stablecoins (USDC) cushioned the impact.',
        severity: 'warning',
        timestamp: Date.now(),
      });
    }

    return insights;
  }
}

// ---------------------------------------------------------
// 5. AI Prompt Builder
// ---------------------------------------------------------
export class AIPromptBuilder {
  public static buildPrompt(userPrompt: string, context: AIContextSnapshotDTO): string {
    const systemInstructions = 
      "You are Antigravity Copilot, ChadWallet's premium explainable AI trading advisor. " +
      "Analyze the current wallet context and address user queries accurately. " +
      "Never execute trades. Do not leak credentials like Private Keys, Mnemonic codes, PIN hashes, or JWTs. " +
      "Structure responses cleanly. Use markdown.";

    const contextPayload = JSON.stringify({
      portfolio_total_usd: context.portfolio.total_value_usd,
      recent_roi_pct: context.portfolio.recent_roi,
      assets: context.portfolio.assets.map(a => `${a.symbol}: balance ${a.balance}, price $${a.price_usd}`),
      security_lockout: context.security.failed_attempts,
      recent_errors: context.recent_events.filter(e => e.priority === 'critical').map(e => e.event_type),
    });

    return `System Instructions: ${systemInstructions}\nContext: ${contextPayload}\nUser Query: ${userPrompt}`;
  }
}

// ---------------------------------------------------------
// 6. AI Token Analyzer
// ---------------------------------------------------------
export class AITokenAnalyzer {
  public static analyzeTokenContract(mint: string, name: string, creator: string): { isSpam: boolean; threatLevel: 'low' | 'high'; explanation: string } {
    const nameLower = name.toLowerCase();
    const isBlacklistedCreator = creator === 'rug_token_creator_address_54321';
    
    let isSpam = false;
    let explanation = 'Token metadata matches secure guidelines.';
    let threatLevel: 'low' | 'high' = 'low';

    if (
      nameLower.includes('claim') ||
      nameLower.includes('free') ||
      nameLower.includes('reward') ||
      nameLower.includes('airdrop')
    ) {
      isSpam = true;
      threatLevel = 'high';
      explanation = 'Scam Token Warning: Token name contains spam phrases intended to lure you to malicious links.';
    } else if (isBlacklistedCreator) {
      isSpam = true;
      threatLevel = 'high';
      explanation = 'Security Block: Token creator authority matches registered fraud blacklists.';
    }

    return { isSpam, threatLevel, explanation };
  }
}

// ---------------------------------------------------------
// 7. AI Response Formatter
// ---------------------------------------------------------
export class AIResponseFormatter {
  public static formatResponse(content: string, confidence: number = 0.9): string {
    return `${content}\n\n*Confidence Rating: ${(confidence * 100).toFixed(0)}%*`;
  }
}

// ---------------------------------------------------------
// 8. AI History Manager & Feedback Manager
// ---------------------------------------------------------
export class AIHistoryManager {
  public static async fetchConversation(conversationId: string): Promise<AIConversationDTO> {
    const repo = serviceLocator.getAIRepository();
    const conv = await repo.getConversation(conversationId);
    if (conv) return conv;

    const newConv: AIConversationDTO = {
      conversation_id: conversationId,
      messages: [],
      created_at: Date.now(),
      last_active_at: Date.now(),
    };
    await repo.saveConversation(newConv);
    return newConv;
  }
}

export class AIFeedbackManager {
  public static async registerFeedback(targetId: string, targetType: any, positive: boolean, comment?: string): Promise<AIFeedbackDTO> {
    const feedback: AIFeedbackDTO = {
      feedback_id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      target_id: targetId,
      target_type: targetType,
      is_positive: positive,
      comment,
      timestamp: Date.now(),
    };

    const repo = serviceLocator.getAIRepository();
    await repo.saveFeedback(feedback);
    return feedback;
  }
}

// ---------------------------------------------------------
// 9. AICopilot Coordinator (Facade)
// ---------------------------------------------------------
export class AICopilot {
  private static instance: AICopilot | null = null;

  private constructor() {}

  public static getInstance(): AICopilot {
    if (!AICopilot.instance) {
      AICopilot.instance = new AICopilot();
    }
    return AICopilot.instance;
  }

  // Primary user chat endpoint
  public async askCopilot(conversationId: string, userPrompt: string, walletAddress: string): Promise<string> {
    if (!featureFlagsManager.isEnabled('ENABLE_AI') || !featureFlagsManager.isEnabled('ENABLE_AI_CHAT')) {
      return 'AI Copilot feature is currently disabled by Feature Flags.';
    }

    logger.info(`[AICopilot] askCopilot received request for conversation ${conversationId}`);

    const repo = serviceLocator.getAIRepository();

    // 1. Fetch conversational history logs
    const conv = await AIHistoryManager.fetchConversation(conversationId);

    // 2. Aggregate telemetry contexts
    const context = await AIContextBuilder.buildContext(walletAddress);

    // 3. Build instruction prompt templates
    const formattedPrompt = AIPromptBuilder.buildPrompt(userPrompt, context);

    // 4. Append user message to history
    let updatedConv = AIConversationManager.appendMessage(conv, 'user', userPrompt, context.snapshot_id);

    try {
      // 5. Query remote LLM proxies
      const response = await repo.fetchRemoteChatResponse(formattedPrompt, updatedConv.messages, context);
      const formattedResponse = AIResponseFormatter.formatResponse(response);

      // 6. Append response back to history & save
      updatedConv = AIConversationManager.appendMessage(updatedConv, 'assistant', formattedResponse, context.snapshot_id);
      await repo.saveConversation(updatedConv);

      return formattedResponse;
    } catch (err: any) {
      logger.error('[AICopilot] Failed to fetch response from proxy endpoint', err);
      return 'Sorry, I am having trouble connecting to ChadWallet AI network proxies. Please try again.';
    }
  }

  // Batch updates of predictions/insights in background
  public async performBackgroundBatchAnalysis(walletAddress: string): Promise<{
    insights: AIInsightDTO[];
    recommendations: AIRecommendationDTO[];
    predictions: AIPredictionDTO[];
  }> {
    if (!featureFlagsManager.isEnabled('ENABLE_AI')) {
      return { insights: [], recommendations: [], predictions: [] };
    }

    const context = await AIContextBuilder.buildContext(walletAddress);
    const repo = serviceLocator.getAIRepository();

    // Fetch and sync locally
    const analysis = await (repo as any).fetchRemoteBatchAnalysis(context);

    // Evaluate structural logic models locally
    const localRecomms = AIRecommendationEngine.evaluatePortfolio(context);
    const localInsights = AIInsightEngine.generateInsights(context);

    // Save local evaluations as well
    for (const r of localRecomms) {
      await repo.saveRecommendation(r);
    }
    for (const ins of localInsights) {
      await repo.saveInsight(ins);
    }

    return {
      insights: [...analysis.insights, ...localInsights],
      recommendations: [...analysis.recommendations, ...localRecomms],
      predictions: analysis.predictions,
    };
  }
}

export const aiCopilot = AICopilot.getInstance();
