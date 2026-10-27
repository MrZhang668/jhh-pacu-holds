import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  define: {
    // size of the campus file, for the loading bar when the server compresses it
    __CAMPUS_BYTES__: JSON.stringify(statSync(fileURLToPath(new URL('./public/data/campus.json', import.meta.url))).size),
  },
  // the 3D chunk (three.js, R3F, post-processing) is large by nature; it loads behind the loading screen
  build: { chunkSizeWarningLimit: 1400 },
  // pre-bundle the 3D stack together so the dev server never serves two copies of React/R3F
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
  },
})
