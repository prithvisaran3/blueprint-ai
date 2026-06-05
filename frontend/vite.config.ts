import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Hidden source maps: not served publicly but available to browser DevTools
    // so the next time an error occurs we can read the original file + line.
    sourcemap: 'hidden',
    rolldownOptions: {
      output: {
        // Keep recharts + es-toolkit out of DashboardPage. Rolldown can minify both
        // into the same chunk as the queries CJS helper (imported as `r`), and
        // es-toolkit's `var r = r()` then shadows that import → "r is not a function".
        codeSplitting: {
          groups: [
            {
              name: 'recharts-vendor',
              test: /node_modules[\\/](recharts|es-toolkit|d3-|internmap|victory-vendor)/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
