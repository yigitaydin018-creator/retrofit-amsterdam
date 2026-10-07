import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Ordinary noise only. The project previously sat under an iCloud-synced
    // ~/Desktop, where the sync daemon rewrote file metadata every few minutes
    // and the watcher read that as a change, restarting the server on a loop.
    // It now lives outside the synced tree, so vite.config.js no longer has to
    // be ignored and editing it restarts the server normally again.
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
})
