import { defineConfig } from 'vitest/config';

export default defineConfig({
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
