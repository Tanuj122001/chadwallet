/**
 * Production Analytics Manager — Privacy-safe session, conversion, retention, feature usage analytics, performance metrics, and crash monitoring abstractions
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface IAnalyticsProvider {
  name: string;
  trackEvent(event: AnalyticsEvent): Promise<void>;
}

export class MockMixpanelProvider implements IAnalyticsProvider {
  public name = 'mixpanel';

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    logger.debug(`[MixpanelAnalytics] Ingested event: ${event.eventName}`, event.properties);
  }
}

// ---------------------------------------------------------
// ProductionAnalyticsManager Orchestrator
// ---------------------------------------------------------

export class ProductionAnalyticsManager {
  private providers: IAnalyticsProvider[] = [];
  private sessionStartTime = 0;
  private currentSessionId = '';

  constructor() {
    this.providers.push(new MockMixpanelProvider());
  }

  public registerProvider(provider: IAnalyticsProvider): void {
    this.providers.push(provider);
  }

  public startSession(userId: string): void {
    if (!featureFlagsManager.isEnabled('ENABLE_ANALYTICS')) return;

    this.sessionStartTime = Date.now();
    this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Privacy-safe tracking: anonymize properties (do not pass precise emails or PII)
    const anonymizedUserId = this.anonymizeString(userId);
    this.trackEvent('session_start', {
      session_id: this.currentSessionId,
      anonymized_user_id: anonymizedUserId,
      platform: 'android',
    });
  }

  public endSession(userId: string): void {
    if (!featureFlagsManager.isEnabled('ENABLE_ANALYTICS') || !this.currentSessionId) return;

    const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);
    this.trackEvent('session_end', {
      session_id: this.currentSessionId,
      anonymized_user_id: this.anonymizeString(userId),
      session_duration_seconds: durationSeconds,
    });

    this.currentSessionId = '';
    this.sessionStartTime = 0;
  }

  public trackEvent(name: string, properties: Record<string, string | number | boolean> = {}): void {
    if (!featureFlagsManager.isEnabled('ENABLE_ANALYTICS')) return;

    const sanitizedProps = this.redactSensitiveData(properties);
    const event: AnalyticsEvent = {
      eventName: name,
      properties: {
        ...sanitizedProps,
        session_id: this.currentSessionId || 'background',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.providers.forEach(p => {
      p.trackEvent(event).catch(err =>
        logger.warn(`[ProductionAnalyticsManager] Provider ${p.name} failed to process event: ${name}`, err)
      );
    });
  }

  public trackConversion(funnelName: string, step: number, totalSteps: number, metadata: Record<string, string | number | boolean> = {}): void {
    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step_index: step,
      total_steps: totalSteps,
      percent_complete: Math.round((step / totalSteps) * 100),
      ...metadata,
    });
  }

  public trackFeatureUsage(featureKey: string, success: boolean, properties: Record<string, string | number | boolean> = {}): void {
    this.trackEvent('feature_use', {
      feature_key: featureKey,
      success_status: success,
      ...properties,
    });
  }

  public trackRetentionMetric(userId: string, retentionDays: number): void {
    this.trackEvent('user_retention', {
      anonymized_user_id: this.anonymizeString(userId),
      retention_bucket_days: retentionDays,
    });
  }

  private anonymizeString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `anon_hash_${Math.abs(hash).toString(16)}`;
  }

  private redactSensitiveData(props: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const redacted: Record<string, string | number | boolean> = {};
    const sensitiveKeys = ['privatekey', 'seedphrase', 'mnemonic', 'pin', 'password', 'email', 'phone'];

    for (const [key, value] of Object.entries(props)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  public getSessionId(): string {
    return this.currentSessionId;
  }
}

export const productionAnalyticsManager = new ProductionAnalyticsManager();
export default productionAnalyticsManager;
