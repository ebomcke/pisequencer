import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to root-level web folder for deployment
    outDir: '../web',
    // Clear the output directory before building
    emptyOutDir: true,
    // Generate source maps for debugging in production
    sourcemap: true,
  },
})
