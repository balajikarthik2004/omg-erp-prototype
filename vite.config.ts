import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function caseInsensitivePublicPlugin(): Plugin {
  return {
    name: 'case-insensitive-public',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url || !req.url.startsWith('/images/')) return next()
        try {
          const publicDir = path.resolve(process.cwd(), 'public')
          const decoded = decodeURIComponent(req.url.split('?')[0])
          const targetPath = path.join(publicDir, decoded)

          const dir = path.dirname(targetPath)
          const requestedBase = path.basename(targetPath)
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir)
            if (files.includes(requestedBase)) {
              return next()
            }
            const match = files.find((f) => f.toLowerCase() === requestedBase.toLowerCase())
            if (match) {
              const urlDir = req.url.slice(0, req.url.lastIndexOf('/') + 1)
              const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
              req.url = `${urlDir}${encodeURIComponent(match)}${query}`
            }
          }
        } catch {
          // ignore error
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), caseInsensitivePublicPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

