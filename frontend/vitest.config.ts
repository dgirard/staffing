import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.tsx',
        '**/*.spec.tsx',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    include: ['tests/**/*.test.tsx', 'tests/**/*.spec.tsx']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
