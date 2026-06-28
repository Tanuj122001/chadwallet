import { logger } from '../../utils/logger';

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

class BalanceEngine {
  private readonly LAMPORTS_PER_SOL = 1_000_000_000;
  
  // Metadata cache dictionary
  private tokenMetadataCache = new Map<string, TokenMetadata>();

  constructor() {
    // Populate cache with standard default SPL token listings (e.g. USDC, BONK)
    this.registerMetadata({
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    });
    this.registerMetadata({
      mint: 'DezXAZ8z7PnrnRJjz3wX4m1R125B6HJ6YuxC2J65ip62',
      symbol: 'BONK',
      name: 'Bonk',
      decimals: 5,
      logoUrl: 'https://hbb.finance/images/bonk.png',
    });
  }

  // Lamports to SOL conversion helper
  public lamportsToSol(lamports: number): number {
    return lamports / this.LAMPORTS_PER_SOL;
  }

  // SOL to Lamports conversion helper
  public solToLamports(sol: number): number {
    return Math.floor(sol * this.LAMPORTS_PER_SOL);
  }

  // Formatter for balances
  public formatBalance(amount: number, decimals = 4): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  // Calculate Solana rent exemption estimate in SOL for accounts
  public getRentExemptionEstimate(dataLength: number): number {
    // Solana base rent model calculation: ~0.002048 SOL for 165 byte accounts (standard Associated Token Accounts)
    const baseRentLamports = 2039280;
    const ratePerByte = 19;
    const totalLamports = baseRentLamports + (dataLength * ratePerByte);
    return this.lamportsToSol(totalLamports);
  }

  // Register Token Metadata helpers
  public registerMetadata(meta: TokenMetadata): void {
    this.tokenMetadataCache.set(meta.mint, meta);
    logger.debug(`[BalanceEngine] Registered token metadata for mint: ${meta.mint} (${meta.symbol})`);
  }

  // Resolves token metadata from cache, or returns fallback safe layout if unknown
  public resolveTokenMetadata(mint: string): TokenMetadata {
    const cached = this.tokenMetadataCache.get(mint);
    if (cached) return cached;

    // Default unknown token mapping layout
    return {
      mint,
      symbol: 'UNKNOWN',
      name: 'Unrecognized Token',
      decimals: 9,
    };
  }

  // Parses raw token program RPC accounts into mapped holding list
  public parseTokenAccounts(rpcAccounts: any[]): Array<{ mint: string; balance: number; metadata: TokenMetadata }> {
    const parsed: Array<{ mint: string; balance: number; metadata: TokenMetadata }> = [];

    rpcAccounts.forEach(accountInfo => {
      try {
        const parsedData = accountInfo.account.data.parsed.info;
        const mint = parsedData.mint;
        const rawAmount = parsedData.tokenAmount.amount;
        const decimals = parsedData.tokenAmount.decimals;
        
        const balance = Number(rawAmount) / Math.pow(10, decimals);
        
        // Skip accounts with zero balances
        if (balance === 0) return;

        const metadata = this.resolveTokenMetadata(mint);
        
        // Fallback update decimals if mismatched
        if (metadata.symbol === 'UNKNOWN') {
          metadata.decimals = decimals;
        }

        parsed.push({
          mint,
          balance,
          metadata,
        });
      } catch (e) {
        logger.error('[BalanceEngine] Failed to parse SPL account information', e);
      }
    });

    return parsed;
  }
}

export const balanceEngine = new BalanceEngine();
export default balanceEngine;
