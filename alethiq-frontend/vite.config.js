import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 3000,
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // ⚠️ Make sure this is port 8000 (Python), NOT 8080
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // 🟢 VITAL: Strips '/api' from the URL
      },
      // If you have Java backend on 8080, add another proxy rule:
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
  },
})