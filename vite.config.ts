/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'plugin') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'BackChannel',
          fileName: () => 'backchannel.js',
          formats: ['iife']
        },
        outDir: 'dist',
        sourcemap: true,
        minify: false,
        rollupOptions: {
          output: {
            inlineDynamicImports: true
          }
        }
      }
    };
  }

  return {
    root: '.',
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    test: {
      environment: 'jsdom',
    }
  };
});