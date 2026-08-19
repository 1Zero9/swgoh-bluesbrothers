#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
binary="$project_dir/.tools/comlink/swgoh-comlink"

if [ ! -x "$binary" ]; then
  echo "Comlink is not installed. Run scripts/setup_comlink.sh first." >&2
  exit 1
fi

exec "$binary" --name "Blues Brothers Droid" --port 3000
