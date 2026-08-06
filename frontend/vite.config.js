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
          manualChunks(id) {
            // Core React vendor
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            // Charting
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
              return 'vendor-charts';
            }
            // Maps
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
              return 'vendor-maps';
            }
            // Icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Excel/xlsx
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // All other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
})

