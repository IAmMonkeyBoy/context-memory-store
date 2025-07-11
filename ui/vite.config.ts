import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for .NET integration
  build: {
    outDir: '../src/ContextMemoryStore.Api/wwwroot',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@mui/material'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['axios', 'date-fns', '@tanstack/react-query']
        }
      }
    },
    sourcemap: true
  },
  
  // Development server configuration
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to .NET backend
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/metrics': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Path resolution for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@theme': path.resolve(__dirname, './src/theme')
    }
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_'
})