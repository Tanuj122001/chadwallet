/**
 * Environment Configuration Loader for ChadWallet
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production';
  SOLANA_RPC_URL: string;
  ALCHEMY_API_KEY: string;
  PRIVY_APP_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  BIRDEYE_API_URL: string;
  JUPITER_API_URL: string;
  WS_PRICE_STREAM_URL: string;
}

// Development configuration matching .env.development
const DevConfig: EnvConfig = {
  NODE_ENV: 'development',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  ALCHEMY_API_KEY: 'mock-alchemy-dev-key',
  PRIVY_APP_ID: 'mock-privy-dev-app-id',
  SUPABASE_URL: 'https://mock-supabase-dev.supabase.co',
  SUPABASE_ANON_KEY: 'mock-supabase-dev-anon-key',
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  JUPITER_API_URL: 'https://quote-api.jup.ag/v6',
  WS_PRICE_STREAM_URL: 'wss://public-api.birdeye.so/socket',
};

// Production configuration matching .env.production
const ProdConfig: EnvConfig = {
  NODE_ENV: 'production',
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  ALCHEMY_API_KEY: 'mock-alchemy-prod-key',
  PRIVY_APP_ID: 'mock-privy-prod-app-id',
  SUPABASE_URL: 'https://mock-supabase-prod.supabase.co',
  SUPABASE_ANON_KEY: 'mock-supabase-prod-anon-key',
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  JUPITER_API_URL: 'https://quote-api.jup.ag/v6',
  WS_PRICE_STREAM_URL: 'wss://public-api.birdeye.so/socket',
};

class EnvLoader {
  private config: EnvConfig;

  constructor() {
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
    this.config = isDev ? DevConfig : ProdConfig;
  }

  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  public getAll(): EnvConfig {
    return { ...this.config };
  }
}

export const envLoader = new EnvLoader();
