module.exports = {
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated)/)',
  ],
  setupFiles: [
    './jest.setup.js',
  ],
};
