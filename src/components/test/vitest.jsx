import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
const __dirname = '.';
const __dirname = '.';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './components/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'components/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
      '@/components': path.resolve(__dirname, '../'),
      '@/api': path.resolve(__dirname, '../../api'),
      '@/utils': path.resolve(__dirname, '../../utils')
    }
  }
});