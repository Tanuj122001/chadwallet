import { AIContextSnapshotDTO } from '../../core/api/AIContextDTOs';
import { AIMessageDTO } from '../../core/api/AIDTOs';
import { AIInsightDTO, AIPredictionDTO } from '../../core/api/AIInsightDTOs';
import { AIRecommendationDTO } from '../../core/api/AIRecommendationDTOs';

export class AIRemoteDataSource {
  // Simulates an LLM API call with custom context instructions
  public async generateChatResponse(
    _prompt: string, 
    _history: AIMessageDTO[], 
    _context: AIContextSnapshotDTO
  ): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const query = _prompt.toLowerCase();

        if (query.includes('portfolio down') || query.includes('portfolio is down') || query.includes('portfolio metrics')) {
          resolve(
            "Analyzing your portfolio performance: your total asset balance decreased by 4.2% over the last 24 hours. " +
            "This was primarily driven by a 6.5% correction in SOL (down from $165 to $154.2), which comprises 45% of your total holdings. " +
            "Additionally, your Meme coin holdings experienced a -12.4% drawdown. DeFi tokens remained relatively stable. " +
            "We recommend reviewing your asset allocations to mitigate high-volatility sector shifts."
          );
          return;
        }

        if (query.includes('what happened today') || query.includes('summarize today')) {
          resolve(
            "Here is your wallet summary for today: " +
            "1. Your net worth shifted by -$45.20 USD (-3.1%). " +
            "2. On-chain activity was normal with 2 confirmed swaps and 0 failed transactions. " +
            "3. Sol network congestion remains low with slot processing times averaging 400ms. " +
            "4. No new contract upgrades or security flags were detected for your token holdings."
          );
          return;
        }

        if (query.includes('explain this transaction') || query.includes('explain transaction')) {
          resolve(
            "Transaction Analysis: " +
            "Signature: sig_blockchain_update_123 represents a confirmed Swap operation on Jupiter. " +
            "You exchanged 10.0 SOL for 1,540 USDC. " +
            "Fee details: Priority Fee of 0.00005 SOL was paid, which was sufficient for instant slot inclusion. " +
            "Slippage was 0.1%, resulting in zero MEV frontrunning exposure. No contract upgrade hazards were active during execution."
          );
          return;
        }

        if (query.includes('risky') || query.includes('token risky') || query.includes('scam')) {
          resolve(
            "Risk Assessment: Token mint upgrade permissions are currently active for the creator authority, meaning the contract is upgradeable and could theoretically freeze balances. " +
            "Additionally, the creator metadata has been flagged for holding a high proportion of token supply (34%). " +
            "Exercise high caution before adding further capital."
          );
          return;
        }

        if (query.includes('rebalance') || query.includes('should i rebalance')) {
          resolve(
            "Asset Rebalancing Advice: Your current sector allocation shows a 52% concentration in Meme coins (e.g. BONK, WIF), exceeding the recommended maximum of 25%. " +
            "We suggest reallocating 20% of your holdings into blue-chip DeFi protocols (e.g. JUP, PYTH) or Stablecoins (USDC) to decrease volatility risk without executing auto-trades."
          );
          return;
        }

        if (query.includes('largest risk') || query.includes('largest hazard')) {
          resolve(
            "Your largest detected risk factor is extreme sector concentration. " +
            "Meme assets represent over 50% of your total net worth, yielding a portfolio volatility score of 84%. " +
            "Additionally, your wallet security score is slightly degraded due to recent brute force unlock lockout warnings (3 failed attempts)."
          );
          return;
        }

        if (query.includes('summarize my wallet') || query.includes('wallet summary')) {
          resolve(
            `Wallet Overview: Your wallet holds a total balance of $${_context.portfolio.total_value_usd} USD spread across ${_context.portfolio.assets.length} assets. ` +
            "Your portfolio health rating is 78/100, constrained by concentration issues. " +
            "Your network RPC connectivity is currently healthy (0ms delays)."
          );
          return;
        }

        resolve(
          "I have processed your request using the provided ChadWallet on-chain context. " +
          "Currently, all automation and trading triggers are set to insight-only mode. " +
          "Let me know if you would like me to analyze specific assets, portfolio health scores, or transaction simulator errors."
        );
      }, 50);
    });
  }

  // Simulates remote background batch analytical tasks
  public async generateInsights(_context: AIContextSnapshotDTO): Promise<AIInsightDTO[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            insight_id: `ins_port_${Date.now()}`,
            category: 'portfolio',
            title: 'Meme Over-Concentration Alert',
            description: 'Your Meme holdings exceed 50% of your total assets.',
            explanation: 'Diversification analysis shows that having high concentration in highly volatile Meme coins increases downside risk during market downturns. Reallocating to USDC helps lower portfolio volatility.',
            severity: 'warning',
            timestamp: Date.now(),
          },
          {
            insight_id: `ins_sec_${Date.now()}`,
            category: 'security',
            title: 'Active Upgrade Authority Risk',
            description: 'Upgradeable program detected in holding assets.',
            explanation: 'The smart contract for your third-largest asset has upgrade permissions enabled, allowing the creator authority to modify functionality or freeze tokens.',
            severity: 'info',
            timestamp: Date.now(),
          }
        ]);
      }, 50);
    });
  }

  public async generateRecommendations(_context: AIContextSnapshotDTO): Promise<AIRecommendationDTO[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            recommendation_id: `rec_reb_${Date.now()}`,
            title: 'Manual Portfolio Rebalance',
            action_type: 'rebalance',
            action_description: 'Reallocate 15% of Meme asset class to Stablecoins.',
            rationale: 'Lowers concentration in speculative tokens, elevating portfolio risk health score from 78 to 92.',
            risk_assessment: 'Exchanging assets incurs small swap fees and slippage, but reduces downside volatility by 18%.',
            confidence_score: 0.95,
            timestamp: Date.now(),
          }
        ]);
      }, 50);
    });
  }

  public async generatePredictions(_context: AIContextSnapshotDTO): Promise<AIPredictionDTO[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            prediction_id: `pred_pnl_${Date.now()}`,
            metric: 'pnl_trend',
            estimate_direction: 'flat',
            expected_value: 0,
            confidence_score: 0.85,
            reasoning_assumptions: 'Assuming current market consolidated state continues and no major whale liquidations occur over the next 48 hours.',
            timestamp: Date.now(),
          }
        ]);
      }, 50);
    });
  }
}
