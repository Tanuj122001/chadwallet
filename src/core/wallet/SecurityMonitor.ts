import { alertEngine } from './AlertEngine';
import { eventEngine } from './EventEngine';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export class SecurityMonitor {
  private static instance: SecurityMonitor | null = null;
  private blacklist = new Set<string>(); // blacklisted addresses

  private constructor() {
    this.initializeBlacklist();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private initializeBlacklist(): void {
    // Standard mock blacklisted scam addresses
    this.blacklist.add('scam_wallet_address_12345');
    this.blacklist.add('rug_token_creator_address_54321');
  }

  // Check smart contract upgrade risks
  public async monitorProgramUpgrade(programId: string, authority: string, isUpgradeable: boolean): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_SECURITY_ALERTS')) return;

    logger.warn(`[SecurityMonitor] Contract update detected: Program ID ${programId}, Authority ${authority}`);

    // If upgraded by an unknown authority or upgraded with freeze flag
    if (this.blacklist.has(authority) || isUpgradeable) {
      await alertEngine.processTelemetry(
        'security', 
        programId, 
        'upgradeable_contract', 
        { authority, isUpgradeable }
      );
    }

    await eventEngine.publish({
      event_id: `evt_sec_upg_${programId}_${Date.now()}`,
      topic: 'security_audits',
      event_type: 'contract_upgraded',
      priority: 'high',
      payload: { programId, authority, isUpgradeable },
      timestamp: Date.now(),
    });
  }

  // Check token metadata for rug pull flags & spam claim links
  public async evaluateTokenMetadata(mint: string, name: string, symbol: string, creator: string): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_SECURITY_ALERTS')) return;

    const nameLower = name.toLowerCase();
    const symbolLower = symbol.toLowerCase();
    let isSpam = false;

    // Check blacklisted creator
    if (this.blacklist.has(creator)) {
      isSpam = true;
    }

    // Check spam patterns
    if (
      nameLower.includes('claim') ||
      nameLower.includes('airdrop') ||
      nameLower.includes('free') ||
      nameLower.includes('reward') ||
      symbolLower.includes('claim') ||
      symbolLower.includes('airdrop')
    ) {
      isSpam = true;
    }

    if (isSpam) {
      logger.warn(`[SecurityMonitor] Scam/Spam token metadata flagged for mint: ${mint}`);
      
      await alertEngine.processTelemetry('security', mint, 'spam_metadata', { name, symbol, creator });

      await eventEngine.publish({
        event_id: `evt_sec_spam_${mint}`,
        topic: 'security_audits',
        event_type: 'spam_token_flagged',
        priority: 'high',
        payload: { mint, name, symbol, creator },
        timestamp: Date.now(),
      });
    }
  }

  // Check wallet lock failures (failed authentication attempts)
  public async monitorFailedUnlockAttempts(walletAddress: string, attempts: number, lockoutTime: number): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_SECURITY_ALERTS')) return;

    logger.warn(`[SecurityMonitor] Failed unlock attempts on wallet ${walletAddress}: ${attempts} attempts.`);

    if (attempts >= 3) {
      await alertEngine.processTelemetry(
        'security', 
        walletAddress, 
        'brute_force_risk', 
        { attempts, lockoutTime }
      );

      await eventEngine.publish({
        event_id: `evt_sec_lockout_${walletAddress}_${Date.now()}`,
        topic: 'security_audits',
        event_type: 'brute_force_alert',
        priority: 'critical',
        payload: { walletAddress, attempts, lockoutTime },
        timestamp: Date.now(),
      });
    }
  }

  // Check blacklisted transaction receiver addresses
  public async checkBlacklistedReceiver(receiverAddress: string, amount: number): Promise<boolean> {
    if (this.blacklist.has(receiverAddress)) {
      logger.error(`[SecurityMonitor] Transaction blocked. Destination address is blacklisted: ${receiverAddress}`);
      
      await alertEngine.processTelemetry('security', receiverAddress, 'blacklisted_receiver', { amount });

      await eventEngine.publish({
        event_id: `evt_sec_blocked_${receiverAddress}_${Date.now()}`,
        topic: 'security_audits',
        event_type: 'transaction_blocked_blacklist',
        priority: 'critical',
        payload: { receiverAddress, amount },
        timestamp: Date.now(),
      });

      return true; // Blocked
    }
    return false; // Safe
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
