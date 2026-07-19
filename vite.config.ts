import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/EventTimes/',
  plugins: [react()],
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    // Date-formatting assertions are written for Polish local time; pin the
    // timezone so the suite passes on UTC CI runners and any dev machine.
    env: { TZ: 'Europe/Warsaw' },
  },
})
