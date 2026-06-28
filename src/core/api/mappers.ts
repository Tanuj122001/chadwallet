import {
  TokenDTO,
  WalletDTO,
  HoldingDTO,
  PortfolioDTO,
  SwapQuoteDTO,
  MarketStatsDTO,
  OHLCDTO,
  NotificationDTO,
  UserDTO,
  SessionDTO,
} from './dtos';
import {
  Token,
  Wallet,
  Holding,
  Portfolio,
  SwapQuote,
  MarketStats,
  OHLC,
  Notification,
  User,
  Session,
} from '../models';
import {
  WalletAddress,
  PublicKey,
  TokenSymbol,
  USDValue,
  Percentage,
} from '../types';

export class TokenMapper {
  public static toDomain(dto: TokenDTO): Token {
    return {
      id: dto.id,
      symbol: dto.symbol as TokenSymbol,
      name: dto.name,
      decimals: dto.decimals,
      contractAddress: dto.contract_address as PublicKey,
      logoUrl: dto.logo_url,
    };
  }

  public static toDTO(domain: Token): TokenDTO {
    return {
      id: domain.id,
      symbol: domain.symbol,
      name: domain.name,
      decimals: domain.decimals,
      contract_address: domain.contractAddress,
      logo_url: domain.logoUrl,
    };
  }
}

export class WalletMapper {
  public static toDomain(dto: WalletDTO): Wallet {
    return {
      address: dto.address as WalletAddress,
      label: dto.label,
      publicKey: dto.public_key as PublicKey,
      balanceSol: dto.balance_sol,
      balanceUsd: dto.balance_usd as USDValue,
      isActive: dto.is_active,
    };
  }

  public static toDTO(domain: Wallet): WalletDTO {
    return {
      address: domain.address,
      label: domain.label,
      public_key: domain.publicKey,
      balance_sol: domain.balanceSol,
      balance_usd: domain.balanceUsd,
      is_active: domain.isActive,
    };
  }
}

export class HoldingMapper {
  public static toDomain(dto: HoldingDTO): Holding {
    return {
      token: TokenMapper.toDomain(dto.token),
      amount: dto.amount,
      balanceUsd: dto.balance_usd as USDValue,
      change24h: dto.change_24h as Percentage,
    };
  }

  public static toDTO(domain: Holding): HoldingDTO {
    return {
      token: TokenMapper.toDTO(domain.token),
      amount: domain.amount,
      balance_usd: domain.balanceUsd,
      change_24h: domain.change24h,
    };
  }
}

export class PortfolioMapper {
  public static toDomain(dto: PortfolioDTO): Portfolio {
    return {
      id: dto.id,
      totalBalanceUsd: dto.total_balance_usd as USDValue,
      holdings: dto.holdings.map(HoldingMapper.toDomain),
      change24h: dto.change_24h as Percentage,
    };
  }
}

export class SwapQuoteMapper {
  public static toDomain(dto: SwapQuoteDTO): SwapQuote {
    return {
      quoteId: dto.quote_id,
      inputTokenSymbol: dto.input_token_symbol as TokenSymbol,
      outputTokenSymbol: dto.output_token_symbol as TokenSymbol,
      inputAmount: dto.input_amount,
      outputAmount: dto.output_amount,
      priceImpact: dto.price_impact as Percentage,
      slippageBps: dto.slippage_bps,
      routePlan: dto.route_plan,
    };
  }
}

export class MarketStatsMapper {
  public static toDomain(dto: MarketStatsDTO): MarketStats {
    return {
      liquidity: dto.liquidity_usd as USDValue,
      fdv: dto.fdv_usd as USDValue,
      marketCap: dto.market_cap_usd as USDValue,
      volume24h: dto.volume_24h_usd as USDValue,
      holdersCount: dto.holders_count,
      circulatingSupply: dto.circulating_supply,
      totalSupply: dto.total_supply,
    };
  }
}

export class OHLCMapper {
  public static toDomain(dto: OHLCDTO): OHLC {
    return {
      time: dto.time,
      open: dto.open,
      high: dto.high,
      low: dto.low,
      close: dto.close,
      volume: dto.volume,
    };
  }
}

export class NotificationMapper {
  public static toDomain(dto: NotificationDTO): Notification {
    return {
      id: dto.id,
      title: dto.title,
      body: dto.body,
      timestamp: dto.timestamp,
      isRead: dto.is_read,
      type: dto.type,
    };
  }
}

export class UserMapper {
  public static toDomain(dto: UserDTO): User {
    return {
      id: dto.id,
      email: dto.email,
      walletAddress: dto.wallet_address as WalletAddress,
      createdAt: dto.created_at,
    };
  }

  public static toDTO(domain: User): UserDTO {
    return {
      id: domain.id,
      email: domain.email,
      wallet_address: domain.walletAddress,
      created_at: domain.createdAt,
    };
  }
}

export class SessionMapper {
  public static toDomain(dto: SessionDTO): Session {
    return {
      accessToken: dto.access_token,
      refreshToken: dto.refresh_token,
      userId: dto.user_id,
      expiresAt: dto.expires_at,
      metadata: dto.metadata,
    };
  }

  public static toDTO(domain: Session): SessionDTO {
    return {
      access_token: domain.accessToken,
      refresh_token: domain.refreshToken,
      user_id: domain.userId,
      expires_at: domain.expiresAt,
      metadata: domain.metadata,
    };
  }
}

