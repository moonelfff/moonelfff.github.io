#!/usr/bin/env bash
set -euo pipefail
umask 022

# Install this fixed entry point outside releases; the key cannot open a shell.
control=$(cd -- "$(dirname -- "$0")" && pwd -P)
site=$(dirname -- "$control")
export PATH="$HOME/.local/bin:$PATH"
if [[ ! ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([a-f0-9]{40})$ ]]; then
  echo "Only deploy <commit SHA> is allowed." >&2
  exit 1
fi
sha=${BASH_REMATCH[1]}
exec 8>"$control/deploy.lock"
flock -w 1800 8 || { echo "Deployment lock timed out." >&2; exit 1; }
mkdir -p "$site/releases"
release=$(mktemp -d "$site/releases/$sha-XXXXXXXX")
chmod 750 "$release"
archive=$(mktemp "$control/source.XXXXXXXX.tar")
cleanup() {
  rm -f -- "$archive"
  if [[ ! -f "$release/.deploy-keep" ]]; then
    rm -rf -- "$release"
  fi
}
trap cleanup EXIT

# Receive before extracting: reject oversized archives, links and private files.
head -c 104857601 > "$archive"
python3 - "$archive" <<'PY'
import pathlib
import sys
import tarfile

archive = pathlib.Path(sys.argv[1])
if archive.stat().st_size > 104857600:
    raise SystemExit("Source archive exceeds 100 MiB.")
with tarfile.open(archive) as tar:
    total = 0
    for member in tar:
        path = pathlib.PurePosixPath(member.name)
        if (path.is_absolute() or ".." in path.parts or
                any(part in {".git", "node_modules", ".next"} or
                    (part.startswith(".env") and part != ".env.example")
                    for part in path.parts) or
                not (member.isfile() or member.isdir())):
            raise SystemExit("Unsafe source archive entry.")
        total += member.size
        if total > 209715200:
            raise SystemExit("Expanded source exceeds 200 MiB.")
PY
tar -xf "$archive" -C "$release" --no-same-owner --no-same-permissions
printf '%s\n' "$sha" > "$release/.deploy-release"
timeout --signal=TERM --kill-after=30 1800 \
  node "$release/scripts/beget/deploy.mjs" "$site" "$release" "$sha"
