import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /api/* → https://api.avantikatechnology.com/* for local dev (avoids CORS)
      '/api': {
        target: 'https://api.avantikatechnology.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
