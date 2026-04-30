#!/usr/bin/env bash
# Push bharatdeal to a new private GitHub repo.
# Run from the project root:  bash ./scripts/push-to-github.sh

set -euo pipefail

REPO_NAME="bharatdeal"
VISIBILITY="--private"   # change to --public if you want it public
DEFAULT_BRANCH="main"

# --- Sanity checks ---------------------------------------------------------
command -v git >/dev/null 2>&1 || { echo "git not installed. Run: brew install git"; exit 1; }
command -v gh  >/dev/null 2>&1 || { echo "gh not installed. Run: brew install gh"; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
  echo "Not signed in to GitHub. Running 'gh auth login'..."
  gh auth login
fi

# Make sure we're at the project root (where package.json lives)
if [ ! -f "package.json" ]; then
  echo "Run this script from the bharatdeal project root (where package.json is)."
  exit 1
fi

# --- Stage and commit any uncommitted work ---------------------------------
echo "==> Committing any pending changes..."
git add -A
if git diff --cached --quiet; then
  echo "    (nothing new to commit)"
else
  git commit -m "Snapshot before pushing to GitHub"
fi

# Make sure we're on the right branch
git branch -M "$DEFAULT_BRANCH"

# --- Create the repo on GitHub --------------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  echo "==> 'origin' already configured: $(git remote get-url origin)"
else
  echo "==> Creating private GitHub repo '$REPO_NAME'..."
  gh repo create "$REPO_NAME" $VISIBILITY --source=. --remote=origin --push
  echo
  echo "Done. Repo URL:"
  gh repo view --json url -q .url
  exit 0
fi

# If origin already existed, just push
echo "==> Pushing $DEFAULT_BRANCH to origin..."
git push -u origin "$DEFAULT_BRANCH"

echo
echo "Done. Repo URL:"
gh repo view --json url -q .url
