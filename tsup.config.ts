import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['apps/cli/src/index.ts'],
  format: ['cjs'],
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  dts: false,
  noExternal: ['@smmachine/core', '@smmachine/utils'],
  outExtension() {
    return {
      js: '.cjs',
    };
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
  onSuccess:
    'mkdir -p dist && rm -rf dist/rest dist/webapp && cp -R apps/rest/dist dist/rest && cp -R apps/webapp/.next dist/webapp',
});
