#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
comlink="$project_dir/.tools/comlink/swgoh-comlink"
reporter="$project_dir/.venv/bin/guild-report"
log_dir="$project_dir/data/logs"
comlink_pid=""

mkdir -p "$log_dir"

cleanup() {
  status=$?
  trap - EXIT INT TERM

  if [ -n "$comlink_pid" ]; then
    kill "$comlink_pid" 2>/dev/null || true
    wait "$comlink_pid" 2>/dev/null || true
  fi

  if [ "$status" -ne 0 ] && [ -x "$reporter" ]; then
    failed_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    "$reporter" --alert \
      "The scheduled officer report failed with exit status ${status} at ${failed_at}. Check data/logs/daily.err.log on the reporting Mac." \
      || true
  fi

  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ ! -x "$comlink" ]; then
  echo "Comlink is missing. Run scripts/setup_comlink.sh." >&2
  exit 1
fi

if [ ! -x "$reporter" ]; then
  echo "Python environment is missing. Follow the README setup steps." >&2
  exit 1
fi

if ! curl -fsS "http://localhost:3000/readyz" >/dev/null 2>&1; then
  "$comlink" --name "Blues Brothers Droid" --port 3000 \
    >>"$log_dir/comlink.log" 2>&1 &
  comlink_pid=$!

  attempts=0
  until curl -fsS "http://localhost:3000/readyz" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
      echo "Comlink did not become ready within 30 seconds." >&2
      exit 1
    fi
    sleep 1
  done
fi

cd "$project_dir"
"$reporter" --live --report officer --send
