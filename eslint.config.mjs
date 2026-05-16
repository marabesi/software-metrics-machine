import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const baseRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'prettier/prettier': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  ...prettierConfig.rules,
};

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
  {
    files: ['**/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier,
    },
    rules: {
      ...baseRules,
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier,
    },
    rules: {
      ...baseRules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
