#!/usr/bin/env bash
# Real repomix packer — https://github.com/yamadashy/repomix
set -euo pipefail
WORKSPACE="${1:-/workspace/scratch}"
OUT="${2:-/workspace/out/final-exoskeleton-system.py}"

echo "[ava007] Sanitizing temp files..."
find "$WORKSPACE" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$WORKSPACE" -name "*.pyc" -delete 2>/dev/null || true

echo "[ava007] Running repomix..."
if command -v npx >/dev/null 2>&1; then
    npx --yes repomix "$WORKSPACE" -o "$OUT" --style plain
else
    echo "ERROR: npx not found. Install Node.js first." >&2
    exit 1
fi

echo "[ava007] Pack complete: $OUT"
echo "[ava007] Note: ISA100 GSAP ≠ GreenSock GSAP — see gsap_acronym_collision.md"
