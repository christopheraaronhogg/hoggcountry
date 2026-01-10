import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/game/',
  resolve: {
    alias: {
      '@trailhogg/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/colyseus': {
        target: 'ws://localhost:2567',
        ws: true
      }
    }
  },
  build: {
    outDir: '../../../public/game',
    emptyOutDir: true,
    sourcemap: false
  }
});
