import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminDir = path.resolve(__dirname, '../admin')

// 需要保留的文件（新前端不输出的）
const keepFiles = new Set([
  'icons',          // PWA 图标目录
  'scripts',        // loading.js
])

if (fs.existsSync(adminDir)) {
  const entries = fs.readdirSync(adminDir, { withFileTypes: true })
  for (const entry of entries) {
    if (keepFiles.has(entry.name)) continue
    const fullPath = path.join(adminDir, entry.name)
    if (entry.isDirectory()) {
      // 删除 assets 等旧目录
      if (entry.name === 'assets' || entry.name.startsWith('umi.') || entry.name.startsWith('p__') || entry.name.startsWith('t__')) {
        fs.rmSync(fullPath, { recursive: true })
        console.log(`删除目录: ${entry.name}`)
      }
    } else {
      // 删除旧的构建产物文件
      if (
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.css') ||
        entry.name === 'CNAME' ||
        entry.name === 'index.html' ||
        entry.name === 'favicon.ico'
      ) {
        fs.unlinkSync(fullPath)
        console.log(`删除文件: ${entry.name}`)
      }
    }
  }
}

console.log('清理完成')
