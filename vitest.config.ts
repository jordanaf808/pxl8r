import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
})

export default config
