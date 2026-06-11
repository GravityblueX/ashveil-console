#!/bin/bash
echo "🚀 nocturne-admin 自动优化循环已启动..."
while true; do
  echo "=== $(date) 开始新一轮优化 ==="

  # 这里可调用 IDE Agent CLI（如 cursor / claude 等），或手动触发

  echo "优化循环进行中..."
  git add .
  git commit -m "chore(auto): optimization loop $(date +%Y%m%d-%H%M)" || true
  git push || true
  gh release create "v0.$(date +%s)" --title "Auto Loop Release $(date)" --notes "自动优化循环轮次" || true
  sleep 3600
 done
