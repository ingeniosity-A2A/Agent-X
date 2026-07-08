#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SIF AVA007 — Non-Root Runtime Bootstrap
#  S25 Ultra (Termux + Proot Ubuntu)
#  No root required — S25 as reasoning hub, peripherals for RF
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
step() { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

BASE="$HOME/Agent-X"

step "SIF AVA007 — Non-Root Bootstrap"

# ─── 1. Termux Packages ─────────────────────────────────────────
step "1. Termux Packages"

pkg update -y 2>/dev/null
for p in python git nodejs cmake make pkg-config \
         libusb libusb-dev socat nmap \
         termux-api termux-tools; do
    pkg install -y $p 2>/dev/null || true
done
log "Termux packages installed"

# ─── 2. Python Dependencies ─────────────────────────────────────
step "2. Python Dependencies"

pip install --quiet --break-system-packages \
    requests \
    websockets \
    aiohttp \
    numpy \
    bleak \
    pyserial \
    2>/dev/null || pip install --quiet requests websockets aiohttp numpy bleak pyserial 2>/dev/null

log "Python packages installed"

# ─── 3. Proot Ubuntu (for srsRAN/sSDR builds) ──────────────────
step "3. Proot Ubuntu"

if ! command -v proot-distro &>/dev/null; then
    pkg install -y proot-distro 2>/dev/null
fi

if proot-distro list 2>/dev/null | grep -q "ubuntu.*installed"; then
    log "Ubuntu already installed"
else
    log "Installing Ubuntu in proot..."
    proot-distro install ubuntu 2>/dev/null || warn "Ubuntu install may have failed"
fi

log "Proot ready: proot-distro login ubuntu"

# ─── 4. Agent-X Structure ───────────────────────────────────────
step "4. Agent-X Directory"

cd "$BASE"
mkdir -p src/quantum src/appless src/runtime
mkdir -p data/sms data/vcf data/corpus
mkdir -p logs/quantum logs/mesh
mkdir -p models/destiny-4b
mkdir -p .openclaw/tmp
log "Directory structure ready"

# ─── 5. Create Non-Root Scripts ─────────────────────────────────
step "5. Non-Root Runtime Scripts"

# --- Reasoning Core (llama.cpp / ollama) ---
cat > "$BASE/run_reasoning.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🧠 SIF AVA007 Reasoning Core"

# Check for ollama
if command -v ollama &>/dev/null; then
    echo "Starting ollama serve..."
    ollama serve &>/dev/null &
    sleep 3
    
    if ! ollama list 2>/dev/null | grep -q "destiny-4b"; then
        echo "Creating destiny-4b..."
        ollama create destiny-4b -f models/destiny-4b/Modelfile 2>/dev/null
    fi
    
    echo "Running Destiny-4B..."
    ollama run destiny-4b "$@"
elif [ -f "models/destiny-4b/Destiny-4B-Q4_K_M.gguf" ]; then
    echo "Ollama not found. Install: pkg install ollama"
    echo "Or use llama.cpp directly:"
    echo "  ./llama-cli -m models/destiny-4b/Destiny-4B-Q4_K_M.gguf"
else
    echo "No model found. Run merge_destiny.sh or download GGUF."
fi
EOF
chmod +x "$BASE/run_reasoning.sh"

# --- Quantum Harness (Zero Latency) ---
cat > "$BASE/run_quantum.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "⚛ Quantum Harness — Zero Latency"
python3 -m src.quantum.zero_latency_harness
EOF
chmod +x "$BASE/run_quantum.sh"

# --- SMS Bridge (Termux API) ---
cat > "$BASE/run_sms.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📱 SMS Bridge (Termux API)"
echo "Polling for new SMS..."
python3 -m src.quantum.termux_bridge
EOF
chmod +x "$BASE/run_sms.sh"

# --- API Server ---
cat > "$BASE/run_api.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🌐 Agent-X API Server (port 7474)"
python3 -m src.api_server
EOF
chmod +x "$BASE/run_api.sh"

# --- Appless Care Server ---
cat > "$BASE/run_appless.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📇 Appless Care Server (port 7476)"
MERCURY_API_KEY="${MERCURY_API_KEY:-}" python3 -m src.appless.server
EOF
chmod +x "$BASE/run_appless.sh"

# --- Flipper Zero Dispatch ---
cat > "$BASE/run_flipper.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📡 Flipper Zero Dispatch"
python3 -c "
from src.quantum import FlipperEncoder, QuantumBuilder
encoder = FlipperEncoder()
q = QuantumBuilder().source('did:s25ultra').intent('dispatch').payload({'action': 'test'}).build()
cmd = encoder.encode_quantum(q)
print(f'Command: {cmd.name}')
print(f'Protocol: {cmd.signals[0].protocol.value}')
print(cmd.to_flipper_file())
"
EOF
chmod +x "$BASE/run_flipper.sh"

# --- LoRa Mesh Node ---
cat > "$BASE/run_mesh.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📡 LoRa Mesh Node"
python3 -c "
from src.quantum import LoRaMeshProtocol, MeshNode
mesh = LoRaMeshProtocol('did:s25ultra:orchestrator')
print(f'Node: {mesh.local_did}')
print(f'Transport: {mesh.transport.value}')
print('Ready for mesh connections.')
print('Add neighbors: mesh.router.add_neighbor(MeshNode(...))')
"
EOF
chmod +x "$BASE/run_mesh.sh"

# --- Environment Scan ---
cat > "$BASE/run_envscan.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🔍 Environment Scan (Termux Sensors)"
python3 -c "
from src.quantum import TermuxHardwareBridge
bridge = TermuxHardwareBridge()
loc = bridge.location.get()
battery = bridge.battery.status()
print(f'Location: {loc}')
print(f'Battery: {battery}')
" 2>/dev/null || echo "Termux API not available"
EOF
chmod +x "$BASE/run_envscan.sh"

# --- UWB Ranging (Android API) ---
cat > "$BASE/run_uwb.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📡 UWB Status Check"

# Check UWB feature
if pm list features 2>/dev/null | grep -q "uwb"; then
    echo "✓ UWB feature available"
else
    echo "⚠ UWB feature not found via pm"
fi

# Check UWB service
if dumpsys uwb 2>/dev/null | head -5; then
    echo "✓ UWB service running"
else
    echo "⚠ UWB service not accessible (may need ADB)"
fi

# Check properties
getprop 2>/dev/null | grep -i uwb | head -5

echo ""
echo "UWB ranging requires Android UWB API (API level 31+)"
echo "For cross-device ranging, use the companion app approach."
EOF
chmod +x "$BASE/run_uwb.sh"

log "All run scripts created"

# ─── 6. Create Quick Reference ──────────────────────────────────
step "6. Quick Reference"

cat > "$BASE/QUICKREF.md" << 'QR'
# SIF AVA007 — Quick Reference

## Non-Root Runtime Scripts

| Script | What it does |
|--------|-------------|
| `./run_reasoning.sh` | Start Destiny-4B via ollama |
| `./run_quantum.sh` | Zero Latency Quantum Harness |
| `./run_sms.sh` | SMS bridge (Termux API) |
| `./run_api.sh` | API server (port 7474) |
| `./run_appless.sh` | Appless VCF care (port 7476) |
| `./run_flipper.sh` | Flipper Zero commands |
| `./run_mesh.sh` | LoRa mesh node |
| `./run_envscan.sh` | Environment scan (GPS, battery) |
| `./run_uwb.sh` | UWB status check |

## Architecture

```
S25 Ultra (Orchestrator)
├── Reasoning: Destiny-4B (ollama/llama.cpp)
├── Quantum: Zero Latency Harness (6-layer)
├── Memory: TashiDAG + TaskMemory + MemoryLake
├── SMS: Termux API bridge
├── Care: Appless VCF server
└── Dispatch: Flipper / LoRa / UWB → external RF

S26 Ultra (Mesh Node)
├── Syncs with S25 via mesh
├── Identity: SIF-Mesh-Sovereign
└── Role: Distributed RF sensor
```

## External RF Peripherals

| Device | Protocol | Use Case |
|--------|----------|----------|
| Flipper Zero | Sub-GHz (315/433/915 MHz) | Gates, sensors, relays |
| LoRa node | LoRa/FSK (868/915 MHz) | Long-range mesh |
| RTL-SDR | Receive only | Spectrum monitoring |
| NanoVNA | USB | Antenna calibration |

## Non-Root Limitations

| Feature | Root Required? | Alternative |
|---------|---------------|-------------|
| Reasoning Core | No | ollama/llama.cpp |
| Quantum Harness | No | Python in Termux |
| SMS Bridge | No | Termux API |
| UWB Ranging | No | Android UWB API |
| Raw RF TX/RX | **Yes** | Flipper Zero / LoRa |
| Spectrum Sensing | **Yes** | RTL-SDR (receive) |
| Driver Decouple | **Yes** | External peripherals |
QR

log "Quick reference: QUICKREF.md"

# ─── Summary ─────────────────────────────────────────────────────
step "Bootstrap Complete!"

echo ""
echo "Run scripts:"
echo "  ./run_reasoning.sh   # AI reasoning"
echo "  ./run_quantum.sh     # Quantum harness"
echo "  ./run_sms.sh         # SMS bridge"
echo "  ./run_api.sh         # API server"
echo "  ./run_uwb.sh         # UWB check"
echo ""
echo "For srsRAN/sSDR builds:"
echo "  proot-distro login ubuntu"
echo ""

# --- Quantum Fetch (Model Acquisition) ---
cat > "$BASE/run_fetch.sh" << 'FETCH'
#!/bin/bash
cd "$(dirname "$0")"
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./run_fetch.sh <repo_id> <filename>"
    echo ""
    echo "Examples:"
    echo "  ./run_fetch.sh prithivMLmods/VibeThinker-3B-GGUF VibeThinker-3B.Q4_K_M.gguf"
    echo "  ./run_fetch.sh --list"
    echo "  ./run_fetch.sh --stats"
    exit 1
fi
python3 -m src.quantum.quantum_fetch "$1" "$2"
FETCH
chmod +x "$BASE/run_fetch.sh"
