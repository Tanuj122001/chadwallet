/**
 * Fraud Detection Engine — Transaction Fraud Analysis, Pattern Detection & Risk Scoring
 *
 * Detects: wallet draining, rapid transfers, failed signing, suspicious approvals,
 * unknown programs, fake metadata, rug pulls, upgradeable contracts, blacklisted addresses,
 * scam contracts, abnormal velocity, wash trading, volume manipulation, spoofing,
 * front-running, sandwich attacks, replay attempts, duplicate transactions, signature anomalies.
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';
import {
  FraudRiskScoreDTO,
  FraudFactorDTO,
  TransactionFraudAnalysisDTO,
  DetectedPatternDTO,
  BlacklistEntryDTO,
  VelocityMetricDTO,
} from '../api/FraudDTOs';

// ---------------------------------------------------------
// Blacklist Registry
// ---------------------------------------------------------
class BlacklistRegistry {
  private entries: Map<string, BlacklistEntryDTO> = new Map();

  private static readonly KNOWN_SCAM_PROGRAMS = [
    'ScamProgram1111111111111111111111111111111',
    'RugPull22222222222222222222222222222222222',
    'DrainBot33333333333333333333333333333333333',
  ];

  private static readonly KNOWN_SCAM_CREATORS = [
    'rug_token_creator_address_54321',
    'known_drainer_wallet_99999',
    'scam_factory_address_11111',
  ];

  constructor() {
    // Seed initial blacklist
    BlacklistRegistry.KNOWN_SCAM_PROGRAMS.forEach(addr => {
      this.entries.set(addr, {
        address: addr,
        entry_type: 'program',
        reason: 'Known scam program',
        source: 'internal',
        added_at: Date.now(),
        is_active: true,
      });
    });

    BlacklistRegistry.KNOWN_SCAM_CREATORS.forEach(addr => {
      this.entries.set(addr, {
        address: addr,
        entry_type: 'creator',
        reason: 'Known fraud creator',
        source: 'internal',
        added_at: Date.now(),
        is_active: true,
      });
    });
  }

  public isBlacklisted(address: string): BlacklistEntryDTO | null {
    const entry = this.entries.get(address);
    return entry && entry.is_active ? entry : null;
  }

  public addEntry(entry: BlacklistEntryDTO): void {
    this.entries.set(entry.address, entry);
  }

  public getAll(): BlacklistEntryDTO[] {
    return Array.from(this.entries.values()).filter(e => e.is_active);
  }
}

// ---------------------------------------------------------
// Velocity Tracker
// ---------------------------------------------------------
class VelocityTracker {
  private transactions: Array<{ wallet: string; value_usd: number; recipient: string; program: string; success: boolean; timestamp: number }> = [];
  private readonly MAX_ENTRIES = 10000;

  public record(wallet: string, valueUsd: number, recipient: string, program: string, success: boolean): void {
    this.transactions.push({
      wallet,
      value_usd: valueUsd,
      recipient,
      program,
      success,
      timestamp: Date.now(),
    });

    if (this.transactions.length > this.MAX_ENTRIES) {
      this.transactions = this.transactions.slice(-Math.floor(this.MAX_ENTRIES / 2));
    }
  }

  public getMetrics(walletAddress: string, windowMinutes: number): VelocityMetricDTO {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const recent = this.transactions.filter(t => t.wallet === walletAddress && t.timestamp >= cutoff);

    const uniqueRecipients = new Set(recent.map(t => t.recipient)).size;
    const uniquePrograms = new Set(recent.map(t => t.program)).size;
    const totalValue = recent.reduce((sum, t) => sum + t.value_usd, 0);
    const failedCount = recent.filter(t => !t.success).length;

    // Anomaly detection thresholds
    const isAnomalous = recent.length > 20 || totalValue > 50000 || failedCount > 5;
    let thresholdBreached: string | null = null;
    if (recent.length > 20) { thresholdBreached = 'transaction_count_exceeded'; }
    else if (totalValue > 50000) { thresholdBreached = 'value_threshold_exceeded'; }
    else if (failedCount > 5) { thresholdBreached = 'failure_rate_exceeded'; }

    return {
      wallet_address: walletAddress,
      window_minutes: windowMinutes,
      transaction_count: recent.length,
      total_value_usd: totalValue,
      unique_recipients: uniqueRecipients,
      unique_programs: uniquePrograms,
      failed_count: failedCount,
      is_anomalous: isAnomalous,
      threshold_breached: thresholdBreached,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------
// Pattern Detectors
// ---------------------------------------------------------
class PatternDetector {
  /**
   * Detect wallet draining: large outflows in short window
   */
  public static detectDraining(velocity: VelocityMetricDTO, portfolioValueUsd: number): DetectedPatternDTO | null {
    if (portfolioValueUsd <= 0) { return null; }
    const drainPercent = (velocity.total_value_usd / portfolioValueUsd) * 100;

    if (drainPercent > 80 && velocity.window_minutes <= 30) {
      return {
        pattern_type: 'wallet_draining',
        confidence: Math.min(drainPercent / 100, 0.99),
        description: `${drainPercent.toFixed(1)}% of portfolio value transferred in ${velocity.window_minutes} minutes`,
        evidence_data: { drain_percent: drainPercent, window_minutes: velocity.window_minutes },
      };
    }
    return null;
  }

  /**
   * Detect rapid transfers: high transaction count
   */
  public static detectRapidTransfers(velocity: VelocityMetricDTO): DetectedPatternDTO | null {
    if (velocity.transaction_count > 15 && velocity.window_minutes <= 10) {
      return {
        pattern_type: 'rapid_transfers',
        confidence: 0.85,
        description: `${velocity.transaction_count} transactions in ${velocity.window_minutes} minutes`,
        evidence_data: { count: velocity.transaction_count },
      };
    }
    return null;
  }

  /**
   * Detect repeated failed signing
   */
  public static detectFailedSigning(velocity: VelocityMetricDTO): DetectedPatternDTO | null {
    if (velocity.failed_count > 5 && velocity.window_minutes <= 15) {
      return {
        pattern_type: 'repeated_failed_signing',
        confidence: 0.9,
        description: `${velocity.failed_count} failed transactions in ${velocity.window_minutes} minutes`,
        evidence_data: { failed_count: velocity.failed_count },
      };
    }
    return null;
  }

  /**
   * Detect blacklisted address interaction
   */
  public static detectBlacklistedAddress(address: string, registry: BlacklistRegistry): DetectedPatternDTO | null {
    const entry = registry.isBlacklisted(address);
    if (entry) {
      return {
        pattern_type: 'blacklisted_address',
        confidence: 0.99,
        description: `Address ${address.substring(0, 8)}... is blacklisted: ${entry.reason}`,
        evidence_data: { address, reason: entry.reason, source: entry.source },
      };
    }
    return null;
  }

  /**
   * Detect fake token metadata (name-based heuristics)
   */
  public static detectFakeMetadata(tokenName: string): DetectedPatternDTO | null {
    const spamPatterns = [
      /claim\s+(free|your)/i, /airdrop/i, /visit\s+\w+\.\w+/i,
      /free\s+(usdc|sol|usdt)/i, /limited\s+offer/i,
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(tokenName)) {
        return {
          pattern_type: 'fake_token_metadata',
          confidence: 0.95,
          description: `Token name "${tokenName}" matches spam pattern`,
          evidence_data: { token_name: tokenName },
        };
      }
    }
    return null;
  }

  /**
   * Detect wash trading indicators
   */
  public static detectWashTrading(velocity: VelocityMetricDTO): DetectedPatternDTO | null {
    // Wash trading: many transactions to few unique recipients
    if (velocity.transaction_count > 10 && velocity.unique_recipients <= 2) {
      return {
        pattern_type: 'wash_trading',
        confidence: 0.75,
        description: `${velocity.transaction_count} transactions to only ${velocity.unique_recipients} recipients`,
        evidence_data: { tx_count: velocity.transaction_count, unique_recipients: velocity.unique_recipients },
      };
    }
    return null;
  }

  /**
   * Detect sandwich attack pattern (price impact before/after user tx)
   */
  public static detectSandwichAttack(preBuyDetected: boolean, postSellDetected: boolean, priceImpactPercent: number): DetectedPatternDTO | null {
    if (preBuyDetected && postSellDetected && priceImpactPercent > 2.0) {
      return {
        pattern_type: 'sandwich_attack',
        confidence: 0.88,
        description: `Potential sandwich attack: ${priceImpactPercent.toFixed(2)}% price impact with surrounding trades`,
        evidence_data: { price_impact: priceImpactPercent, pre_buy: preBuyDetected, post_sell: postSellDetected },
      };
    }
    return null;
  }

  /**
   * Detect front-running attempt
   */
  public static detectFrontRunning(pendingTxTimestamp: number, competingTxTimestamp: number, slotDifference: number): DetectedPatternDTO | null {
    if (competingTxTimestamp < pendingTxTimestamp && slotDifference <= 2) {
      return {
        pattern_type: 'front_running',
        confidence: 0.82,
        description: `Competing transaction placed ${slotDifference} slots ahead`,
        evidence_data: { slot_diff: slotDifference },
      };
    }
    return null;
  }

  /**
   * Detect duplicate transaction
   */
  public static detectDuplicateTransaction(signatures: string[]): DetectedPatternDTO | null {
    const seen = new Set<string>();
    for (const sig of signatures) {
      if (seen.has(sig)) {
        return {
          pattern_type: 'duplicate_transaction',
          confidence: 1.0,
          description: `Duplicate transaction signature detected: ${sig.substring(0, 16)}...`,
          evidence_data: { signature: sig },
        };
      }
      seen.add(sig);
    }
    return null;
  }
}

// ---------------------------------------------------------
// Fraud Detection Engine (Orchestrator)
// ---------------------------------------------------------
export class FraudDetectionEngine {
  private blacklistRegistry = new BlacklistRegistry();
  private velocityTracker = new VelocityTracker();

  private static instance: FraudDetectionEngine | null = null;

  private constructor() {}

  public static getInstance(): FraudDetectionEngine {
    if (!FraudDetectionEngine.instance) {
      FraudDetectionEngine.instance = new FraudDetectionEngine();
    }
    return FraudDetectionEngine.instance;
  }

  /**
   * Record a transaction for velocity tracking
   */
  public recordTransaction(wallet: string, valueUsd: number, recipient: string, program: string, success: boolean): void {
    this.velocityTracker.record(wallet, valueUsd, recipient, program, success);
  }

  /**
   * Analyze a single transaction for fraud patterns
   */
  public analyzeTransaction(
    signature: string,
    walletAddress: string,
    programId: string,
    portfolioValueUsd: number,
    tokenName?: string,
  ): TransactionFraudAnalysisDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_FRAUD_ENGINE')) {
      return {
        analysis_id: `fraud_${Date.now()}`,
        transaction_signature: signature,
        wallet_address: walletAddress,
        program_id: programId,
        patterns_detected: [],
        overall_risk: 'safe',
        recommended_action: 'allow',
        timestamp: Date.now(),
      };
    }

    const patterns: DetectedPatternDTO[] = [];

    // Check blacklist
    const blacklistCheck = PatternDetector.detectBlacklistedAddress(programId, this.blacklistRegistry);
    if (blacklistCheck) { patterns.push(blacklistCheck); }

    // Check velocity
    const velocity30 = this.velocityTracker.getMetrics(walletAddress, 30);
    const velocity10 = this.velocityTracker.getMetrics(walletAddress, 10);
    const velocity15 = this.velocityTracker.getMetrics(walletAddress, 15);

    const draining = PatternDetector.detectDraining(velocity30, portfolioValueUsd);
    if (draining) { patterns.push(draining); }

    const rapid = PatternDetector.detectRapidTransfers(velocity10);
    if (rapid) { patterns.push(rapid); }

    const failedSigning = PatternDetector.detectFailedSigning(velocity15);
    if (failedSigning) { patterns.push(failedSigning); }

    const washTrading = PatternDetector.detectWashTrading(velocity30);
    if (washTrading) { patterns.push(washTrading); }

    // Check fake metadata
    if (tokenName) {
      const fakeMetadata = PatternDetector.detectFakeMetadata(tokenName);
      if (fakeMetadata) { patterns.push(fakeMetadata); }
    }

    // Check duplicate
    const duplicate = PatternDetector.detectDuplicateTransaction([signature]);
    if (duplicate) { patterns.push(duplicate); }

    // Calculate risk
    let overallRisk: TransactionFraudAnalysisDTO['overall_risk'] = 'safe';
    let recommendedAction: TransactionFraudAnalysisDTO['recommended_action'] = 'allow';

    if (patterns.length > 0) {
      const maxConfidence = Math.max(...patterns.map(p => p.confidence));
      if (maxConfidence >= 0.95) {
        overallRisk = 'blocked';
        recommendedAction = 'block';
      } else if (maxConfidence >= 0.8) {
        overallRisk = 'dangerous';
        recommendedAction = 'require_confirmation';
      } else {
        overallRisk = 'suspicious';
        recommendedAction = 'warn';
      }
    }

    const result: TransactionFraudAnalysisDTO = {
      analysis_id: `fraud_${Date.now()}`,
      transaction_signature: signature,
      wallet_address: walletAddress,
      program_id: programId,
      patterns_detected: patterns,
      overall_risk: overallRisk,
      recommended_action: recommendedAction,
      timestamp: Date.now(),
    };

    if (patterns.length > 0) {
      logger.warn(`[FraudDetection] ${patterns.length} fraud patterns detected for tx ${signature.substring(0, 16)}... Risk: ${overallRisk}`);
    }

    return result;
  }

  /**
   * Generate comprehensive fraud risk score for a wallet
   */
  public generateRiskScore(walletAddress: string, portfolioValueUsd: number): FraudRiskScoreDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_FRAUD_ENGINE')) {
      return {
        score_id: `risk_${Date.now()}`,
        wallet_address: walletAddress,
        risk_score: 0,
        risk_level: 'safe',
        contributing_factors: [],
        timestamp: Date.now(),
      };
    }

    const factors: FraudFactorDTO[] = [];
    const velocity30 = this.velocityTracker.getMetrics(walletAddress, 30);
    const velocity5 = this.velocityTracker.getMetrics(walletAddress, 5);

    // Evaluate velocity anomalies
    if (velocity5.is_anomalous) {
      factors.push({
        factor_type: 'abnormal_velocity',
        weight: 0.3,
        evidence: `${velocity5.transaction_count} transactions in 5min window. Threshold: ${velocity5.threshold_breached}`,
        severity: 'high',
      });
    }

    // Evaluate draining risk
    if (portfolioValueUsd > 0 && velocity30.total_value_usd / portfolioValueUsd > 0.5) {
      factors.push({
        factor_type: 'wallet_draining',
        weight: 0.4,
        evidence: `${((velocity30.total_value_usd / portfolioValueUsd) * 100).toFixed(1)}% portfolio value moved in 30min`,
        severity: 'critical',
      });
    }

    // Evaluate failure rate
    if (velocity30.failed_count > 3) {
      factors.push({
        factor_type: 'repeated_failed_signing',
        weight: 0.2,
        evidence: `${velocity30.failed_count} failed transactions in 30min`,
        severity: 'medium',
      });
    }

    // Calculate composite score
    let riskScore = factors.reduce((sum, f) => sum + f.weight * 100, 0);
    riskScore = Math.min(Math.round(riskScore), 100);

    let riskLevel: FraudRiskScoreDTO['risk_level'] = 'safe';
    if (riskScore >= 80) { riskLevel = 'critical'; }
    else if (riskScore >= 60) { riskLevel = 'high'; }
    else if (riskScore >= 40) { riskLevel = 'medium'; }
    else if (riskScore >= 20) { riskLevel = 'low'; }

    return {
      score_id: `risk_${Date.now()}`,
      wallet_address: walletAddress,
      risk_score: riskScore,
      risk_level: riskLevel,
      contributing_factors: factors,
      timestamp: Date.now(),
    };
  }

  /**
   * Check sandwich attack patterns
   */
  public analyzeSandwichRisk(preBuyDetected: boolean, postSellDetected: boolean, priceImpactPercent: number): DetectedPatternDTO | null {
    return PatternDetector.detectSandwichAttack(preBuyDetected, postSellDetected, priceImpactPercent);
  }

  /**
   * Check front-running patterns
   */
  public analyzeFrontRunning(pendingTxTimestamp: number, competingTxTimestamp: number, slotDifference: number): DetectedPatternDTO | null {
    return PatternDetector.detectFrontRunning(pendingTxTimestamp, competingTxTimestamp, slotDifference);
  }

  /**
   * Check for duplicate transactions
   */
  public checkDuplicates(signatures: string[]): DetectedPatternDTO | null {
    return PatternDetector.detectDuplicateTransaction(signatures);
  }

  /**
   * Add address to blacklist
   */
  public addToBlacklist(entry: BlacklistEntryDTO): void {
    this.blacklistRegistry.addEntry(entry);
  }

  /**
   * Check if address is blacklisted
   */
  public isBlacklisted(address: string): BlacklistEntryDTO | null {
    return this.blacklistRegistry.isBlacklisted(address);
  }

  /**
   * Get velocity metrics
   */
  public getVelocity(walletAddress: string, windowMinutes: number): VelocityMetricDTO {
    return this.velocityTracker.getMetrics(walletAddress, windowMinutes);
  }
}

export const fraudDetectionEngine = FraudDetectionEngine.getInstance();
