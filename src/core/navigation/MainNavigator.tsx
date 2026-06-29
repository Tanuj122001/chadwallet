import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList, MainTabParamList } from './navigationTypes';
import { HomeScreen } from '../../shared/screens/HomeScreen';
import { PortfolioScreen } from '../../shared/screens/PortfolioScreen';
import { SettingsScreen } from '../../shared/screens/SettingsScreen';
import { TokenDetailsScreen } from '../../shared/screens/TokenDetailsScreen';
import { BottomTabBar } from '../../shared/components/BottomTabBar';
import { useUiStore } from '../../features/uiStore';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => {
        const activeRouteName = props.state.routeNames[props.state.index];
        return (
          <BottomTabBar 
            activeTab={activeRouteName}
            onTabPress={(tab: string) => {
              if (tab === 'Plus') {
                useUiStore.getState().setActionsSheetVisible(true);
              } else if (tab === 'Search') {
                useUiStore.getState().setSearchFocused(true);
              } else {
                props.navigation.navigate(tab);
              }
            }}
          />
        );
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};


export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#080A0C' },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="TokenDetails" component={TokenDetailsScreen} />
    </Stack.Navigator>
  );
};
