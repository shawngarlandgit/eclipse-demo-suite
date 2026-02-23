import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keep the app single-origin (web + signaling) for HTTPS tunnels and mobile Safari.
    // Vite blocks unknown hosts by default (DNS rebinding protection); allow tunnels in dev.
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://127.0.0.1:8787",
        ws: true
      }
    }
  }
})
