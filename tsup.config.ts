import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'apps/cli/src/index.ts',
    },
    format: ['cjs'],
    target: 'node20',
    platform: 'node',
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
  },
  {
    entry: {
      main: 'apps/rest/dist/main.js',
    },
    format: ['cjs'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist/rest',
    sourcemap: true,
    clean: false,
    dts: false,
    bundle: true,
    noExternal: ['@smmachine/core', '@smmachine/utils'],
    external: [
      '@nestjs/microservices',
      '@nestjs/microservices/*',
      '@nestjs/websockets',
      '@nestjs/websockets/*',
      'class-transformer/storage',
    ],
    outExtension() {
      return {
        js: '.cjs',
      };
    },
  },
  {
    entry: {
      'webapp/server': 'apps/webapp/.next/standalone/apps/webapp/server.js',
    },
    format: ['cjs'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist',
    sourcemap: true,
    clean: false,
    dts: false,
    bundle: false,
    outExtension() {
      return {
        js: '.cjs',
      };
    },
  },
]);
