#!/usr/bin/env bash
set -euo pipefail

message="${1:-update blog content}"

npm run clean
npm run build

if git diff --quiet && git diff --cached --quiet; then
  printf "没有需要发布的改动。\n"
  exit 0
fi

git add .
git commit -m "$message"
git push origin main
