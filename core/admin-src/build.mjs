import { build } from 'vite'

try {
  await build({ configFile: './vite.config.ts', logLevel: 'info' })
  console.log('Build complete!')
} catch (err) {
  console.error('Build failed:', err)
  process.exit(1)
}
