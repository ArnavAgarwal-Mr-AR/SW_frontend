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
  base: "/", // ✅ Ensures correct routing in production

  // ✅ Fix refresh issue when using React Router
  esbuild: {
    jsxInject: `import React from 'react'`, // Helps with React usage
  },
});
