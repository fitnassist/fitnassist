import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/generated/**',
        'src/**/*.types.ts',
        'src/test/**',
        'src/config/**',
        'src/server.ts',
        'src/app.ts',
        'src/lib/prisma.ts',
        'src/lib/auth.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
});
