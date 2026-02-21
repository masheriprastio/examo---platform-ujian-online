import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load all env variables including VITE_ and NEXT_PUBLIC_
    // The third parameter '' means load everything regardless of prefix
    const env = loadEnv(mode, '.', '');

    return {
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Explicitly bake environment variables into process.env for robust fallback
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        'global': 'window.global',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'node-fetch': path.resolve(__dirname, './lib/fetch-polyfill.ts'),
          'cross-fetch': path.resolve(__dirname, './lib/fetch-polyfill.ts'),
          'isomorphic-fetch': path.resolve(__dirname, './lib/fetch-polyfill.ts'),
          '@protobufjs/fetch': path.resolve(__dirname, './lib/fetch-polyfill.ts'),
          'whatwg-fetch': path.resolve(__dirname, './lib/fetch-polyfill.ts'),
        }
      }
    };
});