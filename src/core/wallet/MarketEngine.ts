import { MarketDTO, TokenMetadataDTO } from '../api/MarketDTOs';

// Sub-Engine: Price Engine & Price Formatter
export class PriceEngine {
  public static formatPrice(price: number): string {
    if (price === 0) return '$0.00';
    if (price < 0.01) {
      // High decimal formatting for micro-caps (e.g. BONK)
      return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 });
    }
    return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  public static formatPercentage(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }

  public static formatMarketCap(usdValue: number): string {
    if (usdValue >= 1_000_000_000) {
      return `$${(usdValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (usdValue >= 1_000_000) {
      return `$${(usdValue / 1_000_000).toFixed(2)}M`;
    }
    return `$${usdValue.toLocaleString()}`;
  }

  // Currency Converter helper (architected for multichain fiat routing)
  public static convertCurrency(amount: number, rate: number): number {
    return amount * rate;
  }
}

// Sub-Engine: Chart Engine (OHLC ranges and TradingView hooks compatibility)
export class ChartEngine {
  public static resolveRangeInterval(range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'): { interval: string; limit: number } {
    switch (range) {
      case '1H': return { interval: '1m', limit: 60 };
      case '4H': return { interval: '5m', limit: 48 };
      case '1D': return { interval: '15m', limit: 96 };
      case '1W': return { interval: '1h', limit: 168 };
      case '1M': return { interval: '4h', limit: 180 };
      case '1Y': return { interval: '1d', limit: 365 };
      default: return { interval: '1d', limit: 1000 };
    }
  }
}

// Sub-Engine: Search Engine (Fuzzy Search Indexer)
export class SearchEngine {
  public static fuzzySearch(query: string, tokens: MarketDTO[]): MarketDTO[] {
    if (!query) return tokens;
    const cleanQuery = query.toLowerCase().trim();

    return tokens.filter(token => {
      const matchSymbol = token.symbol.toLowerCase().includes(cleanQuery);
      const matchName = token.name.toLowerCase().includes(cleanQuery);
      const matchMint = token.mint_address.toLowerCase() === cleanQuery;
      
      // Basic Lev-distance or partial prefix matching
      const partialSymbolMatch = token.symbol.toLowerCase().startsWith(cleanQuery);

      return matchSymbol || matchName || matchMint || partialSymbolMatch;
    });
  }
}

// Sub-Engine: Trending Engine
export class TrendingEngine {
  public static sortGainers(tokens: MarketDTO[]): MarketDTO[] {
    return [...tokens].sort((a, b) => b.change_24h_percent - a.change_24h_percent);
  }

  public static sortLosers(tokens: MarketDTO[]): MarketDTO[] {
    return [...tokens].sort((a, b) => a.change_24h_percent - b.change_24h_percent);
  }

  public static sortVolume(tokens: MarketDTO[]): MarketDTO[] {
    return [...tokens].sort((a, b) => b.volume_24h_usd - a.volume_24h_usd);
  }
}

// Sub-Engine: Metadata Engine (Resolves validation markers and website security links)
export class MetadataEngine {
  public static sanitizeMetadataLinks(metadata: TokenMetadataDTO): TokenMetadataDTO {
    const sanitized = { ...metadata };
    
    // Prevent malicious iframe or XSS link injections
    if (sanitized.website_url && !/^https?:\/\//i.test(sanitized.website_url)) {
      sanitized.website_url = 'https://' + sanitized.website_url;
    }
    if (sanitized.discord_url && !/^https?:\/\//i.test(sanitized.discord_url)) {
      sanitized.discord_url = 'https://' + sanitized.discord_url;
    }
    
    return sanitized;
  }
}

// Main Market Engine Orchestrator
class MarketEngine {
  public getPriceEngine() { return PriceEngine; }
  public getChartEngine() { return ChartEngine; }
  public getSearchEngine() { return SearchEngine; }
  public getTrendingEngine() { return TrendingEngine; }
  public getMetadataEngine() { return MetadataEngine; }
}

export const marketEngine = new MarketEngine();
export default marketEngine;
