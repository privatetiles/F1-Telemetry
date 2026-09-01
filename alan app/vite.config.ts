import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

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

// Cloudflare Pages limits individual static assets to 25 MiB. Keep the source
// telemetry untouched, but gzip the one oversized race file in the production
// bundle so it can still be shipped in full.
function compressOversizedTelemetryPlugin() {
  const relativePath = path.join(
    'data',
    'FastF1 Data',
    'fastf1_2026_dutch_grand_prix',
    'race',
    'telemetry_full_race.json',
  )

  return {
    name: 'compress-oversized-telemetry',
    closeBundle() {
      const sourcePath = path.resolve(__dirname, 'dist', relativePath)
      if (!fs.existsSync(sourcePath)) return

      const source = fs.readFileSync(sourcePath)
      fs.writeFileSync(`${sourcePath}.gz`, zlib.gzipSync(source, { level: zlib.constants.Z_BEST_COMPRESSION }))
      fs.unlinkSync(sourcePath)
    },
  }
}

export default defineConfig({
  plugins: [react(), adsManifestPlugin(), compressOversizedTelemetryPlugin()],
})
