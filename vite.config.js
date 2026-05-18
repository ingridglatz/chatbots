import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendDownPaths = new Map();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            if (err.code !== 'ECONNREFUSED' && err.code !== 'ECONNRESET') {
              console.error(`[proxy] ${req.url}:`, err.message);
              return;
            }
            const now = Date.now();
            const last = backendDownPaths.get(req.url) || 0;
            if (now - last > 30000) {
              backendDownPaths.set(req.url, now);
              console.warn(`[proxy] backend offline — ${req.url} (silenciando 30s)`);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
