#!/usr/bin/env bash
set -euo pipefail
control=$(cd -- "$(dirname -- "$0")" && pwd -P)
site=$(dirname -- "$control")
if [[ ${SSH_ORIGINAL_COMMAND:-} != export-mysql-backup ]]; then
  echo "Only export-mysql-backup is allowed." >&2
  exit 1
fi
# Do not let release retention remove the backup's application while it runs.
exec 8>"$control/deploy.lock"
flock -s -w 1800 8 || { echo "Backup deployment lock timed out." >&2; exit 1; }
app=$(sed -n 's/^PassengerAppRoot //p' "$site/public_html/.htaccess" | tr -d '\r')
if [[ "$app" != "$site/"* || ! -f "$app/scripts/export-mysql-backup.sh" ]]; then
  echo "Cannot resolve the active backup application." >&2
  exit 1
fi
exec /bin/bash "$app/scripts/export-mysql-backup.sh" "$app"
