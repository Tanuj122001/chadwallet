import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { Card } from './Card';
import { AppText } from './AppText';
import { TokenAvatar } from './TokenAvatar';
import { MiniChart } from './MiniChart';

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: string;
  volume24h: string;
  liquidity: string;
  sparkline: number[];
  category: 'trending' | 'new' | 'gainer' | 'loser';
}

export interface TokenCardProps {
  item: TokenData;
  onPress: () => void;
  onWatchlistPress?: () => void;
  className?: string;
}

export const TokenCard: React.FC<TokenCardProps> = React.memo(({
  item,
  onPress,
  onWatchlistPress = () => { },
  className = '',
}) => {
  const isPositive = item.change24h >= 0;
  const changeColor = isPositive ? '#22F27C' : '#FF5C5C';

  return (
    <Card
      onPress={onPress}
      className={`bg-[#16171F] border border-[#2A2D39] rounded-[20px] p-[18px] mb-4 relative ${className}`}
    >
      {/* Top Row: Info + Price + Sparkline */}
      <View className="flex-row items-center justify-between">

        {/* Left Side: Avatar + Text */}
        <View className="flex-row items-center flex-1 pr-2">
          <TokenAvatar symbol={item.symbol} size={52} />
          <View className="ml-3 flex-1">
            <AppText className="text-white text-[18px] font-bold" numberOfLines={1}>
              {item.name}
            </AppText>
            <AppText className="text-[#8D94A7] text-[13px] font-medium mt-0.5">
              {item.symbol}
            </AppText>
          </View>
        </View>

        {/* Center: Price & Change */}
        <View className="items-end mr-4">
          <AppText className="text-white text-[16px] font-bold">
            ${item.price >= 1 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(6)}
          </AppText>
          <AppText className="text-[13px] font-bold mt-0.5" style={{ color: changeColor }}>
            {isPositive ? '+' : ''}{item.change24h}%
          </AppText>
        </View>

        {/* Right Side: Mini Chart */}
        <View className="w-[88px] h-[42px] items-center justify-center pr-4">
          <MiniChart data={item.sparkline} color={changeColor} />
        </View>
      </View>

      {/* Bottom Row: Market Cap, Volume, Liquidity */}
      <View className="flex-row justify-between mt-4 pt-3 border-t border-[#2A2D39]/30">
        <View className="flex-1">
          <AppText className="text-[#5D6473] text-[11px] font-medium">Mkt Cap</AppText>
          <AppText className="text-white text-[13px] font-semibold mt-0.5">${item.marketCap}</AppText>
        </View>
        <View className="flex-1 items-center">
          <AppText className="text-[#5D6473] text-[11px] font-medium">Vol 24h</AppText>
          <AppText className="text-white text-[13px] font-semibold mt-0.5">${item.volume24h}</AppText>
        </View>
        <View className="flex-1 items-end">
          <AppText className="text-[#5D6473] text-[11px] font-medium">Liquidity</AppText>
          <AppText className="text-white text-[13px] font-semibold mt-0.5">${item.liquidity}</AppText>
        </View>
      </View>

      {/* Top Right Corner Watchlist Star */}
      <TouchableOpacity
        className="absolute top-[18px] right-[18px]"
        onPress={onWatchlistPress}
        activeOpacity={0.7}
      >
        <FontAwesome6
          name="star"
          size={16}
          color="#8D94A7"
          iconStyle="regular"
        />
      </TouchableOpacity>
    </Card>
  );
});

export default TokenCard;
