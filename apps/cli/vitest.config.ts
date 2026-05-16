import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@smmachine/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@smmachine/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['./**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/__tests__/**', '**/*.test.ts', '**/*.d.ts'],
    },
    testTimeout: 20000,
  },
});
