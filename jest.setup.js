// Jest setup file for ChadWallet testing in Node environment
global.__DEV__ = true;
global.__fbBatchedBridgeConfig = { remoteModuleConfig: [] };

// Mock Platform as virtual and physical module to avoid native OS check errors under Node test environment

// Mock react-native package components and utilities completely
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => styles,
    hairlineWidth: 1,
  },
  Platform: {
    OS: 'android',
    select: (objs) => objs.android || objs.default,
    Version: 30,
  },
  Appearance: {
    getColorScheme: jest.fn(() => 'dark'),
    setColorScheme: jest.fn(),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  UIManager: {},
  NativeModules: {},
  TurboModuleRegistry: {
    getEnforcing: () => ({}),
    get: () => null,
  },
  InteractionManager: {
    runAfterInteractions: (cb) => cb(),
  },
  DeviceEventEmitter: {
    addListener: () => ({ remove: jest.fn() }),
    emit: jest.fn(),
  },
}));

// Mock TurboModuleRegistry to prevent native Spec lookup errors
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: () => ({}),
  get: () => null,
}));

// Mock axios globally to prevent background network side-effects during tests
jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
  },
  View: 'View',
  Text: 'Text',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

// Mock @react-native-clipboard/clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
  hasString: jest.fn(() => Promise.resolve(false)),
}));

// Mock @react-navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: 'NavigationContainer',
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  }),
}));

// Mock Vector Icons
jest.mock('@react-native-vector-icons/fontawesome6', () => 'Icon');

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: 'ScreenContainer',
  Screen: 'Screen',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Rect: 'Rect',
  Circle: 'Circle',
  G: 'G',
}));

// Mock service locator to prevent loading concrete network / storage data sources
jest.mock('./src/services/index', () => {
  const mockSolanaRepository = {
    getNativeBalance: jest.fn(() => Promise.resolve(0)),
    getTokenHoldings: jest.fn(() => Promise.resolve([])),
    getTransactionHistory: jest.fn(() => Promise.resolve([])),
    getTransactionDetails: jest.fn(),
  };

  const mockMarketRepository = {
    getPrices: jest.fn(() => Promise.resolve({})),
    getMarketStats: jest.fn(),
    getPriceHistory: jest.fn(),
    getTrendingTokens: jest.fn(),
  };

  const mockPortfolioAnalyticsRepository = {
    getPortfolioAnalytics: jest.fn(),
    getHistoricalSnapshots: jest.fn(),
    addSnapshot: jest.fn(),
    clearPortfolioCache: jest.fn(),
  };

  const { EventRepository } = require('./src/services/repositories/EventRepository');
  const mockEventRepositoryInstance = new EventRepository();

  const mockServiceLocator = {
    getSolanaRepository: () => mockSolanaRepository,
    getMarketRepository: () => mockMarketRepository,
    getPortfolioAnalyticsRepository: () => mockPortfolioAnalyticsRepository,
    getEventRepository: () => mockEventRepositoryInstance,
    getAuthRepository: () => ({}),
    getWalletRepository: () => ({}),
    getPortfolioRepository: () => ({}),
    getSettingsRepository: () => ({}),
    getQuoteRepository: () => ({}),
    getSwapRepository: () => ({}),
    getTransactionRepository: () => ({}),
    getExecutionRepository: () => ({}),
    getSimulationRepository: () => ({}),
  };

  return {
    serviceLocator: mockServiceLocator,
    __esModule: true,
    default: mockServiceLocator,
  };
});

// Mock useAuthStore to prevent async session restore operations in tests
jest.mock('./src/features/auth/authStore', () => {
  const mockStore = {
    user: null,
    session: null,
    status: 'idle',
    errorMessage: null,
    signUpWithEmail: jest.fn(),
    signInWithEmail: jest.fn(),
    forgotPassword: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithPhone: jest.fn(),
    confirmPhoneOTP: jest.fn(),
    restoreSession: jest.fn(() => Promise.resolve()),
    refreshSession: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
  };
  const useAuthStoreMock = (selector) => {
    if (selector) return selector(mockStore);
    return mockStore;
  };
  useAuthStoreMock.getState = () => mockStore;
  return {
    useAuthStore: useAuthStoreMock,
    default: useAuthStoreMock,
  };
});

// Mock useWalletStore to prevent async chain fetch calls in tests
jest.mock('./src/features/wallet/walletStore', () => {
  const mockWalletStore = {
    activeWallet: null,
    wallets: [],
    loadingState: 'idle',
    isLocked: false,
    failedAttempts: 0,
    lockTimeRemaining: 0,
    solBalance: 0,
    tokenList: [],
    recentTransactions: [],
    syncState: 'idle',
    rpcStatus: 'healthy',
    createWallet: jest.fn(),
    importWallet: jest.fn(),
    importPrivateKey: jest.fn(),
    setActiveWallet: jest.fn(),
    fetchWallets: jest.fn(() => Promise.resolve()),
    signTransaction: jest.fn(),
    backupConfirmation: jest.fn(),
    exportSecrets: jest.fn(),
    unlockWallet: jest.fn(),
    lockWallet: jest.fn(),
    updateLockStatus: jest.fn(),
    fetchSolanaData: jest.fn(() => Promise.resolve()),
    switchCluster: jest.fn(),
  };
  const useWalletStoreMock = (selector) => {
    if (selector) return selector(mockWalletStore);
    return mockWalletStore;
  };
  useWalletStoreMock.getState = () => mockWalletStore;
  return {
    useWalletStore: useWalletStoreMock,
    default: useWalletStoreMock,
  };
});
