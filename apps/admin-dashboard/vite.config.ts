import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@convex': path.resolve(__dirname, '../../convex'),
    },
  },
  server: {
    // Allow HTTPS tunnels like trycloudflare.com in dev (Vite DNS rebinding protection).
    allowedHosts: true,
    proxy: {
      // Same-origin convenience for the admin dashboard -> secure-call signaling server.
      // Used by SecureCallsPage to create sessions without CORS headaches.
      '/secure-call-api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/secure-call-api/, ''),
      },
    },
  },
  // Set base path:
  // - '/bko/' for VPS deployment at neonpipe.me/bko
  // - '/' for Cloudflare Pages deployment (VITE_BASE_PATH=/)
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? '/bko/' : '/'),
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunk sizes
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
          convex: ['convex', 'convex/react'],
          clerk: ['@clerk/clerk-react'],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['convex/react', '@clerk/clerk-react'],
  },
}))
