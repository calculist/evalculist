import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/handlers/index.ts'],
      thresholds: {
        lines: 90,
        branches: 80,
        functions: 70,
        statements: 90,
      },
    },
  },
});
