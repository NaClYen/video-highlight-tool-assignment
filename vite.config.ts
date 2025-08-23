/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom', // React 測試需要 DOM 環境
    setupFiles: './src/setupTests.ts',
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: { provider: 'v8', reporter: ['text', 'html', 'lcov'] },
  },
})
