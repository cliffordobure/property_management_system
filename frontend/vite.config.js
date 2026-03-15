import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

// Ensure old index.js doesn't exist (this runs during config load)
try {
  const oldIndexPath = resolve(__dirname, 'src/index.js')
  if (fs.existsSync(oldIndexPath)) {
    fs.unlinkSync(oldIndexPath)
    console.log('✓ Removed old index.js file')
  }
} catch (error) {
  // Ignore errors - file might not exist
}

// Load env so production build uses .env.production (e.g. Render backend URL)
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const env = loadEnv(mode, resolve(__dirname), '')
const defaultProductionApi = 'https://property-management-system-w07h.onrender.com/api'
const apiUrl = env.REACT_APP_API_URL || env.VITE_API_URL || (mode === 'production' ? defaultProductionApi : 'http://localhost:5000/api')

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
  },
  plugins: [
    {
      ...react({
        include: /\.(jsx|js|tsx|ts)$/,
      }),
      enforce: 'pre', // Run before vite:import-analysis so .js files with JSX are transformed first
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})
