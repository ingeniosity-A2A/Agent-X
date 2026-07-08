#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SIF AVA007 — Proot Ubuntu Diagnostic
#  Run inside: proot-distro login ubuntu
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0
pass() { echo -e " ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e " ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e " ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }
info() { echo -e " ${CYAN}ℹ${NC} $1"; }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SIF AVA007 — Proot Ubuntu Diagnostic                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── System ─────────────────────────────────────────────────────
echo -e "${CYAN}── System ──${NC}"
info "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '"')"
info "Kernel: $(uname -r)"
info "Arch: $(uname -m)"
info "GCC: $(gcc --version 2>/dev/null | head -1 || echo 'not found')"
info "CMake: $(cmake --version 2>/dev/null | head -1 || echo 'not found')"

# ─── SDR Libraries ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}── SDR Libraries ──${NC}"

# librtlsdr
if dpkg -l | grep -q librtlsdr 2>/dev/null; then
    pass "librtlsdr installed"
else
    ldconfig -p 2>/dev/null | grep -q librtlsdr && pass "librtlsdr found" || info "librtlsdr not found"
fi

# libhackrf
if dpkg -l | grep -q libhackrf 2>/dev/null; then
    pass "libhackrf installed"
else
    ldconfig -p 2>/dev/null | grep -q libhackrf && pass "libhackrf found" || info "libhackrf not found"
fi

# SoapySDR
if dpkg -l | grep -q libsoapysdr 2>/dev/null; then
    pass "SoapySDR installed"
else
    ldconfig -p 2>/dev/null | grep -q libSoapySDR && pass "SoapySDR found" || info "SoapySDR not found"
fi

# UHD
if dpkg -l | grep -q libuhd 2>/dev/null; then
    pass "UHD installed"
else
    info "UHD not found"
fi

# libiio (for ADALM-Pluto, etc.)
if dpkg -l | grep -q libiio 2>/dev/null; then
    pass "libiio installed"
else
    info "libiio not found"
fi

# ─── srsRAN ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── srsRAN ──${NC}"

SRSPATHS=(
    "/usr/local/bin/srsenb"
    "/usr/bin/srsenb"
    "/opt/srsran/bin/srsenb"
    "$HOME/srsran/build/srsenb/src/srsenb"
)

for p in "${SRSPATHS[@]}"; do
    if [ -f "$p" ]; then
        pass "srsENB: $p"
        VER=$($p --version 2>&1 | head -1)
        info "  Version: $VER"
        break
    fi
done

# Check srsRAN build directory
if [ -d "$HOME/srsran" ]; then
    pass "srsRAN source: ~/srsran"
    if [ -d "$HOME/srsran/build" ]; then
        pass "srsRAN build dir exists"
    else
        warn "srsRAN not built yet"
        info "  cd ~/srsran && mkdir build && cd build && cmake .. && make -j4"
    fi
fi

# srsRAN config
for cfg in "$HOME/.config/srsran" "/etc/srsran" "$HOME/srsran/configs"; do
    if [ -d "$cfg" ]; then
        pass "srsRAN config: $cfg"
        ls "$cfg"/*.conf 2>/dev/null | head -5 | sed 's/^/    /'
    fi
done

# ─── Wavelet Lab sSDR ──────────────────────────────────────────
echo ""
echo -e "${CYAN}── Wavelet Lab sSDR ──${NC}"

WAVELET_PATHS=(
    "/opt/wavelet"
    "/usr/local/lib/wavelet"
    "$HOME/wavelet"
    "$HOME/.local/lib/wavelet"
)

for p in "${WAVELET_PATHS[@]}"; do
    if [ -d "$p" ]; then
        pass "Wavelet Lab found: $p"
        ls "$p"/ 2>/dev/null | head -10 | sed 's/^/    /'
        break
    fi
done

# Check for wlm CLI
if command -v wlm &>/dev/null; then
    pass "wlm CLI found"
    wlm --version 2>&1 | head -1 | sed 's/^/    /' || true
fi

# Check for wavelet shared libs
ldconfig -p 2>/dev/null | grep -i wavelet | head -3 | while read line; do
    pass "Library: $line"
done

# Check USB device for sSDR
if command -v lsusb &>/dev/null; then
    SDR_USB=$(lsusb 2>/dev/null | grep -iE "wavelet|ssdr|1234|abcd|0403|10c4")
    if [ -n "$SDR_USB" ]; then
        pass "SDR USB device found:"
        echo "$SDR_USB" | sed 's/^/    /'
    else
        info "No SDR USB device detected (connect sSDR via OTG)"
    fi
fi

# ─── OpenCL ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── OpenCL / GPU ──${NC}"

if dpkg -l | grep -q opencl-headers 2>/dev/null; then
    pass "OpenCL headers installed"
fi

if dpkg -l | grep -q ocl-icd 2>/dev/null; then
    pass "OCL-ICD installed"
fi

ldconfig -p 2>/dev/null | grep -q libOpenCL && pass "libOpenCL.so found" || info "libOpenCL.so not found"

# Check for Adreno OpenCL ICD
for icd in /etc/OpenCL/vendors/*.icd /system/vendor/etc/OpenCL/vendors/*.icd; do
    if [ -f "$icd" ]; then
        pass "OpenCL ICD: $icd"
    fi
done 2>/dev/null

# ─── Network Stack ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Network ──${NC}"

IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
info "IP: $IP_ADDR"

# Check mesh connectivity
if curl -s --connect-timeout 2 http://10.0.0.175:9043/status &>/dev/null; then
    pass "S26 (10.0.0.175:9043) reachable"
else
    warn "S26 not reachable"
fi

# ─── Build Tools ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Build Tools ──${NC}"

for tool in gcc g++ cmake make git pkg-config autoconf automake libtool; do
    command -v $tool &>/dev/null && pass "$tool" || info "$tool not found"
done

# ─── Summary ────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}  ${YELLOW}Warnings: $WARN${NC}              ║"
echo "╠══════════════════════════════════════════════════════════╣"

if [ $FAIL -eq 0 ]; then
    echo -e "║  ${GREEN}✅ PROOT UBUNTU READY${NC}                                 ║"
else
    echo -e "║  ${YELLOW}⚠️  $FAIL ITEMS NEED ATTENTION${NC}                          ║"
fi

echo "╚══════════════════════════════════════════════════════════╝"
