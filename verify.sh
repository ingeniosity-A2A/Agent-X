#!/bin/bash
# SIF AVA-007 Runtime Verification — Agent-X Quantum Runtime

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

BASE="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════╗"
echo "║  SIF AVA-007 Runtime Verification            ║"
echo "║  Agent-X Quantum Runtime                     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Directory Structure ─────────────────────────────────────────
echo -e "${CYAN}── Directory Structure ──${NC}"

DIRS=(
    "src/runtime/governance"
    "src/execution"
    "src/discovery"
    "src/gpu"
    "src/tvm"
    "src/telecom/srsran"
    "src/memory"
    "src/quantum"
    "secure"
    "secure/keys"
    "secure/tokens"
    "logs"
    "logs/quantum"
    "logs/mesh"
    "logs/beeper"
    "data"
    "data/corpus"
    "data/sms"
    "data/vcf"
)

for d in "${DIRS[@]}"; do
    [ -d "$BASE/$d" ] && pass "Directory: $d" || fail "Directory: $d"
done

# ─── Python Modules ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Python Modules ──${NC}"

MODULES=(
    "src/quantum/__init__.py"
    "src/quantum/quantum.py"
    "src/quantum/crypto.py"
    "src/quantum/dag.py"
    "src/quantum/memory_lake.py"
    "src/quantum/task_memory.py"
    "src/quantum/gsap.py"
    "src/quantum/rf_physical.py"
    "src/quantum/lora_mesh.py"
    "src/quantum/flipper.py"
    "src/quantum/vfile.py"
    "src/quantum/beeper_bridge.py"
    "src/quantum/termux_bridge.py"
    "src/quantum/sms_bridge.py"
    "src/quantum/zero_latency_harness.py"
    "src/appless/__init__.py"
    "src/appless/vcf_generator.py"
    "src/appless/server.py"
    "src/harness.py"
    "src/patterns.py"
    "src/reflex_router.py"
    "src/skill_arena.py"
    "src/tier_router.py"
    "src/config.py"
)

for f in "${MODULES[@]}"; do
    [ -f "$BASE/$f" ] && pass "Module: $f" || fail "Module: $f"
done

# ─── Python Import Test ──────────────────────────────────────────
echo ""
echo -e "${CYAN}── Python Import Test ──${NC}"

cd "$BASE"

cd "$BASE"
python3 -c "from src.quantum import InteractionQuantum, QuantumBuilder; print('OK')" 2>/dev/null && pass "Import: core quantum" || fail "Import: core quantum"
python3 -c "from src.quantum import TashiDAG, AtomicMemoryLake; print('OK')" 2>/dev/null && pass "Import: storage" || fail "Import: storage"
python3 -c "from src.quantum import GriptapeTaskMemory; print('OK')" 2>/dev/null && pass "Import: task memory" || fail "Import: task memory"
python3 -c "from src.quantum import LoRaMeshProtocol, ChaCha20; print('OK')" 2>/dev/null && pass "Import: lora mesh" || fail "Import: lora mesh"
python3 -c "from src.quantum import FlipperEncoder; print('OK')" 2>/dev/null && pass "Import: flipper" || fail "Import: flipper"
python3 -c "from src.quantum import VFile, MatrixClient; print('OK')" 2>/dev/null && pass "Import: vfile" || fail "Import: vfile"
python3 -c "from src.quantum import ZeroLatencyHarness; print('OK')" 2>/dev/null && pass "Import: zero latency harness" || fail "Import: zero latency harness"
python3 -c "from src.quantum import TermuxHardwareBridge; print('OK')" 2>/dev/null && pass "Import: termux bridge" || fail "Import: termux bridge"
python3 -c "from src.quantum import BeeperQuantumBridge; print('OK')" 2>/dev/null && pass "Import: beeper bridge" || fail "Import: beeper bridge"

# ─── Functional Tests ────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Functional Tests ──${NC}"

# Quantum creation
python3 -c "
from src.quantum import QuantumBuilder
q = (QuantumBuilder()
    .source('did:helpassembly:test:001')
    .intent('test', confidence=0.99)
    .payload({'test': True})
    .build())
assert q.verify_hash(), 'Hash mismatch'
print('OK')
" 2>/dev/null && pass "Quantum: create + verify hash" || fail "Quantum: create + verify hash"

# Signing
python3 -c "
from src.quantum import QuantumBuilder, QuantumSigner, QuantumVerifier
q = (QuantumBuilder().source('did:test').intent('test').build())
signer, pub = QuantumSigner.generate('did:test')
q.lineage_signature = signer.sign_quantum(q)
assert QuantumVerifier.verify_signature(q, signer._key), 'Signature invalid'
print('OK')
" 2>/dev/null && pass "Crypto: sign + verify" || fail "Crypto: sign + verify"

# DAG
python3 -c "
from src.quantum import QuantumBuilder, TashiDAG
q1 = QuantumBuilder().source('did:test').intent('a').build()
q2 = QuantumBuilder().source('did:test').parent(q1.quantum_id).intent('b').build()
dag = TashiDAG()
dag.add(q1); dag.add(q2)
assert dag.size() == 2
assert dag.depth() == 1
print('OK')
" 2>/dev/null && pass "DAG: add + lineage" || fail "DAG: add + lineage"

# TaskMemory
python3 -c "
from src.quantum import QuantumBuilder, GriptapeTaskMemory
q = QuantumBuilder().source('did:test').intent('test').build()
mem = GriptapeTaskMemory('/tmp/test_tm')
mem.store(q)
results = mem.search(intent='test')
assert len(results) > 0
print('OK')
" 2>/dev/null && pass "TaskMemory: store + search" || fail "TaskMemory: store + search"

# ChaCha20
python3 -c "
from src.quantum import ChaCha20
key = b'\\x00' * 32; nonce = b'\\x00' * 12
c = ChaCha20(key, nonce)
pt = b'Hello Quantum'
ct = c.encrypt(pt)
dt = c.decrypt(ct)
assert pt == dt
print('OK')
" 2>/dev/null && pass "ChaCha20: encrypt + decrypt" || fail "ChaCha20: encrypt + decrypt"

# Flipper
python3 -c "
from src.quantum import QuantumBuilder, FlipperEncoder
q = QuantumBuilder().source('did:test').intent('dispatch').payload({'gate':'main'}).build()
enc = FlipperEncoder()
cmd = enc.encode_quantum(q)
assert len(cmd.signals) > 0
print('OK')
" 2>/dev/null && pass "Flipper: encode quantum" || fail "Flipper: encode quantum"

# VFile
python3 -c "
from src.quantum import QuantumBuilder, VFile
q = QuantumBuilder().source('did:test').intent('test').build()
vf = VFile.wrap_quantum(q)
assert vf.vfile_version == '2.0'
assert vf.fingerprint() is not None
print('OK')
" 2>/dev/null && pass "VFile: wrap quantum" || fail "VFile: wrap quantum"

# Harness
python3 -c "
from src.quantum import ZeroLatencyHarness
h = ZeroLatencyHarness()
r = h.process('test query', {})
assert r['tier'] in ('reflex','quantum','skill','memory','lineage','mercury','fallback')
print('OK')
" 2>/dev/null && pass "Harness: process query" || fail "Harness: process query"

# ─── Runtime Stats ───────────────────────────────────────────────
echo ""
echo -e "${CYAN}── Runtime Stats ──${NC}"

python3 -c "
from src.quantum import ZeroLatencyHarness
h = ZeroLatencyHarness()
for q in ['dispatch tech', 'quote price', 'schedule tomorrow', 'send invoice']:
    h.process(q, {})
s = h.get_stats()
print(f'  Quanta: {s[\"quanta_created\"]}')
print(f'  Zero token: {s[\"zero_token_pct\"]}')
print(f'  Avg latency: {s[\"avg_ms\"]}ms')
print(f'  DAG: {s[\"dag\"][\"vertices\"]} vertices, depth {s[\"dag\"][\"depth\"]}')
" 2>&1 | sed 's/^/  /'

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo -e "║  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}  ${YELLOW}Warnings: $WARN${NC}         ║"
echo "╠══════════════════════════════════════════════╣"

if [ $FAIL -eq 0 ]; then
    echo -e "║  ${GREEN}✅ ALL SYSTEMS OPERATIONAL${NC}                   ║"
else
    echo -e "║  ${RED}❌ $FAIL CHECKS FAILED${NC}                         ║"
fi

echo "╚══════════════════════════════════════════════╝"

exit $FAIL
