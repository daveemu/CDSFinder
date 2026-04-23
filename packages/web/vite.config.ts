import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cdsfinder/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env['VITE_API_BASE_URL'] ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
