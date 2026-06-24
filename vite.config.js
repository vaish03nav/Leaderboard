import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honor the PORT env var (used by the preview harness) when set.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
