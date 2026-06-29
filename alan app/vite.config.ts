import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const AD_EXTS = new Set([
  'mp4', 'webm', 'mov', 'avi',
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
])

function adsManifestPlugin() {
  const adsDir = path.resolve(__dirname, 'public/ads')
  const manifestPath = path.join(adsDir, 'manifest.json')

  function writeManifest() {
    if (!fs.existsSync(adsDir)) fs.mkdirSync(adsDir, { recursive: true })
    const files = fs.readdirSync(adsDir).filter(f => {
      const ext = f.split('.').pop()?.toLowerCase() ?? ''
      return AD_EXTS.has(ext)
    })
    fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2))
  }

  return {
    name: 'ads-manifest',
    buildStart() { writeManifest() },
    configureServer(server: { watcher: { add: (p: string) => void; on: (e: string, cb: (f: string) => void) => void } }) {
      writeManifest()
      server.watcher.add(adsDir)
      server.watcher.on('add',    (f) => { if (f.startsWith(adsDir)) writeManifest() })
      server.watcher.on('unlink', (f) => { if (f.startsWith(adsDir)) writeManifest() })
    },
  }
}

export default defineConfig({
  plugins: [react(), adsManifestPlugin()],
})
