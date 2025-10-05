import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.config.ts'
      ],
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
