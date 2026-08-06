module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-typescript', '@babel/preset-react'],
        plugins: [
          '@babel/plugin-transform-flow-strip-types',
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    ],
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/src/jest/AsyncStorageMock.ts',
    '^@testing-library/react-native$': '<rootDir>/__mocks__/@testing-library/react-native.ts',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
  },
};
