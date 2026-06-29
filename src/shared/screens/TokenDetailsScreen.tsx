import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Share, Clipboard } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { MainStackScreenProps } from '../../core/navigation/navigationTypes';
import { ScreenContainer } from '../components/ScreenContainer';
import { TokenAvatar } from '../components/TokenAvatar';
import { AppText } from '../components/AppText';
import { colors } from '../theme/colors';
import { AiCopilotModal, toast, ToastManager } from '../components';

// Detailed Token structure with extended time filters support
interface DetailedTokenInfo {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: string;
  volume24h: string;
  liquidity: string;
  holders: string;
  high: string;
  low: string;
  chartData: {
    '1H': number[];
    '4H': number[];
    '1D': number[];
    '1W': number[];
    '1M': number[];
    '1Y': number[];
    'ALL': number[];
  };
}

// Comprehensive mock database
const TOKEN_DETAILS_MOCK: Record<string, DetailedTokenInfo> = {
  SOL: {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    price: 148.62,
    change24h: 5.84,
    marketCap: '68.9B',
    volume24h: '2.4B',
    liquidity: '345.8M',
    holders: '945,210',
    high: '152.40',
    low: '141.20',
    chartData: {
      '1H': [147.2, 147.8, 148.1, 147.9, 148.4, 148.62],
      '4H': [145.0, 146.5, 145.8, 147.2, 148.1, 148.62],
      '1D': [140.0, 142.5, 141.2, 145.0, 143.8, 147.2, 148.62],
      '1W': [135.0, 137.5, 139.2, 136.4, 141.0, 145.8, 148.62],
      '1M': [125.0, 128.5, 133.0, 131.5, 138.0, 142.5, 148.62],
      '1Y': [85.0, 98.0, 110.0, 105.0, 128.0, 142.0, 148.62],
      'ALL': [20.0, 45.0, 80.0, 65.0, 120.0, 135.0, 148.62],
    },
  },
  BTC: {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 64250.0,
    change24h: 1.15,
    marketCap: '1.26T',
    volume24h: '28.1B',
    liquidity: '1.4B',
    holders: '48,150,422',
    high: '65,100',
    low: '63,500',
    chartData: {
      '1H': [64150, 64210, 64180, 64240, 64220, 64250],
      '4H': [63950, 64120, 64050, 64180, 64220, 64250],
      '1D': [63800, 64100, 63900, 64300, 64150, 64200, 64250],
      '1W': [62100, 62800, 63500, 63100, 63900, 64100, 64250],
      '1M': [59500, 60800, 61200, 62100, 63400, 63800, 64250],
      '1Y': [42000, 48000, 52000, 50500, 58000, 62000, 64250],
      'ALL': [15000, 28000, 45000, 38000, 59000, 61000, 64250],
    },
  },
  ETH: {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3480.25,
    change24h: -0.76,
    marketCap: '418.5B',
    volume24h: '14.8B',
    liquidity: '850.4M',
    holders: '24,840,119',
    high: '3,540',
    low: '3,420',
    chartData: {
      '1H': [3490.5, 3485.2, 3482.0, 3488.4, 3481.1, 3480.25],
      '4H': [3510.0, 3495.0, 3498.0, 3485.0, 3482.0, 3480.25],
      '1D': [3520.0, 3500.0, 3510.0, 3470.0, 3490.0, 3460.0, 3480.25],
      '1W': [3580.0, 3540.0, 3510.0, 3490.0, 3520.0, 3450.0, 3480.25],
      '1M': [3680.0, 3620.0, 3590.0, 3520.0, 3550.0, 3440.0, 3480.25],
      '1Y': [2200.0, 2600.0, 2900.0, 2800.0, 3200.0, 3350.0, 3480.25],
      'ALL': [900.0, 1600.0, 2400.0, 1950.0, 3100.0, 3250.0, 3480.25],
    },
  },
  CHAD: {
    id: 'chad',
    name: 'GigaChad Token',
    symbol: 'CHAD',
    price: 0.0248,
    change24h: 22.45,
    marketCap: '24M',
    volume24h: '4.8M',
    liquidity: '3.2M',
    holders: '18,432',
    high: '0.0262',
    low: '0.0195',
    chartData: {
      '1H': [0.0241, 0.0243, 0.0242, 0.0245, 0.0246, 0.0248],
      '4H': [0.0235, 0.0240, 0.0238, 0.0242, 0.0245, 0.0248],
      '1D': [0.0180, 0.0200, 0.0190, 0.0220, 0.0230, 0.0248],
      '1W': [0.0120, 0.0150, 0.0170, 0.0210, 0.0200, 0.0248],
      '1M': [0.0050, 0.0090, 0.0120, 0.0180, 0.0220, 0.0248],
      '1Y': [0.0012, 0.0028, 0.0055, 0.0080, 0.0140, 0.0195, 0.0248],
      'ALL': [0.0002, 0.0008, 0.0022, 0.0045, 0.0110, 0.0165, 0.0248],
    },
  },
};

// Mapped helper details lookup with dynamic fallback
const getTokenDetails = (symbol: string): DetailedTokenInfo => {
  const upperSymbol = symbol.toUpperCase();
  if (TOKEN_DETAILS_MOCK[upperSymbol]) {
    return TOKEN_DETAILS_MOCK[upperSymbol];
  }

  // Dynamic fallback mapping for other list items
  const name =
    upperSymbol === 'BONK' ? 'Bonk' :
      upperSymbol === 'WIF' ? 'Dogwifhat' :
        upperSymbol === 'POPCAT' ? 'Popcat' :
          upperSymbol === 'MEW' ? 'Cat in a dogs world' :
            upperSymbol === 'PENG' ? 'Peng' :
              upperSymbol === 'BRETT' ? 'Brett' :
                upperSymbol === 'DOG' ? 'Dog go to the moon' :
                  upperSymbol === 'GIGA' ? 'GigaChad' :
                    upperSymbol === 'TRUMP' ? 'Official Trump' :
                      upperSymbol === 'PUMP' ? 'Pump Fun' :
                        upperSymbol;

  const isPositive = upperSymbol !== 'WIF' && upperSymbol !== 'DOG' && upperSymbol !== 'TRUMP';
  const change24h = isPositive ? 12.8 : -5.4;
  const price =
    upperSymbol === 'BONK' ? 0.000024 :
      upperSymbol === 'WIF' ? 2.15 :
        upperSymbol === 'POPCAT' ? 0.68 :
          upperSymbol === 'MEW' ? 0.0054 :
            upperSymbol === 'PENG' ? 0.28 :
              upperSymbol === 'BRETT' ? 0.085 :
                upperSymbol === 'DOG' ? 0.0042 :
                  upperSymbol === 'GIGA' ? 0.018 :
                    upperSymbol === 'TRUMP' ? 6.45 :
                      upperSymbol === 'PUMP' ? 0.00012 :
                        1.00;

  const priceMultiplier = price;

  return {
    id: upperSymbol.toLowerCase(),
    name,
    symbol: upperSymbol,
    price,
    change24h,
    marketCap: upperSymbol === 'BONK' ? '1.6B' : upperSymbol === 'WIF' ? '2.1B' : '680M',
    volume24h: upperSymbol === 'BONK' ? '185M' : upperSymbol === 'WIF' ? '320M' : '95M',
    liquidity: upperSymbol === 'BONK' ? '45.2M' : upperSymbol === 'WIF' ? '84.6M' : '22.8M',
    holders: '45,210',
    high: (price * 1.08).toFixed(price < 0.01 ? 6 : 2),
    low: (price * 0.92).toFixed(price < 0.01 ? 6 : 2),
    chartData: {
      '1H': [priceMultiplier * 0.98, priceMultiplier * 0.99, priceMultiplier * 0.985, priceMultiplier * 1.01, priceMultiplier * 1.005, priceMultiplier],
      '4H': [priceMultiplier * 0.96, priceMultiplier * 0.97, priceMultiplier * 0.965, priceMultiplier * 0.99, priceMultiplier * 1.005, priceMultiplier],
      '1D': [priceMultiplier * 0.92, priceMultiplier * 0.95, priceMultiplier * 0.94, priceMultiplier * 0.98, priceMultiplier * 0.97, priceMultiplier * 1.01, priceMultiplier],
      '1W': [priceMultiplier * 0.85, priceMultiplier * 0.89, priceMultiplier * 0.92, priceMultiplier * 0.88, priceMultiplier * 0.95, priceMultiplier * 0.98, priceMultiplier],
      '1M': [priceMultiplier * 0.70, priceMultiplier * 0.80, priceMultiplier * 0.85, priceMultiplier * 0.82, priceMultiplier * 0.90, priceMultiplier * 0.95, priceMultiplier],
      '1Y': [priceMultiplier * 0.40, priceMultiplier * 0.60, priceMultiplier * 0.75, priceMultiplier * 0.70, priceMultiplier * 0.85, priceMultiplier * 0.90, priceMultiplier],
      'ALL': [priceMultiplier * 0.10, priceMultiplier * 0.30, priceMultiplier * 0.60, priceMultiplier * 0.50, priceMultiplier * 0.80, priceMultiplier * 0.90, priceMultiplier],
    },
  };
};

export const TokenDetailsScreen: React.FC<MainStackScreenProps<'TokenDetails'>> = ({ route, navigation }) => {
  const tokenId = route.params?.tokenId || 'SOL';
  const tokenInfo = useMemo(() => getTokenDetails(tokenId), [tokenId]);

  const [selectedFilter, setSelectedFilter] = useState<'1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);

  const isPositive = tokenInfo.change24h >= 0;
  const performanceColor = isPositive ? '#22F27C' : '#FF5C5C';

  // Smooth SVG path curve generator
  const activeChartData = useMemo(() => {
    return tokenInfo.chartData[selectedFilter] || tokenInfo.chartData['1D'];
  }, [tokenInfo, selectedFilter]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${tokenInfo.name} (${tokenInfo.symbol}) current price index on ChadWallet: $${tokenInfo.price}`,
      });
    } catch (error) {
      console.warn('Share trigger failed', error);
    }
  };

  const chartSVG = useMemo(() => {
    if (activeChartData.length < 2) return null;
    const width = 320;
    const height = 180;
    const padding = 10;
    const chartHeight = height - padding * 2;

    const min = Math.min(...activeChartData);
    const max = Math.max(...activeChartData);
    const range = max - min === 0 ? 1 : max - min;

    const points = activeChartData.map((val, index) => {
      const x = (index / (activeChartData.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * chartHeight;
      return { x, y };
    });

    let pathData = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;
      pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }

    const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

    return (
      <Svg width="100%" height={220} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="gradientDetails" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={performanceColor} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={performanceColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Gradient Fill area under curve */}
        <Path d={areaData} fill="url(#gradientDetails)" />

        {/* Smooth Cubic stroke line */}
        <Path
          d={pathData}
          fill="none"
          stroke={performanceColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highlighting the latest value dot */}
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={5}
          fill={performanceColor}
        />
      </Svg>
    );
  }, [activeChartData, performanceColor]);

  return (
    <ScreenContainer scrollable={true} padding={false}>
      {/* 1. Large Token Header */}
      <View
        className="flex-row items-center justify-between h-[72px] px-5 bg-transparent border-b border-borderAlpha"
        style={{ minHeight: 72 }}
      >
        <View className="flex-row items-center flex-1">
          {/* Back action button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-2 bg-surfaceHover rounded-xl items-center justify-center"
            activeOpacity={0.88}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <FontAwesome6
              name="chevron-left"
              size={18}
              color={colors.text}
              iconStyle="solid"
            />
          </TouchableOpacity>
          {/* Token Avatar in header */}
          <TokenAvatar symbol={tokenInfo.symbol} size={36} className="mr-3" />

          {/* Token metadata titles */}
          <View className="flex-1">
            <AppText className="text-white text-[18px] font-bold" numberOfLines={1}>
              {tokenInfo.name}
            </AppText>
            <AppText className="text-textSecondary text-[13px] font-medium mt-0.5">
              {tokenInfo.symbol}
            </AppText>
          </View>
        </View>

        {/* Right action toggles */}
        <View className="flex-row items-center gap-x-3">
          {/* Favourite watchlist star outline */}
          <TouchableOpacity
            activeOpacity={0.88}
            className="w-10 h-10 rounded-full bg-surface border border-borderAlpha items-center justify-center"
            onPress={() => {
              setIsWatchlisted(!isWatchlisted);
              toast.success(`${tokenInfo.symbol} watchlist state updated.`);
            }}
          >
            <FontAwesome6
              name="star"
              size={18}
              color={isWatchlisted ? colors.primary : colors.text}
              iconStyle={isWatchlisted ? 'solid' : 'regular'}
            />
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            activeOpacity={0.88}
            className="w-10 h-10 rounded-full bg-surface border border-borderAlpha items-center justify-center"
            onPress={handleShare}
          >
            <FontAwesome6
              name="share-nodes"
              size={18}
              color={colors.text}
              iconStyle="solid"
            />
          </TouchableOpacity>

          {/* AI Copilot magic trigger */}
          <TouchableOpacity
            activeOpacity={0.88}
            className="w-10 h-10 rounded-full bg-surface border border-borderAlpha items-center justify-center"
            onPress={() => setAiVisible(true)}
          >
            <FontAwesome6
              name="wand-magic-sparkles"
              size={18}
              color={colors.accent}
              iconStyle="solid"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 pt-4">
        {/* 2. Price and Change Metrics */}
        <View className="mb-4">
          <AppText className="text-white text-[40px] font-bold leading-[48px]">
            ${tokenInfo.price >= 1 ? tokenInfo.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : tokenInfo.price.toFixed(6)}
          </AppText>
          <View className="flex-row items-center mt-2">
            <View className={`px-2 py-0.5 rounded-md ${isPositive ? 'bg-gains/10 border border-gains/20' : 'bg-losses/10 border border-losses/20'}`}>
              <AppText className="text-[13px] font-bold" style={{ color: performanceColor }}>
                {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{tokenInfo.change24h}% Today
              </AppText>
            </View>
          </View>
        </View>

        {/* 3. Small Statistics Grid */}
        <View className="flex-row justify-between mb-5 mt-2 bg-surface border border-borderAlpha rounded-radius-2xl p-4">
          <View>
            <AppText className="text-textMuted text-[11px] font-medium">High</AppText>
            <AppText className="text-white text-[13px] font-semibold mt-0.5">${tokenInfo.high}</AppText>
          </View>
          <View>
            <AppText className="text-textMuted text-[11px] font-medium">Low</AppText>
            <AppText className="text-white text-[13px] font-semibold mt-0.5">${tokenInfo.low}</AppText>
          </View>
          <View>
            <AppText className="text-textMuted text-[11px] font-medium">Volume</AppText>
            <AppText className="text-white text-[13px] font-semibold mt-0.5">${tokenInfo.volume24h}</AppText>
          </View>
          <View>
            <AppText className="text-textMuted text-[11px] font-medium">Market Cap</AppText>
            <AppText className="text-white text-[13px] font-semibold mt-0.5">${tokenInfo.marketCap}</AppText>
          </View>
        </View>

        {/* 4. Large Interactive Chart Container */}
        <View className="bg-surface border border-borderAlpha rounded-radius-2xl p-4 h-[320px] justify-between mb-10">
          <View className="flex-1 justify-center">
            {chartSVG}
          </View>

          {/* Time Filter Chips */}
          <View className="flex-row justify-between mt-2 pt-2 border-t border-borderAlpha">
            {(['1H', '4H', '1D', '1W', '1M', '1Y', 'ALL'] as const).map(filter => {
              const isSelected = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  className={`items-center justify-center px-3 h-[34px] rounded-full ${isSelected ? 'bg-primary' : 'bg-surfaceHover border border-borderAlpha'
                    }`}
                  activeOpacity={0.88}
                >
                  <AppText
                    className="text-[12px] font-bold"
                    style={{ color: isSelected ? '#080A0C' : colors.text }}
                  >
                    {filter}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {/* 5. Trading cockpit actions panel */}
        <View className="mb-4 flex-row justify-between">
          <TouchableOpacity
            onPress={() => toast.success(`Initiated buy order for ${tokenInfo.symbol}`)}
            className="w-[30%] h-12 bg-primary rounded-radius-xl justify-center items-center shadow-md"
            activeOpacity={0.88}
          >
            <AppText variant="body" weight="bold" className="text-slate-900">Buy</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toast.success(`Initiated sell order for ${tokenInfo.symbol}`)}
            className="w-[30%] h-12 bg-losses rounded-radius-xl justify-center items-center shadow-md"
            activeOpacity={0.88}
          >
            <AppText variant="body" weight="bold" className="text-white">Sell</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toast.success(`Configuring Raydium / Jupiter swap route for ${tokenInfo.symbol}`)}
            className="w-[30%] h-12 bg-surfaceHover border border-borderAlpha rounded-radius-xl justify-center items-center"
            activeOpacity={0.88}
          >
            <AppText variant="body" weight="bold" color="primary">Swap</AppText>
          </TouchableOpacity>
        </View>

        {/* 6. secondary meta utilities */}
        <View className="mb-10 flex-row justify-between items-center bg-surface border border-borderAlpha rounded-radius-xl p-3">
          <TouchableOpacity
            onPress={() => toast.info(`Recipient address set for ${tokenInfo.symbol}`)}
            className="items-center w-[23%]"
            activeOpacity={0.88}
          >
            <FontAwesome6 name="paper-plane" size={16} color={colors.textSecondary} iconStyle="solid" />
            <AppText variant="caption" color="secondary" className="mt-1">Send</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toast.success(`${tokenInfo.symbol} deposit address copied!`)}
            className="items-center w-[23%]"
            activeOpacity={0.88}
          >
            <FontAwesome6 name="qrcode" size={16} color={colors.textSecondary} iconStyle="solid" />
            <AppText variant="caption" color="secondary" className="mt-1">Receive</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toast.info('Opening Solscan/SolanaFM transaction node...')}
            className="items-center w-[23%]"
            activeOpacity={0.88}
          >
            <FontAwesome6 name="compass" size={16} color={colors.textSecondary} iconStyle="solid" />
            <AppText variant="caption" color="secondary" className="mt-1">Explorer</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Clipboard.setString('So11111111111111111111111111111111111111112');
              toast.success('Contract mint address copied to clipboard!');
            }}
            className="items-center w-[23%]"
            activeOpacity={0.88}
          >
            <FontAwesome6 name="copy" size={16} color={colors.textSecondary} iconStyle="solid" />
            <AppText variant="caption" color="secondary" className="mt-1">Copy Mint</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <AiCopilotModal visible={aiVisible} onClose={() => setAiVisible(false)} />
      <ToastManager />
    </ScreenContainer>
  );
};

export default TokenDetailsScreen;
