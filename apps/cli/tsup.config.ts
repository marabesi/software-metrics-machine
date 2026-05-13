import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  dts: true,
  noExternal: ['@smmachine/core', '@smmachine/utils'],
  outExtension() {
    return {
      js: '.cjs',
    };
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
});
