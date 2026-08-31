#!/bin/bash
# Ensures the Next dev server is responding on :3000; starts it if not.
# Usage: bash /home/z/my-project/scripts/ensure-dev.sh
if curl -s -o /dev/null --max-time 3 http://localhost:3000/; then
  echo "[ensure-dev] server already up"
  exit 0
fi
echo "[ensure-dev] starting dev server..."
cd /home/z/my-project
setsid nohup bun run dev > /home/z/my-project/dev.log 2>&1 < /dev/null &
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 3 http://localhost:3000/; then
    echo "[ensure-dev] server ready (attempt $i)"
    exit 0
  fi
  sleep 1
done
echo "[ensure-dev] FAILED to start server" >&2
exit 1
