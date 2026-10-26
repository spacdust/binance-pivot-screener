import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
            console.warn('[Vite API Proxy]', err.message);
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:5000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') return;
            console.warn('[Vite WS Proxy]', err.message);
          });
        },
      },
    },
  },
});
