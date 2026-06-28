import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',
  },
  format: ['cjs'],
  target: 'node20',
  platform: 'node',
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
