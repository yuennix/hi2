#!/bin/sh
set -e
git config user.email "bot@hi2mail.app"
git config user.name "Hi2 Mail Bot"
echo "Staging changes..."
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit — pushing existing commits..."
else
  git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
  echo "Committed."
fi
echo "Pushing to GitHub..."
git push "https://yuennix:${GITHUB_PAT}@github.com/yuennix/hi2.git" main
echo "Done."
