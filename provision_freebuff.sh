#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  AGENT X — Freebuff Capability Provisioning
#  Debian 13 / aarch64 / glibc 2.41 guest on S26 Ultra
#
#  Owner-verified runtime boundary (2026-09-10):
#
#    S26 Ultra
#    └── Termux (Android / bionic)      ← cannot exec glibc ELF — expected
#        └── Debian 13 (aarch64 · glibc 2.41)
#            └── Freebuff 0.0.142 (linux-arm64)
#                └── Agent-X Development Capability
#
#  The binary is verified good. DO NOT reinstall or rebuild Freebuff.
#  This script only installs + exposes it as a Linux capability.
#
#  Usage (inside Debian):
#    bash provision_freebuff.sh
#
#  Override source binary:
#    FREEBUFF_SOURCE=/path/to/freebuff bash provision_freebuff.sh
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

FREEBUFF_SOURCE="${FREEBUFF_SOURCE:-/data/data/com.termux/files/home/freebuff-test/linux-arm64/freebuff}"
INSTALL_DIR="/opt/freebuff"
INSTALL_BIN="$INSTALL_DIR/freebuff"
SYMLINK="/usr/local/bin/freebuff"
EXPECTED_VERSION="0.0.142"

# ─── 1. Runtime Gate ────────────────────────────────────────────
step "1. Runtime Gate (Debian · aarch64 · glibc)"

[ "$(uname -m)" = "aarch64" ] || fail "arch is $(uname -m), expected aarch64"
log "arch: $(uname -m)"

if [ -r /etc/debian_version ]; then
    log "Debian guest: $(cat /etc/debian_version)"
else
    warn "/etc/debian_version not found — not a Debian guest?"
fi

GLIBC_VER="$(ldd --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+$')"
if [ -n "$GLIBC_VER" ]; then
    log "glibc: $GLIBC_VER"
else
    warn "glibc version undetectable (ldd missing?)"
fi

[ "$(id -u)" = "0" ] || fail "run inside Debian as root (proot default). uid=$(id -u)"

# ─── 2. Source Binary ───────────────────────────────────────────
step "2. Source Binary"

[ -f "$FREEBUFF_SOURCE" ] || fail "source binary not found: $FREEBUFF_SOURCE (set FREEBUFF_SOURCE=/path/to/freebuff)"
log "source: $FREEBUFF_SOURCE"

# ─── 3. Install (owner commands, verbatim semantics) ───────────
step "3. Install to $INSTALL_DIR"

mkdir -p "$INSTALL_DIR"                                   || fail "mkdir $INSTALL_DIR"
cp -f "$FREEBUFF_SOURCE" "$INSTALL_BIN"                   || fail "cp binary"
chmod +x "$INSTALL_BIN"                                   || fail "chmod +x"
mkdir -p "$(dirname "$SYMLINK")"
ln -sf "$INSTALL_BIN" "$SYMLINK"                          || fail "ln -sf $SYMLINK"
log "installed: $INSTALL_BIN"
log "symlink:   $SYMLINK → $INSTALL_BIN"

# ─── 4. Verify ──────────────────────────────────────────────────
step "4. Verify Capability"

RESOLVED="$(command -v freebuff || true)"
if [ "$RESOLVED" = "$SYMLINK" ]; then
    log "command -v freebuff → $RESOLVED"
else
    fail "command -v freebuff → '${RESOLVED:-<none>}' (expected $SYMLINK)"
fi

VERSION_OUT="$(freebuff --version 2>/dev/null | head -1)"
if [ "$VERSION_OUT" = "$EXPECTED_VERSION" ]; then
    log "freebuff --version → $VERSION_OUT"
else
    warn "freebuff --version → '${VERSION_OUT:-<none>}' (expected $EXPECTED_VERSION)"
    warn "binary is owner-verified good — do NOT rebuild; inspect PATH/source instead"
    exit 1
fi

# ─── Summary ────────────────────────────────────────────────────
step "Capability Ready"

echo ""
echo "Clean execution surface:"
echo ""
echo "  S26 Ultra"
echo "  └── Termux"
echo "      └── Debian 13"
echo "          └── Linux/glibc runtime"
echo "              └── Freebuff $VERSION_OUT"
echo "                  └── Agent-X Development Capability"
echo ""
echo "Invoke from Termux (through the Debian guest):"
echo "  proot-distro login debian -- freebuff --version"
echo ""
echo "Ownership: Ava does not contain Freebuff —"
echo "Agent X exposes it; the unified Ava/Agent-Browser Console invokes it."
