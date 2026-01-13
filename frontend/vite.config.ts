import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ethers': ['ethers'],
          // DO NOT include facilitator-client in manualChunks
          // It should be lazy-loaded dynamically only when needed
          // Including it here causes it to be bundled and loaded on page load
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
