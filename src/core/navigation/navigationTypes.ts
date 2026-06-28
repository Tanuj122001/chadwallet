import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Parameters for Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

// Parameters for Main Bottom Tabs
export type MainTabParamList = {
  Home: undefined;
  Portfolio: undefined;
  Settings: undefined;
};

// Parameters for Main Stack (contains Tab Navigator and Detail Screen)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TokenDetails: { tokenId: string } | undefined;
};

// Global Root Stack parameters
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Navigation props helpers for easy screen typings
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<MainStackParamList>
  >;

export type MainStackScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;
