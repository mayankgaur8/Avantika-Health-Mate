import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, proxy /api/* → local Ollama so you can test without the production server
      '/api': {
        target: 'http://localhost:11434',
        changeOrigin: true,
      },
    },
  },
})
