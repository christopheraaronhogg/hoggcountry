import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@trailhogg/shared': path.resolve(__dirname, './shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/client/src/scenes/**', // Phaser scenes are hard to unit test
      ],
    },
  },
});
