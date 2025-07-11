import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BackChannel',
      fileName: 'backchannel',
      formats: ['umd']
    },
    sourcemap: true,
    outDir: 'dist'
  }
});