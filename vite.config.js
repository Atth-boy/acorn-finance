import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE ?? '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: 'กระรอกน้อยนักสะสม',
          short_name: 'Acorn',
          description: 'บันทึกรายรับรายจ่าย ธีมกระรอกนักสะสม',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait-primary',
          background_color: '#F4ECDB',
          theme_color: '#7A4F2A',
          icons: [
            {
              src: 'apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
      }),
    ],
  }
})
