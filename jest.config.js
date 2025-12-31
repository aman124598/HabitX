module.exports = {
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts'
  ],
  setupFiles: [
    '<rootDir>/__tests__/mocks/global.js'
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    'node_modules',
    '__tests__/mocks/',
    '__tests__/utils/',
    '__tests__/setup.ts',
    '__mocks__/'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!babel.config.js',
    '!jest.config.js',
    '!metro.config.js',
    '!**/android/**',
    '!**/ios/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|react-native-vector-icons|react-native-svg|@react-navigation)/)',
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__tests__/mocks/react-native.js',
    '^react-native-reanimated$': '<rootDir>/__tests__/mocks/react-native-reanimated.js',
    '^react-native-vector-icons/(.*)$': '<rootDir>/__tests__/mocks/react-native-vector-icons.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/mocks/async-storage.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js',
    // Component mocks - match exact import paths
    '\\.\\./Themed$': '<rootDir>/__mocks__/components/Themed.js',
    '\\.\\.\\./\\.\\.\\./lib/themeContext$': '<rootDir>/__mocks__/lib/themeContext.js',
    '\\.\\.\\./\\.\\.\\./lib/theme$': '<rootDir>/__mocks__/lib/theme.js',
    '\\.\\.\\./\\.\\.\\./lib/habitUtils$': '<rootDir>/__mocks__/lib/habitUtils.js',
    '\\.\\.\\./\\.\\.\\./lib/habitsApi$': '<rootDir>/__mocks__/lib/habitsApi.js',
    // More general patterns
    '\\.\\.\\./lib/(.*)$': '<rootDir>/__mocks__/lib/$1.js',
    '\\.\\.\\./components/(.*)$': '<rootDir>/__mocks__/components/$1.js',
    '\\.\\.\\./\\.\\.\\./lib/(.*)$': '<rootDir>/__mocks__/lib/$1.js',
    '\\.\\.\\./\\.\\.\\./components/(.*)$': '<rootDir>/__mocks__/components/$1.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__tests__/mocks/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};