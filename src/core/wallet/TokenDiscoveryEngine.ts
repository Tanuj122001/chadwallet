/**
 * Token Discovery Engine — Verified Token Registry, SPL Metadata, NFT Resolvers, Scam registers, spam filters, validator, cache, and logo resolvers
 */


export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
  isVerified: boolean;
  isSpam: boolean;
  score: number; // Verification health score 0 to 100
}

export interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  imageUri?: string;
  description?: string;
  collectionName?: string;
  isVerified: boolean;
}

// ---------------------------------------------------------
// registries
// ---------------------------------------------------------

export class VerifiedTokenRegistry {
  private verifiedMints = new Set<string>([
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'JUPyiwrTLwsNs7W2gAG5zrrJHT8HCwi3VYGEZk13mGD', // JUP
  ]);

  public isVerified(mint: string): boolean {
    return this.verifiedMints.has(mint);
  }

  public addVerified(mint: string): void {
    this.verifiedMints.add(mint);
  }
}

export class ScamTokenRegistry {
  private scamMints = new Set<string>([
    'draiN5j39KkBLasKjCr9287HhBshsKj298Hhsh289Hh',
    'fakeUSDCmintAddressxxxxxxxxxxxxxxxxxxxxxxxx',
    'claimFreeTokensMintxxxxxxxxxxxxxxxxxxxxxxxxx',
  ]);

  public isScam(mint: string): boolean {
    return this.scamMints.has(mint);
  }

  public addScam(mint: string): void {
    this.scamMints.add(mint);
  }
}

// ---------------------------------------------------------
// Validators & Spam Filters
// ---------------------------------------------------------

export class MetadataValidator {
  public static validate(name: string, symbol: string): boolean {
    // Basic verification format checks
    if (!name || name.trim().length === 0) return false;
    if (!symbol || symbol.trim().length === 0) return false;
    return name.length < 50 && symbol.length < 15;
  }
}

export class SpamTokenFilter {
  private static readonly SPAM_WORDS = [
    'claim', 'free', 'airdrop', 'winner', 'gift', 'reward', 'voucher', 'bonus', 'double'
  ];

  public static checkSpam(name: string, symbol: string): boolean {
    const combined = `${name.toLowerCase()} ${symbol.toLowerCase()}`;
    return this.SPAM_WORDS.some(word => combined.includes(word));
  }
}

// ---------------------------------------------------------
// Resolvers
// ---------------------------------------------------------

export class LogoResolver {
  public static getFallbackLogo(mint: string): string {
    return `https://images.chadwallet.io/tokens/${mint}.png`;
  }
}

export class TokenMetadataResolver {
  constructor(
    private readonly verifiedRegistry: VerifiedTokenRegistry,
    private readonly scamRegistry: ScamTokenRegistry
  ) {}

  public async resolve(mint: string): Promise<TokenMetadata> {
    // Checks registers
    const isScam = this.scamRegistry.isScam(mint);
    const isVerified = this.verifiedRegistry.isVerified(mint);

    // Mock resolve values (In prod, fetch metadata program or Helius API)
    let name = 'Unknown Token';
    let symbol = 'UNKNOWN';
    let decimals = 9;

    if (mint === 'So11111111111111111111111111111111111111112') {
      name = 'Wrapped SOL';
      symbol = 'SOL';
      decimals = 9;
    } else if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      name = 'USD Coin';
      symbol = 'USDC';
      decimals = 6;
    }

    const isSpam = SpamTokenFilter.checkSpam(name, symbol);
    const score = isVerified ? 100 : isScam ? 0 : isSpam ? 10 : 50;

    return {
      mint,
      name,
      symbol,
      decimals,
      logoUri: LogoResolver.getFallbackLogo(mint),
      isVerified,
      isSpam,
      score,
    };
  }
}

export class NFTMetadataResolver {
  public async resolve(mint: string): Promise<NFTMetadata> {
    return {
      mint,
      name: `Chad NFT #${mint.substring(0, 4)}`,
      symbol: 'CHAD',
      uri: `https://metadata.chadwallet.io/nfts/${mint}`,
      imageUri: `https://images.chadwallet.io/nfts/${mint}.png`,
      description: 'The premier Chad NFT asset collection item.',
      collectionName: 'Chad Collection',
      isVerified: true,
    };
  }
}

// ---------------------------------------------------------
// Cache Manager & Verification Engine
// ---------------------------------------------------------

export class TokenCache {
  private cache = new Map<string, { data: TokenMetadata; timestamp: number }>();
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour

  public get(mint: string): TokenMetadata | null {
    const cached = this.cache.get(mint);
    if (cached && Date.now() - cached.timestamp < this.TTL_MS) {
      return cached.data;
    }
    return null;
  }

  public set(mint: string, metadata: TokenMetadata): void {
    this.cache.set(mint, { data: metadata, timestamp: Date.now() });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export class TokenVerificationEngine {
  constructor(
    private readonly metadataResolver: TokenMetadataResolver,
    private readonly tokenCache: TokenCache
  ) {}

  public async verifyToken(mint: string): Promise<TokenMetadata> {
    const cached = this.tokenCache.get(mint);
    if (cached) return cached;

    const resolved = await this.metadataResolver.resolve(mint);
    this.tokenCache.set(mint, resolved);
    return resolved;
  }
}

// ---------------------------------------------------------
// Main Orchestration Facade
// ---------------------------------------------------------

export class TokenDiscoveryEngine {
  public verifiedRegistry = new VerifiedTokenRegistry();
  public scamRegistry = new ScamTokenRegistry();
  public tokenCache = new TokenCache();

  public metadataResolver: TokenMetadataResolver;
  public nftResolver = new NFTMetadataResolver();
  public verificationEngine: TokenVerificationEngine;

  constructor() {
    this.metadataResolver = new TokenMetadataResolver(this.verifiedRegistry, this.scamRegistry);
    this.verificationEngine = new TokenVerificationEngine(this.metadataResolver, this.tokenCache);
  }

  public async getMetadata(mint: string): Promise<TokenMetadata> {
    return await this.verificationEngine.verifyToken(mint);
  }

  public async getNFTMetadata(mint: string): Promise<NFTMetadata> {
    return await this.nftResolver.resolve(mint);
  }
}

export const tokenDiscoveryEngine = new TokenDiscoveryEngine();
export default tokenDiscoveryEngine;
