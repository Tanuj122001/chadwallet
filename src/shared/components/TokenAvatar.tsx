import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export interface TokenAvatarProps {
  symbol: string;
  size?: number;
  className?: string;
}

const getTokenLogoBg = (symbol: string): string => {
  switch (symbol.toUpperCase()) {
    case 'BTC': return 'bg-amber-500';
    case 'ETH': return 'bg-indigo-500';
    case 'SOL': return 'bg-purple-600';
    case 'CHAD': return 'bg-[#22F27C]'; // primary green
    case 'BONK': return 'bg-orange-500';
    case 'WIF': return 'bg-amber-800';
    case 'POPCAT': return 'bg-zinc-600';
    case 'MEW': return 'bg-pink-500';
    case 'BRETT': return 'bg-blue-600';
    case 'DOG': return 'bg-amber-700';
    case 'GIGA': return 'bg-red-800';
    case 'TRUMP': return 'bg-red-600';
    default: return 'bg-slate-700';
  }
};

export const TokenAvatar: React.FC<TokenAvatarProps> = ({
  symbol,
  size = 52,
  className = '',
}) => {
  const bgClass = getTokenLogoBg(symbol);
  return (
    <View 
      className={`rounded-full items-center justify-center ${bgClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <AppText weight="bold" className="text-black text-lg font-mono">
        {symbol[0]?.toUpperCase()}
      </AppText>
    </View>
  );
};

export default TokenAvatar;
