import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  dts: true,
  noExternal: ['@smmachine/core', '@smmachine/utils'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
