/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  // RN test suites pay a large one-time module-transform warmup; the 5s
  // default made first tests in a suite flaky on cold caches.
  testTimeout: 15000,
  modulePathIgnorePatterns: ['<rootDir>/.worktrees'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/react-native.ts',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.ts',
    '^react-native-safe-area-context$':
      '<rootDir>/__mocks__/react-native-safe-area-context.ts',
  },
  roots: ['<rootDir>/__tests__'],
};