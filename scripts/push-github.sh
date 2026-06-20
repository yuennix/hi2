#!/bin/sh
set -e
echo "Pushing to GitHub..."
git push "https://yuennix:${GITHUB_PAT}@github.com/yuennix/hi2.git" main
echo "Done."
