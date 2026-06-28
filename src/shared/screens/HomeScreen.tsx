import React, { useState, useMemo } from 'react';
import { View, FlatList, Alert } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { MainTabScreenProps } from '../../core/navigation/navigationTypes';
import {
  ScreenContainer,
  WalletHeader,
  SearchBar,
  FilterChip,
  TokenCard,
  TokenData,
  FloatingActionButton,
} from '../components';

const filterChips = [
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
];

const MOCK_TOKENS: TokenData[] = [
  {
    id: 'bonk',
    name: 'Bonk',
    symbol: 'BONK',
    price: 0.000024,
    change24h: 12.8,
    marketCap: '1.6B',
    volume24h: '185M',
    liquidity: '45.2M',
    sparkline: [20, 22, 21, 23, 22, 24],
    category: 'trending',
  },
  {
    id: 'wif',
    name: 'Dogwifhat',
    symbol: 'WIF',
    price: 2.15,
    change24h: -5.4,
    marketCap: '2.1B',
    volume24h: '320M',
    liquidity: '84.6M',
    sparkline: [2.3, 2.25, 2.2, 2.18, 2.15],
    category: 'trending',
  },
  {
    id: 'popcat',
    name: 'Popcat',
    symbol: 'POPCAT',
    price: 0.68,
    change24h: 18.5,
    marketCap: '680M',
    volume24h: '95M',
    liquidity: '22.8M',
    sparkline: [0.55, 0.58, 0.6, 0.62, 0.65, 0.68],
    category: 'trending',
  },
  {
    id: 'mew',
    name: 'Cat in a dogs world',
    symbol: 'MEW',
    price: 0.0054,
    change24h: 8.2,
    marketCap: '480M',
    volume24h: '65M',
    liquidity: '14.5M',
    sparkline: [0.005, 0.0051, 0.0052, 0.0054],
    category: 'trending',
  },
  {
    id: 'peng',
    name: 'Peng',
    symbol: 'PENG',
    price: 0.28,
    change24h: -2.1,
    marketCap: '28M',
    volume24h: '4.8M',
    liquidity: '1.2M',
    sparkline: [0.29, 0.285, 0.282, 0.28],
    category: 'trending',
  },
  {
    id: 'brett',
    name: 'Brett',
    symbol: 'BRETT',
    price: 0.085,
    change24h: 14.2,
    marketCap: '850M',
    volume24h: '112M',
    liquidity: '36.4M',
    sparkline: [0.075, 0.078, 0.08, 0.082, 0.085],
    category: 'trending',
  },
  {
    id: 'dog',
    name: 'Dog go to the moon',
    symbol: 'DOG',
    price: 0.0042,
    change24h: -8.7,
    marketCap: '420M',
    volume24h: '38M',
    liquidity: '11.8M',
    sparkline: [0.0046, 0.0044, 0.0043, 0.0042],
    category: 'trending',
  },
  {
    id: 'giga',
    name: 'GigaChad',
    symbol: 'GIGA',
    price: 0.018,
    change24h: 24.5,
    marketCap: '180M',
    volume24h: '28M',
    liquidity: '8.4M',
    sparkline: [0.014, 0.015, 0.016, 0.017, 0.018],
    category: 'trending',
  },
  {
    id: 'trump',
    name: 'Official Trump',
    symbol: 'TRUMP',
    price: 6.45,
    change24h: -11.2,
    marketCap: '298M',
    volume24h: '48M',
    liquidity: '16.5M',
    sparkline: [7.2, 7.0, 6.8, 6.6, 6.45],
    category: 'trending',
  },
  {
    id: 'pump',
    name: 'Pump Fun',
    symbol: 'PUMP',
    price: 0.00012,
    change24h: 35.6,
    marketCap: '12M',
    volume24h: '5.2M',
    liquidity: '1.8M',
    sparkline: [0.00009, 0.0001, 0.00011, 0.00012],
    category: 'trending',
  },
];

export const HomeScreen: React.FC<MainTabScreenProps<'Home'>> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('trending');

  const AlertNotification = () => {
    Alert.alert(
      'Alerts & Notifications',
      'You are all caught up!\n\nNo new price alerts triggered for your watchlist.',
      [{ text: 'Dismiss' }]
    );
  };

  const handleProfilePress = () => {
    Alert.alert(
      'Profile Actions',
      'Profile settings and preferences simulated here.',
      [{ text: 'Close' }]
    );
  };

  const handleWalletActions = () => {
    Alert.alert(
      'Wallet Options',
      'Quick wallet metrics and options connection simulated.',
      [{ text: 'Dismiss' }]
    );
  };

  const filteredTokens = useMemo(() => {
    return MOCK_TOKENS.filter(token => {
      const matchesSearch = 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const handleWatchlistPress = React.useCallback((symbol: string) => {
    Alert.alert(
      'Watchlist Actions',
      `Toggled watchlist state for ${symbol}.`,
      [{ text: 'OK' }]
    );
  }, []);

  const renderHeader = () => (
    <View className="pt-2 mb-4 px-5">
      {/* Wallet Header */}
      <WalletHeader 
        userName="ChadWallet"
        onNotificationPress={AlertNotification} 
        onProfilePress={handleProfilePress}
        className="px-0"
      />

      {/* Spacing from header to search is 20dp */}
      <View className="mt-5">
        <SearchBar 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          placeholder="Search tokens" 
        />
      </View>

      {/* Spacing from search to chips is 16dp */}
      <View className="mt-4 flex-row gap-x-2">
        {filterChips.map(chip => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            selected={selectedFilter === chip.id}
            onPress={() => setSelectedFilter(chip.id)}
          />
        ))}
      </View>
    </View>
  );

  const renderTokenItem = React.useCallback(({ item }: { item: TokenData }) => (
    <View className="px-5">
      <TokenCard
        item={item}
        onPress={() => {
          navigation.navigate('TokenDetails', { 
            tokenId: item.symbol,
            symbol: item.symbol,
            name: item.name,
            price: item.price
          } as any);
        }}
        onWatchlistPress={() => handleWatchlistPress(item.symbol)}
      />
    </View>
  ), [navigation, handleWatchlistPress]);

  return (
    <ScreenContainer scrollable={false} padding={false}>
      {/* Subtle radial light gradient behind header */}
      <View className="absolute top-0 left-0 right-0 h-[150px] overflow-hidden" pointerEvents="none">
        <Svg width="100%" height={150} viewBox="0 0 375 150">
          <Defs>
            <RadialGradient id="radial-glow" cx="50%" cy="0%" r="60%">
              <Stop offset="0%" stopColor="#22F27C" stopOpacity={0.15} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height={150} fill="url(#radial-glow)" />
        </Svg>
      </View>

      <FlatList
        data={filteredTokens}
        renderItem={renderTokenItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={null}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleWalletActions} />
    </ScreenContainer>
  );
};

export default HomeScreen;
