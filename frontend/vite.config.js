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
        '/api/': {
          target: env.VITE_BACKEND_URL || `http://${env.VITE_HOST || 'localhost'}:${env.BACKEND_PORT || '8000'}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-icons': ['lucide-react'],
            'vendor-xlsx': ['xlsx']
          }
        },
      },
    },
  };
})

