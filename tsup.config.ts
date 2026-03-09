import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/main.ts' },
  format: ['cjs'],
  platform: 'node',
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  bundle: true,
  noExternal: [/.*/]
})
