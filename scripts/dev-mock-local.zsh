#!/usr/bin/env zsh
set -e

ROOT_DIR="${0:A:h:h}"
typeset -a child_pids

cleanup() {
  for pid in "${child_pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}

trap cleanup INT TERM EXIT

cd "$ROOT_DIR/backend"
npm run dev:mock &
child_pids+=("$!")

cd "$ROOT_DIR/frontend"
npm run dev:mock &
child_pids+=("$!")

echo "Local mock stack starting:"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both processes."

wait
