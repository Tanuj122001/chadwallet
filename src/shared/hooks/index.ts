import { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/authStore';
import { useWalletStore } from '../../features/wallet/walletStore';
import { useMarketStore } from '../../features/market/marketStore';
import { useTradeStore } from '../../features/trading/tradeStore';
import { usePortfolioStore } from '../../features/portfolio/portfolioStore';
import { useSettingsStore } from '../../features/settings/settingsStore';
import { TokenSymbol, WalletAddress } from '../../core/types';

/**
 * Custom React Hooks Bridging UI Screens to state management slices
 */

export const useAuth = () => {
  const { user, status, logout } = useAuthStore();
  
  const login = async (provider: 'google' | 'apple' | 'twitter') => {
    if (provider === 'google') {
      await useAuthStore.getState().signInWithGoogle('mock-id-token');
    } else {
      await useAuthStore.getState().signInWithEmail('chad@chadwallet.xyz', 'password');
    }
  };

  return {
    user,
    loading: status === 'loading',
    error: status === 'error',
    login,
    logout,
    isAuthenticated: !!user,
  };
};

export const useWallet = () => {
  const { activeWallet, wallets, loadingState, createWallet, importWallet, setActiveWallet } = useWalletStore();
  return {
    activeWallet,
    wallets,
    loading: loadingState === 'loading',
    error: loadingState === 'error',
    createWallet,
    importWallet,
    setActiveWallet,
  };
};

export const usePortfolio = (address?: WalletAddress) => {
  const { portfolio, loadingState, fetchPortfolio } = usePortfolioStore();
  
  useEffect(() => {
    if (address) {
      fetchPortfolio(address);
    }
  }, [address, fetchPortfolio]);

  return {
    portfolio,
    loading: loadingState === 'loading',
    error: loadingState === 'error',
    fetchPortfolio,
  };
};

export const useMarket = (symbol?: TokenSymbol) => {
  const { stats, history, loadingState, fetchStats, fetchHistory, fetchTrending, trending } = useMarketStore();
  const currentStats = symbol ? stats[symbol] : null;

  return {
    stats: currentStats,
    history,
    trending,
    loading: loadingState === 'loading',
    error: loadingState === 'error',
    fetchStats,
    fetchHistory,
    fetchTrending,
  };
};

export const useTrade = () => {
  const { quote, loadingState, getQuote, executeSwap } = useTradeStore();
  const { settings } = useSettingsStore();

  return {
    quote,
    loading: loadingState === 'loading',
    error: loadingState === 'error',
    settings,
    getQuote,
    executeSwap,
  };
};

export const useToken = (symbol: TokenSymbol) => {
  const { stats, fetchStats } = useMarketStore();
  const tokenStats = stats[symbol] || null;

  return {
    stats: tokenStats,
    fetchStats: () => fetchStats(symbol),
  };
};
export default useAuth;
