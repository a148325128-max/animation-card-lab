#!/bin/zsh
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v python3 >/dev/null 2>&1; then
  echo "需要先安装 Python 3.10 或更新版本，详见本目录的《开始使用.md》。"
  read '?按回车结束'
  exit 1
fi
python3 scripts/open-lab.py
if [ $? -ne 0 ]; then
  read '?启动尚未完成，查看上面的说明后按回车结束'
fi
