import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { privateGate } from './server/vitePlugin';

export default defineConfig(({ mode }) => {
  // Server-only secrets (no VITE_ prefix): never exposed to the browser bundle.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    plugins: [react(), privateGate(env)],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
        },
      },
    },
    test: { environment: 'node', include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
  };
});
