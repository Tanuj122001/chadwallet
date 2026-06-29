/**
 * Fiat Provider Manager — Fiat on/off ramp compliance engines, country rule restrictions, KYC state tracking, payment method managers, supported assets, and provider abstractions
 */

import { logger } from '../../utils/logger';

export type KYCStatus = 'uninitiated' | 'pending' | 'approved' | 'rejected';

export interface KYCState {
  userId: string;
  providerName: string;
  status: KYCStatus;
  updatedAt: number;
  failureReason?: string;
}

export interface SupportedFiatMethod {
  id: string;
  name: string;
  description: string;
  feePercent: number;
  processingTime: string;
}

export interface OnRampQuote {
  quoteId: string;
  providerName: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  feeAmount: number;
  netAmount: number;
  expiresAt: number;
}

export interface OffRampQuote {
  quoteId: string;
  providerName: string;
  fiatCurrency: string;
  cryptoCurrency: string;
  fiatAmount: number;
  cryptoAmount: number;
  feeAmount: number;
  netAmount: number;
  expiresAt: number;
}

export interface IFiatProvider {
  name: string;
  getSupportedMethods(countryCode: string): Promise<SupportedFiatMethod[]>;
  getOnRampQuote(fiatCurrency: string, cryptoCurrency: string, amount: number, methodId: string): Promise<OnRampQuote>;
  getOffRampQuote(fiatCurrency: string, cryptoCurrency: string, amount: number, methodId: string): Promise<OffRampQuote>;
  submitKYC(userId: string, documentDetails: string): Promise<KYCState>;
  getKYCStatus(userId: string): Promise<KYCState>;
}

// ---------------------------------------------------------
// Managers & Engines
// ---------------------------------------------------------

export class CountryRulesEngine {
  private restrictedCountries = new Set<string>(['KP', 'IR', 'SY', 'CU']);
  private supportedFiatMap = new Map<string, string[]>([
    ['US', ['USD']],
    ['GB', ['GBP', 'EUR']],
    ['DE', ['EUR']],
    ['FR', ['EUR']],
    ['JP', ['JPY']],
  ]);

  public isCountryRestricted(countryCode: string): boolean {
    return this.restrictedCountries.has(countryCode.toUpperCase());
  }

  public getSupportedFiatCurrencies(countryCode: string): string[] {
    if (this.isCountryRestricted(countryCode)) return [];
    return this.supportedFiatMap.get(countryCode.toUpperCase()) || ['USD'];
  }
}

export class KYCStateManager {
  private kycRecords = new Map<string, KYCState>();

  public saveStatus(record: KYCState): void {
    this.kycRecords.set(`${record.userId}:${record.providerName}`, record);
    logger.info(`[KYCStateManager] User ${record.userId} KYC status updated to ${record.status} on provider ${record.providerName}`);
  }

  public getStatus(userId: string, providerName: string): KYCState {
    const key = `${userId}:${providerName}`;
    return this.kycRecords.get(key) || {
      userId,
      providerName,
      status: 'uninitiated',
      updatedAt: Date.now(),
    };
  }
}

export class PaymentMethodManager {
  private methods = new Map<string, SupportedFiatMethod[]>([
    ['US', [
      { id: 'ach', name: 'ACH Transfer', description: 'Bank transfer', feePercent: 1.0, processingTime: '1-3 business days' },
      { id: 'card', name: 'Credit/Debit Card', description: 'Instant card buy', feePercent: 3.5, processingTime: 'Instant' },
    ]],
    ['GB', [
      { id: 'fps', name: 'Faster Payments', description: 'Instant bank transfer', feePercent: 0.5, processingTime: 'Under 2 hours' },
      { id: 'card', name: 'Credit/Debit Card', description: 'Instant card buy', feePercent: 3.0, processingTime: 'Instant' },
    ]],
  ]);

  public getMethods(countryCode: string): SupportedFiatMethod[] {
    return this.methods.get(countryCode.toUpperCase()) || [
      { id: 'card', name: 'Credit/Debit Card', description: 'Instant card buy', feePercent: 3.9, processingTime: 'Instant' },
    ];
  }
}

export class OnRampManager {
  constructor(private readonly providerManager: FiatProviderManager) {}

  public async getQuotes(fiatCurrency: string, cryptoCurrency: string, amount: number, countryCode: string): Promise<OnRampQuote[]> {
    if (this.providerManager.countryRulesEngine.isCountryRestricted(countryCode)) {
      throw new Error(`Country ${countryCode} is restricted from fiat on-ramp operations`);
    }

    const providers = this.providerManager.getProviders();
    const quotes: OnRampQuote[] = [];

    await Promise.all(
      providers.map(async p => {
        try {
          const methods = await p.getSupportedMethods(countryCode);
          if (methods.length > 0) {
            const q = await p.getOnRampQuote(fiatCurrency, cryptoCurrency, amount, methods[0].id);
            quotes.push(q);
          }
        } catch {
          // Suppress quote fetch failure for dynamic comparison
        }
      })
    );

    return quotes;
  }
}

export class OffRampManager {
  constructor(private readonly providerManager: FiatProviderManager) {}

  public async getQuotes(fiatCurrency: string, cryptoCurrency: string, amount: number, countryCode: string): Promise<OffRampQuote[]> {
    if (this.providerManager.countryRulesEngine.isCountryRestricted(countryCode)) {
      throw new Error(`Country ${countryCode} is restricted from fiat off-ramp operations`);
    }

    const providers = this.providerManager.getProviders();
    const quotes: OffRampQuote[] = [];

    await Promise.all(
      providers.map(async p => {
        try {
          const methods = await p.getSupportedMethods(countryCode);
          if (methods.length > 0) {
            const q = await p.getOffRampQuote(fiatCurrency, cryptoCurrency, amount, methods[0].id);
            quotes.push(q);
          }
        } catch {
          // Suppress quote fetch failure for dynamic comparison
        }
      })
    );

    return quotes;
  }
}

// ---------------------------------------------------------
// Main FiatProviderManager Orchestrator
// ---------------------------------------------------------

export class FiatProviderManager {
  private providers: Map<string, IFiatProvider> = new Map();
  public countryRulesEngine = new CountryRulesEngine();
  public kycStateManager = new KYCStateManager();
  public paymentMethodManager = new PaymentMethodManager();

  public onRamp = new OnRampManager(this);
  public offRamp = new OffRampManager(this);

  public registerProvider(provider: IFiatProvider): void {
    this.providers.set(provider.name, provider);
    logger.debug(`[FiatProviderManager] Registered provider: ${provider.name}`);
  }

  public getProviders(): IFiatProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvider(name: string): IFiatProvider | null {
    return this.providers.get(name) || null;
  }
}

export const fiatProviderManager = new FiatProviderManager();
export default fiatProviderManager;
