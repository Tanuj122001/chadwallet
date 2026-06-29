import React, { useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppHeader } from '../components/AppHeader';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { usePortfolioStore } from '../../features/portfolio/portfolioStore';
import { useAIStore } from '../../features/ai/aiStore';
import { colors } from '../theme/colors';
import { WalletAddress } from '../../core/types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import Svg, { Path, Circle } from 'react-native-svg';

export const PortfolioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { portfolio, loadingState, fetchPortfolio } = usePortfolioStore();
  const { insights, fetchBatchAnalysis } = useAIStore();

  useEffect(() => {
    // Simulated wallet address balance fetch
    fetchPortfolio('9xQ3Z2W6h8U7P7r5e6F4t6r8P7Q7e5F6t6r8P7Q7e5' as WalletAddress);
    fetchBatchAnalysis('9xQ3Z2W6h8U7P7r5e6F4t6r8P7Q7e5F6t6r8P7Q7e5');
  }, [fetchPortfolio, fetchBatchAnalysis]);

  if (loadingState === 'loading') {
    return (
      <ScreenContainer scrollable={false} padding={true}>
        <AppHeader title="Portfolio" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText variant="body" color="secondary" className="mt-4">
            Loading institutional dashboard...
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  // Fallback mocks if portfolio store returns empty
  const balance = portfolio?.totalBalanceUsd || 34842.18;
  const pnlPercent = portfolio?.change24h || 5.84;
  const holdings = portfolio?.holdings || [
    { token: { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9 }, amount: 152.4, balanceUsd: 22649.61, change24h: 5.84 },
    { token: { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 }, amount: 6968.4, balanceUsd: 6968.4, change24h: 0.0 },
    { token: { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXN1qruxts39551TABJ942YdB', decimals: 5 }, amount: 217670000, balanceUsd: 5224.17, change24h: 12.8 },
  ];

  return (
    <ScreenContainer scrollable={false} padding={true}>
      <AppHeader
        title="Portfolio"
        leftAction={
          <View className="w-8 h-8 bg-primary/20 items-center justify-center rounded-lg">
            <FontAwesome6 name="briefcase" size={16} color={colors.primary} iconStyle="solid" />
          </View>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-space-lg">
        {/* Net Worth Display */}
        <View className="items-center mt-space-sm mb-space-lg">
          <AppText variant="caption" color="secondary" className="uppercase tracking-widest">
            Net Worth
          </AppText>
          <AppText variant="display" weight="bold" className="text-white mt-1">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </AppText>
          <View className="flex-row items-center mt-2 bg-gains/10 px-3 py-1 rounded-radius-full border border-gains/20">
            <FontAwesome6 name="arrow-trend-up" size={12} color={colors.gains} iconStyle="solid" className="mr-1.5" />
            <AppText variant="caption" color="gains" weight="bold">
              +{pnlPercent}% ($1,922.50) Today
            </AppText>
          </View>
        </View>

        {/* Dynamic Sparkline trend representation */}
        <Card className="mb-space-lg p-space-md items-center h-28 justify-center">
          <Svg width="100%" height="80" viewBox="0 0 320 80">
            <Path
              d="M 0,60 C 40,55 80,70 120,40 C 160,10 200,50 240,15 C 280,-10 300,10 320,5"
              fill="none"
              stroke={colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Circle cx="320" cy="5" r="4" fill={colors.primary} />
          </Svg>
        </Card>

        {/* Sector Allocation donut metrics */}
        <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs uppercase tracking-wider">
          Asset Sector Allocation
        </AppText>
        <Card className="mb-space-lg flex-row justify-between items-center p-space-lg">
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-radius-xs bg-primary mr-2" />
            <View>
              <AppText variant="body" weight="semibold">DeFi</AppText>
              <AppText variant="caption" color="secondary">65% ($22,649)</AppText>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-radius-xs bg-secondary mr-2" />
            <View>
              <AppText variant="body" weight="semibold">Stablecoins</AppText>
              <AppText variant="caption" color="secondary">20% ($6,968)</AppText>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-radius-xs bg-accent mr-2" />
            <View>
              <AppText variant="body" weight="semibold">Memes</AppText>
              <AppText variant="caption" color="secondary">15% ($5,224)</AppText>
            </View>
          </View>
        </Card>

        {/* Assets Listings */}
        <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs uppercase tracking-wider">
          Holdings
        </AppText>
        <Card className="mb-space-lg p-0 px-space-md">
          {holdings.map((h, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                navigation.navigate('TokenDetails', { 
                  tokenId: h.token.symbol,
                  symbol: h.token.symbol,
                  name: h.token.name,
                  price: h.balanceUsd / h.amount
                });
              }}
              activeOpacity={0.88}
              className="flex-row items-center justify-between py-4 border-b border-borderAlpha last:border-b-0"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-surfaceHover items-center justify-center rounded-xl mr-3">
                  <AppText variant="body" weight="bold" color="primary">
                    {h.token.symbol.substring(0, 2)}
                  </AppText>
                </View>
                <View>
                  <AppText variant="body" weight="bold">
                    {h.token.name}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {h.amount.toLocaleString()} {h.token.symbol}
                  </AppText>
                </View>
              </View>
              <View className="items-end">
                <AppText variant="body" weight="bold">
                  ${h.balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </AppText>
                <AppText variant="caption" color={h.change24h >= 0 ? 'gains' : 'losses'} weight="semibold">
                  {h.change24h >= 0 ? '+' : ''}{h.change24h}%
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* AI Insight Box */}
        {insights.length > 0 && (
          <View className="mb-space-3xl">
            <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs uppercase tracking-wider">
              AI Insight Analyst
            </AppText>
            <Card glow="purple" className="p-space-lg">
              <View className="flex-row items-center mb-2">
                <FontAwesome6 name="wand-magic-sparkles" size={16} color={colors.accent} iconStyle="solid" className="mr-2" />
                <AppText variant="body" weight="bold" className="text-white">
                  {insights[0].title}
                </AppText>
              </View>
              <AppText variant="caption" color="secondary">
                {insights[0].description}
              </AppText>
            </Card>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

export default PortfolioScreen;
