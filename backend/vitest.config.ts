import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'prisma/',
      ],
    },
    // Separate pools to avoid mock interference
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
