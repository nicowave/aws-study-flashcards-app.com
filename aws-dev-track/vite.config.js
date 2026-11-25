import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tests run in jsdom, a simulated browser, so components can render without a real one
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
