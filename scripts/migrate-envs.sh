#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

declare -A MAP=(
  [".env"]=".env.local"
  ["backend/.env"]="backend/.env.local"
  ["frontend/.env"]="frontend/.env.local"
)

echo "== BrenKeeper env migration helper =="

for src in "${!MAP[@]}"; do
  src_path="$PROJECT_ROOT/$src"
  dest_rel=${MAP[$src]}
  dest_path="$PROJECT_ROOT/$dest_rel"

  if [ -f "$src_path" ]; then
    echo "Found $src - moving to $dest_rel"
    if [ -f "$dest_path" ]; then
      echo "  -> Destination $dest_rel already exists. Backing up to ${dest_rel}.backup.$(date +%s)"
      mv "$src_path" "${dest_path}.backup.$(date +%s)"
    else
      mv "$src_path" "$dest_path"
    fi

    # If file was tracked by git, remove it from the index so it won't be committed
    if git -C "$PROJECT_ROOT" ls-files --error-unmatch "$src" >/dev/null 2>&1; then
      echo "  -> $src was tracked by git; removing from index (git rm --cached)
"
      git -C "$PROJECT_ROOT" rm --cached --quiet "$src" || true
    fi
  else
    echo "No $src found; skipping"
  fi
done

# Ensure .gitignore contains local/production patterns
GITIGNORE="$PROJECT_ROOT/.gitignore"
if [ -f "$GITIGNORE" ]; then
  for pattern in ".env.local" ".env.ec2" "backend/.env.local" "backend/.env.ec2" "frontend/.env.local" "frontend/.env.ec2"; do
    if ! grep -qxF "$pattern" "$GITIGNORE" >/dev/null 2>&1; then
      echo "$pattern" >> "$GITIGNORE"
      echo "Added $pattern to .gitignore"
    fi
  done
fi

echo "\nMigration complete. Please verify the following files exist locally and fill them with the correct secrets:"
for expected in ".env.local" "backend/.env.local" "frontend/.env.local"; do
  if [ -f "$PROJECT_ROOT/$expected" ]; then
    echo " - $expected (ok)"
  else
    echo " - $expected (missing)"
  fi
done

echo "\nNext steps:"
echo " - Do NOT commit .env.local files. They are intentionally ignored."
echo " - For EC2 production, create .env.ec2, backend/.env.ec2 and frontend/.env.ec2 from the example files before running deploy-ec2.sh."
echo " - If you moved sensitive keys, rotate them if they were ever pushed to a remote." 
