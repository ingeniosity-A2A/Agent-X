#!/usr/bin/env bash
# Environment probe for Onomondo/NCS skill
set -euo pipefail
echo "== onomondo-ncs env probe =="
echo "host: $(uname -a)"
command -v python3 >/dev/null && python3 --version || echo "python3: missing"
command -v git >/dev/null && git --version || echo "git: missing"
command -v cmake >/dev/null && cmake --version | head -1 || echo "cmake: missing"
command -v west >/dev/null && west --version || echo "west: NOT installed (required for real NCS builds)"
command -v nrfjprog >/dev/null && nrfjprog --version || echo "nrfjprog: NOT installed (required for flash)"
echo "SoftSIM: CLI-path only — requires Onomondo credentials + nRF91 hardware"
echo "Lab path: python3 scripts/mock_connect.py"
