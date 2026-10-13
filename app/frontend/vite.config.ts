import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            // Evita poluir o terminal com ECONNREFUSED quando o Spring Boot estiver desligado
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  title: 'Backend Indisponível',
                  status: 503,
                  detail: 'O servidor Spring Boot não está rodando na porta 8080.',
                })
              )
            }
          })
        },
      },
    },
  },
})
