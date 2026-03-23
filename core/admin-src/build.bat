@echo off
echo 正在构建前端...
cd /d %~dp0

:: 先用 Node.js 脚本清理 admin 目录中的旧产物（保留需要保留的文件）
node clean-admin.mjs

:: 构建
call npx vite build
if %errorlevel% neq 0 (
  echo 构建失败！
  exit /b 1
)

echo 构建成功！产物已输出到 ../admin/
