import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'frontend', // Specify the output directory as 'frontend'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://healbuddy-backend.onrender.com', // Proxy API requests to the backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite API path if needed
      },
    },
  },
});
