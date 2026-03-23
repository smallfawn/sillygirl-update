import { build } from 'vite'
import fs from 'fs'
import path from 'path'

async function main() {
  // 清理
  const adminDir = path.resolve('../admin')
  if (fs.existsSync(adminDir)) {
    const keep = new Set(['icons', 'scripts'])
    for (const f of fs.readdirSync(adminDir)) {
      if (keep.has(f)) continue
      const fp = path.join(adminDir, f)
      fs.rmSync(fp, { recursive: true })
    }
  }

  // 构建到临时目录
  await build({ configFile: './vite.config.ts', outDir: 'dist', emptyOutDir: true })

  // 复制到 admin
  function copyDir(src, dst) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true })
    for (const f of fs.readdirSync(src)) {
      const s = path.join(src, f)
      const d = path.join(dst, f)
      if (fs.statSync(s).isDirectory()) copyDir(s, d)
      else fs.copyFileSync(s, d)
    }
  }

  copyDir('dist', '../admin')
  console.log('Build complete! Output to ../admin/')
}

main().catch(e => { console.error(e); process.exit(1) })
