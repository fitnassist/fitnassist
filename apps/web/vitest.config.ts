import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/generated/**',
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/test/**',
        'src/config/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**',
        'src/lib/trpc.ts',
        'src/lib/auth-client.ts',
        'src/lib/queryClient.ts',
        'src/providers/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
