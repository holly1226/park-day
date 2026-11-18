#!/bin/zsh
set -e
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  print '请先安装 Node.js 24 或更新版本：https://nodejs.org/'
  read '?按回车退出。'
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)'; then
  print '本项目需要 Node.js 24 或更新版本。'
  read '?按回车退出。'
  exit 1
fi
if [[ ! -d node_modules || ! -f public/duckdb/duckdb-eh.wasm ]]; then
  npm ci --no-audit --no-fund
fi
print '公园正在打开。保留本窗口，按 Ctrl+C 停止。'
npm run dev -- --open
