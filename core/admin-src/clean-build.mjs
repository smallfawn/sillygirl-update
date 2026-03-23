import fs from 'fs'
import path from 'path'

const assetsDir = path.resolve('dist', 'assets')
if (fs.existsSync(assetsDir)) {
  fs.readdirSync(assetsDir).forEach(f => {
    fs.unlinkSync(path.join(assetsDir, f))
  })
  fs.rmdirSync(assetsDir)
  console.log('cleaned dist/assets')
}

const adminAssetsDir = path.resolve('..', 'admin', 'assets')
if (fs.existsSync(adminAssetsDir)) {
  fs.readdirSync(adminAssetsDir).forEach(f => {
    fs.unlinkSync(path.join(adminAssetsDir, f))
  })
  fs.rmdirSync(adminAssetsDir)
  console.log('cleaned ../admin/assets')
}

const adminIndex = path.resolve('..', 'admin', 'index.html')
if (fs.existsSync(adminIndex)) {
  fs.unlinkSync(adminIndex)
  console.log('cleaned ../admin/index.html')
}

console.log('done')
