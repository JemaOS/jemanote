import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      // NOTE: '@/tests' must be listed before '@', otherwise the generic '@'
      // alias swallows it and '@/tests/...' resolves to src/tests/... (missing).
      '@/tests': path.resolve(__dirname, './tests'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**/*'],
    pool: 'vmThreads',
    setupFiles: ['./tests/setup.ts', './tests/setup-codemirror.ts'],
  },
});
