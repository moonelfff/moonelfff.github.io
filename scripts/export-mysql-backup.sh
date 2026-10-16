#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ $# != 1 || ! -d "$1" || ! -f "$1/.env.local" ]]; then
  echo "Usage: export-mysql-backup.sh <application-directory>" >&2
  exit 1
fi

app=$(cd -- "$1" && pwd -P)
export PATH="$HOME/.local/bin:$PATH"
parent=$(dirname -- "$app")/private-backups
mkdir -p -- "$parent"
exec 9>"$parent/export.lock"
flock -n 9 || { echo "Another backup export is running." >&2; exit 1; }
work=$(mktemp -d "$parent/export.XXXXXXXX")
trap 'rm -rf -- "$work"' EXIT

cd -- "$app"
node --env-file=.env.local scripts/backup-mysql.mjs --output "$work/snapshot" >&2
tar -czf - -C "$work/snapshot" .
