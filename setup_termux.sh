#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Agent-X Termux Setup Script
#  Run this on your Android/Termux device
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

AGENT_X_DIR="$HOME/Agent-X"

step "Agent-X Termux Setup"

# ─── 1. Check we're in Termux ───────────────────────────────────
if [ ! -d "/data/data/com.termux" ]; then
    warn "This script is designed for Termux on Android"
fi

# ─── 2. Install dependencies ────────────────────────────────────
step "Installing Termux Dependencies"

pkg update -y 2>/dev/null
pkg install -y python git cmake make 2>/dev/null || true

pip install --quiet requests huggingface_hub 2>/dev/null || {
    warn "pip install had issues, trying with --break-system-packages"
    pip install --quiet --break-system-packages requests huggingface_hub 2>/dev/null || true
}

log "Dependencies installed"

# ─── 3. Clone Agent-X if not present ────────────────────────────
step "Setting Up Agent-X"

if [ -d "$AGENT_X_DIR/.git" ]; then
    log "Agent-X already cloned at $AGENT_X_DIR"
    cd "$AGENT_X_DIR"
    git pull 2>/dev/null || true
else
    log "Cloning Agent-X..."
    cd "$HOME"
    git clone https://github.com/ingeniosity-A2A/Agent-X.git 2>/dev/null || {
        warn "Clone failed — creating local structure"
        mkdir -p "$AGENT_X_DIR"
        cd "$AGENT_X_DIR"
    }
fi

cd "$AGENT_X_DIR"
log "Working directory: $(pwd)"

# ─── 4. Create directory structure ──────────────────────────────
step "Creating Directory Structure"

mkdir -p src/quantum src/appless src/runtime/governance src/execution
mkdir -p src/discovery src/gpu src/tvm src/telecom/srsran src/memory
mkdir -p secure/keys secure/tokens
mkdir -p logs/quantum logs/mesh logs/beeper
mkdir -p data/corpus data/sms data/vcf
mkdir -p models/destiny-4b
mkdir -p .openclaw/tmp

log "Directories created"

# ─── 5. Verify Python modules ───────────────────────────────────
step "Verifying Python Modules"

MODULES=(
    "src/quantum/__init__.py"
    "src/quantum/quantum.py"
    "src/quantum/zero_latency_harness.py"
    "src/quantum/termux_bridge.py"
    "src/quantum/sms_bridge.py"
    "src/quantum/beeper_bridge.py"
    "src/quantum/lora_mesh.py"
    "src/quantum/flipper.py"
    "src/quantum/vfile.py"
    "src/appless/vcf_generator.py"
    "src/appless/server.py"
    "src/harness.py"
    "src/config.py"
)

PASS=0
FAIL=0
for f in "${MODULES[@]}"; do
    if [ -f "$AGENT_X_DIR/$f" ]; then
        log "$f"
        PASS=$((PASS+1))
    else
        warn "$f — missing"
        FAIL=$((FAIL+1))
    fi
done

echo ""
echo "Modules: $PASS found, $FAIL missing"

# ─── 6. Test Python imports ─────────────────────────────────────
step "Testing Python Imports"

cd "$AGENT_X_DIR"

python3 -c "from src.quantum import QuantumBuilder; print('OK')" 2>/dev/null && log "Core quantum" || warn "Core quantum import failed"
python3 -c "from src.quantum import ZeroLatencyHarness; print('OK')" 2>/dev/null && log "Zero Latency Harness" || warn "Harness import failed"
python3 -c "from src.quantum import TermuxHardwareBridge; print('OK')" 2>/dev/null && log "Termux bridge" || warn "Termux bridge import failed"
python3 -c "from src.quantum import FlipperEncoder; print('OK')" 2>/dev/null && log "Flipper encoder" || warn "Flipper import failed"
python3 -c "from src.quantum import LoRaMeshProtocol; print('OK')" 2>/dev/null && log "LoRa mesh" || warn "LoRa import failed"
python3 -c "from src.quantum import VFile; print('OK')" 2>/dev/null && log "VFile" || warn "VFile import failed"

# ─── 7. Start Ollama ────────────────────────────────────────────
step "Setting Up Ollama"

if command -v ollama &>/dev/null; then
    log "Ollama installed"
    
    # Start ollama serve in background
    ollama serve &>/dev/null &
    sleep 3
    
    if ollama list &>/dev/null; then
        log "Ollama server running"
    else
        warn "Ollama server not responding — may need manual start"
        echo "  Run: ollama serve"
    fi
else
    warn "Ollama not installed"
    echo "  Install: pkg install ollama"
fi

# ─── 8. Create run scripts ──────────────────────────────────────
step "Creating Run Scripts"

# API server runner
cat > "$AGENT_X_DIR/run_api.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Agent-X API on port 7474..."
python3 -m src.api_server
RUNEOF
chmod +x "$AGENT_X_DIR/run_api.sh"

# Agent loop runner
cat > "$AGENT_X_DIR/run_agent.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Agent-X interactive agent..."
python3 -m src.agent_loop
RUNEOF
chmod +x "$AGENT_X_DIR/run_agent.sh"

# SMS daemon runner
cat > "$AGENT_X_DIR/run_sms.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Termux SMS daemon..."
python3 -m src.quantum.termux_bridge
RUNEOF
chmod +x "$AGENT_X_DIR/run_sms.sh"

# Beeper bridge runner
cat > "$AGENT_X_DIR/run_beeper.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ -z "$BEEPER_ACCESS_TOKEN" ]; then
    echo "Error: BEEPER_ACCESS_TOKEN not set"
    echo "  export BEEPER_ACCESS_TOKEN='your_token'"
    exit 1
fi
echo "Starting Beeper bridge..."
python3 -m src.quantum.beeper_bridge
RUNEOF
chmod +x "$AGENT_X_DIR/run_beeper.sh"

# Benchmark runner
cat > "$AGENT_X_DIR/run_benchmark.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Running Zero Latency Harness benchmark..."
python3 -m src.quantum.zero_latency_harness
RUNEOF
chmod +x "$AGENT_X_DIR/run_benchmark.sh"

# Ollama Destiny runner
cat > "$AGENT_X_DIR/run_destiny.sh" << 'RUNEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Ollama with Destiny-4B..."

# Start ollama if not running
if ! ollama list &>/dev/null; then
    echo "Starting ollama serve..."
    ollama serve &>/dev/null &
    sleep 3
fi

# Create model if not exists
if ! ollama list 2>/dev/null | grep -q "destiny-4b"; then
    echo "Creating destiny-4b model..."
    ollama create destiny-4b -f models/destiny-4b/Modelfile
fi

echo "Running Destiny-4B..."
ollama run destiny-4b "$@"
RUNEOF
chmod +x "$AGENT_X_DIR/run_destiny.sh"

log "Run scripts created"

# ─── 9. Print usage ─────────────────────────────────────────────
step "Setup Complete!"

echo ""
echo "Usage:"
echo ""
echo "  # API server (port 7474)"
echo "  ./run_api.sh"
echo ""
echo "  # Interactive agent"
echo "  ./run_agent.sh"
echo ""
echo "  # SMS daemon"
echo "  ./run_sms.sh"
echo ""
echo "  # Beeper bridge"
echo "  export BEEPER_ACCESS_TOKEN='token'"
echo "  ./run_beeper.sh"
echo ""
echo "  # Benchmark"
echo "  ./run_benchmark.sh"
echo ""
echo "  # Destiny-4B via Ollama"
echo "  ./run_destiny.sh 'Dispatch tech Marcus'"
echo ""
echo "  # Or run modules directly:"
echo "  cd ~/Agent-X"
echo "  python3 -m src.quantum.zero_latency_harness"
echo ""
