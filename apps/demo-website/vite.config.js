import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // SPA fallback — serve index.html for all routes
    historyApiFallback: true,
  },
  // Vite uses appType 'spa' by default which handles fallback
})
