/**
 * Application Configuration Management
 */

export const Environment = {
  NODE_ENV: __DEV__ ? 'development' : 'production',
  
  // Solana RPC Endpoint definitions (Alchemy clients load from here)
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  ALCHEMY_API_KEY: '', // Loaded via secure storage/config injection
  
  // Privy Client identifiers
  PRIVY_APP_ID: '', 
  
  // Supabase connection keys
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  
  // Birdeye api config
  BIRDEYE_API_URL: 'https://public-api.birdeye.so',
  
  // Jupiter aggregator endpoint
  JUPITER_API_URL: 'https://quote-api.jup.ag/v6',
} as const;

export const AppConfig = {
  appName: 'ChadWallet',
  version: '1.0.0',
  buildNumber: '1',
  supportEmail: 'support@chadwallet.xyz',
  defaultSlippageBps: 50, // 0.5% default slippage
  maxSlippageBps: 500, // 5% maximum slippage
} as const;

export const FeatureFlags = {
  enablePrivyAuth: false, // Feature toggles for Privy embedded flows
  enableJupiterSwaps: false,
  enableBirdeyeMarketData: false,
  enablePushNotifications: false,
  enableWebSocketsPriceStream: false,
  enableTestnetFallback: __DEV__,
} as const;

export const ThemeConfig = {
  colors: {
    background: '#000000',
    card: '#16171F',
    cardBorder: '#2A2D39',
    primary: '#22F27C',
    negative: '#FF5C5C',
    textPrimary: '#FFFFFF',
    textSecondary: '#8D94A7',
    textMuted: '#5D6473',
  },
  spacing: {
    paddingHorizontal: 20,
    headerToSearch: 20,
    searchToChips: 16,
  },
} as const;
