import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

// Use the repo sub-path on GitHub Pages; keep root for local dev.
const isPages = process.env.GITHUB_PAGES === 'true'
const base = isPages ? '/klaaswhite-smo-randomizer-tracker/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'config-save-endpoint',
      configureServer(server) {
        server.middlewares.use('/api/save-config', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const body = Buffer.concat(chunks).toString('utf8')
            const parsed = JSON.parse(body)
            const target = path.join(root, 'public', 'config', 'smo-config.json')
            await writeFile(target, JSON.stringify(parsed, null, 2), 'utf8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      },
    },
  ],
})
