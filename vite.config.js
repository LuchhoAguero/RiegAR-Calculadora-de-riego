import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { isIP } from 'node:net'

function verifyStagingBuild(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  let api
  try {
    api = new URL(env.VITE_API_URL)
  } catch {
    throw new Error('Staging requiere un origen HTTPS explícito en VITE_API_URL.')
  }
  if (api.protocol !== 'https:' || api.origin !== env.VITE_API_URL ||
      isIP(api.hostname.replace(/^\[|\]$/g, '')) || !api.hostname.includes('.') ||
      /\.(?:localhost|local|invalid)$/.test(api.hostname)) {
    throw new Error('VITE_API_URL debe ser el origen HTTPS de la API de staging, sin ruta ni credenciales.')
  }
  if (env.VITE_RIEGAR_V2_MOCK === 'true') {
    throw new Error('El build de staging exige que el modo de API simulada esté deshabilitado.')
  }
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
    throw new Error('El build de staging requiere NODE_ENV=production.')
  }
}

export default defineConfig(({ command, mode, isPreview }) => {
  if (command === 'build' && mode === 'staging') verifyStagingBuild(mode)
  return {
    define: { __RIEGAR_DEV_SERVER__: JSON.stringify(command === 'serve' && !isPreview) },
    plugins: [react()],
    resolve: {
      alias: { '@': '/src' }
    }
  }
})
