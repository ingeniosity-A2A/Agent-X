#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SIF AVA007 — S25 Ultra Diagnostic
#  Run on S25 Ultra via Termux/Proot Ubuntu
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
PASS=0
FAIL=0
WARN=0

pass() { echo -e " ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e " ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e " ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }
info() { echo -e " ${CYAN}ℹ${NC} $1"; }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SIF AVA007 — S25 Ultra Diagnostic                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Environment Detection ─────────────────────────────────────
echo -e "${CYAN}── Environment ──${NC}"

if [ -d "/data/data/com.termux" ]; then
    pass "Termux detected"
    info "PREFIX: $PREFIX"
    info "HOME: $HOME"
else
    warn "Not running in Termux"
fi

if [ -d "/data/data/com.termux/files/home/ubuntu" ] || [ -d "$PREFIX/var/lib/proot-distro/installed-ubuntu" ]; then
    pass "Proot Ubuntu found"
elif command -v proot-distro &>/dev/null; then
    pass "proot-distro available"
    info "Installed distros:"
    proot-distro list 2>/dev/null | head -5 | sed 's/^/    /'
else
    warn "Proot Ubuntu not found"
    info "Install: pkg install proot-distro && proot-distro install ubuntu"
fi

# ─── Hardware Detection ────────────────────────────────────────
echo ""
echo -e "${CYAN}── Hardware ──${NC}"

# Device model
if [ -f "/system/build.prop" ]; then
    MODEL=$(grep "ro.product.model" /system/build.prop 2>/dev/null | cut -d= -f2)
    DEVICE=$(grep "ro.product.device" /system/build.prop 2>/dev/null | cut -d= -f2)
    info "Model: $MODEL"
    info "Device: $DEVICE"
fi

# CPU
if [ -f "/proc/cpuinfo" ]; then
    CPU=$(grep "Hardware" /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs)
    [ -z "$CPU" ] && CPU=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs)
    info "CPU: $CPU"
fi

# GPU (Adreno)
if [ -d "/sys/class/kgsl" ]; then
    GPU_MODEL=$(cat /sys/class/kgsl/kgsl-3d0/gpu_model 2>/dev/null || echo "unknown")
    GPU_FREQ=$(cat /sys/class/kgsl/kgsl-3d0/max_gpuclk 2>/dev/null || echo "unknown")
    pass "GPU: Adreno ($GPU_MODEL) @ $GPU_FREQ Hz"
else
    warn "GPU info not available at /sys/class/kgsl"
fi

# RAM
MEM_TOTAL=$(grep "MemTotal" /proc/meminfo 2>/dev/null | awk '{print $2}')
if [ -n "$MEM_TOTAL" ]; then
    MEM_GB=$((MEM_TOTAL / 1024 / 1024))
    pass "RAM: ${MEM_GB}GB (${MEM_TOTAL}kB)"
fi

# USB OTG
if lsusb &>/dev/null; then
    USB_DEVICES=$(lsusb 2>/dev/null)
    if [ -n "$USB_DEVICES" ]; then
        pass "USB devices detected:"
        echo "$USB_DEVICES" | head -5 | sed 's/^/    /'
    else
        info "No USB devices connected (OTG cable needed for sSDR)"
    fi
elif [ -d "/sys/bus/usb/devices" ]; then
    USB_COUNT=$(ls /sys/bus/usb/devices/ 2>/dev/null | wc -l)
    info "USB subsystem: $USB_COUNT devices"
else
    warn "USB detection not available"
fi

# ─── SDR Detection ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}── SDR Hardware ──${NC}"

# Check for common SDR devices
if [ -e "/dev/bus/usb" ]; then
    pass "USB bus accessible"
fi

# RTL-SDR
if command -v rtl_test &>/dev/null || [ -e "/usr/bin/rtl_test" ]; then
    pass "RTL-SDR tools found"
    rtl_test -t 2>&1 | head -3 | sed 's/^/    /' || true
else
    info "RTL-SDR tools not installed"
fi

# HackRF
if command -v hackrf_info &>/dev/null; then
    pass "HackRF tools found"
    hackrf_info 2>&1 | head -5 | sed 's/^/    /' || true
else
    info "HackRF tools not installed"
fi

# SoapySDR
if command -v SoapySDRUtil &>/dev/null; then
    pass "SoapySDR found"
    SoapySDRUtil --find 2>&1 | head -5 | sed 's/^/    /' || true
else
    info "SoapySDR not installed"
fi

# UHD (USRP)
if command -v uhd_find_devices &>/dev/null; then
    pass "UHD found"
else
    info "UHD not installed"
fi

# Wavelet Lab sSDR
if [ -d "/opt/wavelet" ] || [ -d "$HOME/wavelet" ] || [ -d "/usr/local/lib/wavelet" ]; then
    pass "Wavelet Lab sSDR software found"
elif command -v wlm &>/dev/null; then
    pass "Wavelet Lab CLI found"
else
    warn "Wavelet Lab sSDR not detected"
    info "Check: ls /opt/wavelet /usr/local/lib/wavelet"
fi

# ─── srsRAN Detection ──────────────────────────────────────────
echo ""
echo -e "${CYAN}── srsRAN ──${NC}"

if command -v srsenb &>/dev/null; then
    pass "srsRAN eNB found"
    srsenb --version 2>&1 | head -1 | sed 's/^/    /' || true
elif [ -f "/usr/local/bin/srsenb" ]; then
    pass "srsRAN eNB at /usr/local/bin/srsenb"
elif [ -f "/opt/srsran/bin/srsenb" ]; then
    pass "srsRAN eNB at /opt/srsran/bin/srsenb"
else
    warn "srsRAN eNB not found"
fi

if command -v srsue &>/dev/null; then
    pass "srsRAN UE found"
elif [ -f "/usr/local/bin/srsue" ]; then
    pass "srsRAN UE at /usr/local/bin/srsue"
else
    info "srsRAN UE not found (optional)"
fi

if command -v srsran_rrc &>/dev/null || [ -f "/usr/local/lib/libsrsran_rrc.so" ]; then
    pass "srsRAN RRC library found"
fi

# Check for srsRAN config files
if [ -d "$HOME/.config/srsran" ] || [ -d "/etc/srsran" ]; then
    pass "srsRAN config directory found"
    ls "$HOME/.config/srsran" 2>/dev/null | head -5 | sed 's/^/    /' || true
    ls "/etc/srsran" 2>/dev/null | head -5 | sed 's/^/    /' || true
fi

# ─── OpenCL / GPU Compute ──────────────────────────────────────
echo ""
echo -e "${CYAN}── OpenCL / GPU Compute ──${NC}"

if command -v clinfo &>/dev/null; then
    pass "clinfo found"
    clinfo --list 2>&1 | head -5 | sed 's/^/    /' || true
else
    info "clinfo not installed"
fi

# Check for Adreno OpenCL ICD
if [ -f "/etc/OpenCL/vendors/adreno.icd" ] || [ -f "/system/vendor/etc/OpenCL/vendors/*.icd" ]; then
    pass "Adreno OpenCL ICD found"
elif ls /system/vendor/etc/OpenCL/vendors/*.icd 2>/dev/null; then
    pass "OpenCL vendor ICD found"
else
    warn "Adreno OpenCL ICD not found"
    info "JCAS fusion kernel needs OpenCL on Adreno"
fi

if [ -f "/usr/lib/libOpenCL.so" ] || [ -f "/system/vendor/lib64/libOpenCL.so" ]; then
    pass "OpenCL library found"
fi

# ─── Network ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Network ──${NC}"

# Current IP
IP_ADDR=$(ip addr show wlan0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
if [ -n "$IP_ADDR" ]; then
    pass "WiFi IP: $IP_ADDR"
else
    IP_ADDR=$(ifconfig wlan0 2>/dev/null | grep "inet " | awk '{print $2}')
    [ -n "$IP_ADDR" ] && pass "WiFi IP: $IP_ADDR" || warn "WiFi IP not found"
fi

# Check mesh connectivity
if curl -s --connect-timeout 2 http://10.0.0.175:9043/status &>/dev/null; then
    pass "S26 Ultra (10.0.0.175:9043) reachable"
else
    warn "S26 Ultra not reachable"
fi

if curl -s --connect-timeout 2 http://127.0.0.1:9042/status &>/dev/null; then
    pass "S25 API (127.0.0.1:9042) running"
else
    info "S25 API not running on 9042"
fi

# ─── Python Environment ────────────────────────────────────────
echo ""
echo -e "${CYAN}── Python ──${NC}"

PYTHON_VER=$(python3 --version 2>&1)
pass "Python: $PYTHON_VER"

# Check key packages
for pkg in numpy scipy matplotlib requests websocket-client; do
    python3 -c "import $pkg" 2>/dev/null && pass "pip: $pkg" || info "pip: $pkg not installed"
done

# ─── Agent-X ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Agent-X ──${NC}"

if [ -d "$HOME/Agent-X" ]; then
    pass "Agent-X directory found"
    if [ -f "$HOME/Agent-X/src/quantum/__init__.py" ]; then
        pass "Quantum module found"
    fi
    if [ -f "$HOME/Agent-X/src/appless/server.py" ]; then
        pass "Appless module found"
    fi
else
    warn "Agent-X not found at ~/Agent-X"
fi

# ─── Summary ────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}  ${YELLOW}Warnings: $WARN${NC}              ║"
echo "╠══════════════════════════════════════════════════════════╣"

if [ $FAIL -eq 0 ]; then
    echo -e "║  ${GREEN}✅ S25 ULTRA READY${NC}                                    ║"
else
    echo -e "║  ${YELLOW}⚠️  $FAIL ITEMS NEED ATTENTION${NC}                          ║"
fi

echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next: Run inside proot Ubuntu for full detection:"
echo "  proot-distro login ubuntu"
echo "  bash s25_diagnostic.sh"
