#!/usr/bin/env bash
set -euo pipefail

title="${1:-}"

if [ -z "$title" ]; then
  printf "请输入文章标题，例如：npm run new:post -- \"我的文章标题\"\n" >&2
  exit 1
fi

npx hexo new post "$title"
