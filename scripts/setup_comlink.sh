#!/bin/sh
set -eu

version="4.4.0"
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
tools_dir="$project_dir/.tools/comlink"
archive="$tools_dir/comlink.zip"
binary="$tools_dir/swgoh-comlink"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This setup script currently supports macOS only." >&2
  exit 1
fi

mkdir -p "$tools_dir"
curl -fLso "$archive" \
  "https://github.com/swgoh-utils/swgoh-comlink/releases/download/v${version}/swgoh-comlink-macos-${version}.zip"
unzip -qo "$archive" -d "$tools_dir"
mv "$tools_dir/swgoh-comlink-${version}" "$binary"
chmod 700 "$binary"
rm "$archive"

echo "Installed Comlink ${version} at $binary"
echo "Start it with: scripts/start_comlink.sh"
