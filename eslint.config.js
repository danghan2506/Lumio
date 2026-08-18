// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.worktrees/**', '**/.venv/**', '__tests__/**', '__mocks__/**'],
  },
  expoConfig,
  {
    rules: {
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^expo-', '^@expo/'],
        },
      ],
    },
  },
]);
