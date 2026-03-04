import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /ollama/* → https://healthmate.avantikatechnology.com/* to avoid CORS issues during development
      '/ollama': {
        target: 'https://healthmate.avantikatechnology.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
})
