import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173, 
    proxy: {
      '/api': {
        target: 'https://backend-pdis.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
  },
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow-models/face-landmarks-detection'
    ]
  },
  base: "/", // ✅ Ensures routing works correctly in production

  // ✅ Fixes React Router history issues
  resolve: {
    alias: {
      'react-router-dom': require.resolve('react-router-dom'),
    },
  },

  // ✅ Enables proper history fallback for React Router
  server: {
    host: true,
    port: 5173,
    historyApiFallback: true,  // ✅ Force Vite to handle frontend routing
  },
});
