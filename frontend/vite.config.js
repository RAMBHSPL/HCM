import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, '../');
  const env = loadEnv(mode, rootEnvDir, '');
  return {
    envDir: rootEnvDir,
    plugins: [react()],
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: parseInt(env.VITE_PORT) || 5174,
      strictPort: false,
      proxy: {
        // Proxy all /api requests to Django backend
        '/api/': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'lucide-react', 'react-modal'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
})
