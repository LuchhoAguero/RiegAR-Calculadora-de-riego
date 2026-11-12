import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  define: { __RIEGAR_DEV_SERVER__: JSON.stringify(command === 'serve' && !isPreview) },
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}))
