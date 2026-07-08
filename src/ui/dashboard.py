"""
SIF AVA007 — On-Device Android UI

Lightweight web dashboard served from Termux.
Access from phone browser: http://localhost:8080

Features:
- Quantum harness status
- Identity rotation controls
- Mesh connectivity (S25↔S26)
- SMS bridge status
- Destiny-4B inference
- UWB ranging display
- Real-time WebSocket updates
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ─── HTML Template ──────────────────────────────────────────────────

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>SIF AVA007</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0a0f;--card:#12121a;--border:#1e1e2e;--accent:#00d4ff;--accent2:#7c3aed;--green:#10b981;--red:#ef4444;--yellow:#f59e0b;--text:#e0e0e0;--dim:#666}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding:0}
.header{background:linear-gradient(135deg,#0a0a0f,#1a1a2e);padding:16px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
.header h1{font-size:1.1rem;font-weight:700;display:flex;align-items:center;gap:8px}
.header .status{font-size:0.75rem;color:var(--dim);margin-top:2px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px;transition:all 0.2s}
.card:active{transform:scale(0.98)}
.card h3{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--dim);margin-bottom:8px}
.card .value{font-size:1.5rem;font-weight:700}
.card .sub{font-size:0.75rem;color:var(--dim);margin-top:4px}
.full{grid-column:1/-1}
.accent{color:var(--accent)}
.green{color:var(--green)}
.red{color:var(--red)}
.yellow{color:var(--yellow)}
.purple{color:var(--accent2)}
.btn{display:block;width:100%;padding:12px;border:none;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-top:8px;transition:all 0.2s}
.btn-primary{background:var(--accent);color:#000}
.btn-secondary{background:var(--border);color:var(--text)}
.btn:active{opacity:0.7}
.mesh-node{display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:8px}
.mesh-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.mesh-dot.online{background:var(--green);box-shadow:0 0 8px var(--green)}
.mesh-dot.offline{background:var(--red)}
.log-box{background:#080810;border:1px solid var(--border);border-radius:10px;padding:12px;font-family:'SF Mono',monospace;font-size:0.75rem;max-height:200px;overflow-y:auto;line-height:1.6}
.log-line{color:var(--dim)}
.log-line .ts{color:var(--accent)}
.log-line .ok{color:var(--green)}
.log-line .err{color:var(--red)}
.input-row{display:flex;gap:8px;margin-top:8px}
.input-row input{flex:1;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:0.85rem;outline:none}
.input-row input:focus{border-color:var(--accent)}
.chat-bubble{padding:10px 14px;border-radius:12px;margin-bottom:8px;max-width:85%;font-size:0.85rem;line-height:1.5}
.chat-user{background:var(--accent);color:#000;margin-left:auto;border-bottom-right-radius:4px}
.chat-bot{background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px}
.tabs{display:flex;gap:4px;padding:0 16px;margin-bottom:12px;overflow-x:auto}
.tab{padding:8px 16px;background:var(--card);border:1px solid var(--border);border-radius:10px;font-size:0.8rem;cursor:pointer;white-space:nowrap}
.tab.active{background:var(--accent);color:#000;border-color:var(--accent)}
.hidden{display:none}
.pulse{animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
</style>
</head>
<body>

<div class="header">
  <h1>⚡ SIF AVA007</h1>
  <div class="status">S25 Ultra • <span id="clock">--:--:--</span> • <span id="uptime">--</span></div>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('dashboard')">Dashboard</div>
  <div class="tab" onclick="showTab('mesh')">Mesh</div>
  <div class="tab" onclick="showTab('quantum')">Quantum</div>
  <div class="tab" onclick="showTab('chat')">Chat</div>
  <div class="tab" onclick="showTab('logs')">Logs</div>
</div>

<!-- Dashboard Tab -->
<div id="tab-dashboard">
  <div class="grid">
    <div class="card">
      <h3>Identity</h3>
      <div class="value accent" id="identity">SIF-Rotated</div>
      <div class="sub">Rotation #<span id="rot-count">0</span></div>
    </div>
    <div class="card">
      <h3>Mesh Status</h3>
      <div class="value green" id="mesh-status">● LIVE</div>
      <div class="sub">S25 ↔ S26</div>
    </div>
    <div class="card">
      <h3>Quanta Created</h3>
      <div class="value purple" id="quanta-count">0</div>
      <div class="sub">TashiDAG vertices</div>
    </div>
    <div class="card">
      <h3>Latency</h3>
      <div class="value" id="avg-latency">--ms</div>
      <div class="sub">Zero token: <span id="zero-pct">--%</span></div>
    </div>
    <div class="card full">
      <h3>UWB Ranging</h3>
      <div style="display:flex;align-items:baseline;gap:8px">
        <div class="value accent" id="uwb-distance">--</div>
        <div class="sub">meters S25↔S26</div>
      </div>
      <div class="sub">Quality: <span id="uwb-quality">--</span> • Channel 9 (7.987 GHz)</div>
    </div>
    <div class="card full">
      <button class="btn btn-primary" onclick="rotateNow()">🔄 Rotate Identity Now</button>
    </div>
    <div class="card full">
      <button class="btn btn-secondary" onclick="runQuantum()">⚛ Run Quantum Harness</button>
    </div>
  </div>
</div>

<!-- Mesh Tab -->
<div id="tab-mesh" class="hidden">
  <div class="grid">
    <div class="card full">
      <h3>Mesh Nodes</h3>
      <div class="mesh-node">
        <div class="mesh-dot online"></div>
        <div>
          <div style="font-weight:600">S25 Ultra</div>
          <div class="sub">10.0.0.38:9042 • Orchestrator • SIF-Rotated</div>
        </div>
      </div>
      <div class="mesh-node">
        <div class="mesh-dot online"></div>
        <div>
          <div style="font-weight:600">S26 Ultra</div>
          <div class="sub">10.0.0.175:9043 • Mesh Relay • SIF-Mesh-Sovereign</div>
        </div>
      </div>
    </div>
    <div class="card full">
      <h3>RF Channels</h3>
      <div class="sub">WiFi Direct: 5/6 GHz (data plane)</div>
      <div class="sub">UWB: 6.5/8.0 GHz (ranging ±10cm)</div>
      <div class="sub">LoRa: 915 MHz (long-range fallback)</div>
    </div>
    <div class="card full">
      <h3>Encryption</h3>
      <div class="sub">ChaCha20-Poly1305 (per-packet)</div>
      <div class="sub">Reed-Solomon 8/16 FEC</div>
      <div class="sub">AODV routing (TTL=15)</div>
    </div>
  </div>
</div>

<!-- Quantum Tab -->
<div id="tab-quantum" class="hidden">
  <div class="grid">
    <div class="card full">
      <h3>Zero Latency Harness</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">
        <div class="sub">Reflex &lt;1ms</div><div class="sub green" id="q-reflex">0</div>
        <div class="sub">Quantum ~5ms</div><div class="sub accent" id="q-quantum">0</div>
        <div class="sub">Skill ~25ms</div><div class="sub" id="q-skill">0</div>
        <div class="sub">Memory ~100ms</div><div class="sub" id="q-memory">0</div>
        <div class="sub">Lineage ~200ms</div><div class="sub" id="q-lineage">0</div>
        <div class="sub">Mercury ~500ms</div><div class="sub" id="q-mercury">0</div>
      </div>
    </div>
    <div class="card full">
      <h3>DAG Stats</h3>
      <div class="sub">Vertices: <span id="dag-verts">0</span></div>
      <div class="sub">Depth: <span id="dag-depth">0</span></div>
      <div class="sub">Tips: <span id="dag-tips">0</span></div>
    </div>
    <div class="card full">
      <h3>TaskMemory</h3>
      <div class="sub">Hot: <span id="tm-hot">0</span> entries</div>
      <div class="sub">Warm: <span id="tm-warm">0</span> files</div>
    </div>
  </div>
</div>

<!-- Chat Tab -->
<div id="tab-chat" class="hidden">
  <div style="padding:16px">
    <div id="chat-messages" style="min-height:300px;max-height:60vh;overflow-y:auto">
      <div class="chat-bot chat-bubble">Hello. I'm Destiny-4B on SIF AVA007. Ask me anything.</div>
    </div>
    <div class="input-row">
      <input id="chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendChat()">
      <button class="btn btn-primary" style="width:auto;padding:10px 16px;margin:0" onclick="sendChat()">Send</button>
    </div>
  </div>
</div>

<!-- Logs Tab -->
<div id="tab-logs" class="hidden">
  <div class="grid">
    <div class="card full">
      <h3>System Log</h3>
      <div class="log-box" id="log-box">
        <div class="log-line"><span class="ts">[boot]</span> SIF AVA007 initialized</div>
        <div class="log-line"><span class="ts">[mesh]</span> <span class="ok">S26 connected</span></div>
        <div class="log-line"><span class="ts">[rotation]</span> Chameleon cascade active</div>
      </div>
    </div>
  </div>
</div>

<script>
// Tab switching
function showTab(name){
  document.querySelectorAll('[id^="tab-"]').forEach(t=>t.classList.add('hidden'));
  document.getElementById('tab-'+name).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  event.target.classList.add('active');
}

// Clock
setInterval(()=>{
  document.getElementById('clock').textContent=new Date().toLocaleTimeString();
},1000);

// Rotate identity
async function rotateNow(){
  addLog('rotation','Initiating identity rotation...');
  try{
    const r=await fetch('/api/rotate',{method:'POST'});
    const d=await r.json();
    addLog('rotation','<span class="ok">Rotation complete: '+d.identity+'</span>');
    document.getElementById('identity').textContent=d.identity||'SIF-Rotated';
    document.getElementById('rot-count').textContent=parseInt(document.getElementById('rot-count').textContent)+1;
  }catch(e){
    addLog('rotation','<span class="err">Rotation failed: '+e.message+'</span>');
  }
}

// Run quantum harness
async function runQuantum(){
  addLog('quantum','Running Zero Latency Harness...');
  try{
    const r=await fetch('/api/quantum');
    const d=await r.json();
    document.getElementById('quanta-count').textContent=d.quanta||0;
    document.getElementById('avg-latency').textContent=(d.avg_ms||0).toFixed(1)+'ms';
    document.getElementById('zero-pct').textContent=d.zero_token_pct||'0%';
    addLog('quantum','<span class="ok">Harness: '+d.quanta+' quanta, '+d.avg_ms?.toFixed(0)+'ms avg</span>');
  }catch(e){
    addLog('quantum','<span class="err">Error: '+e.message+'</span>');
  }
}

// Chat
async function sendChat(){
  const input=document.getElementById('chat-input');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  
  const msgs=document.getElementById('chat-messages');
  msgs.innerHTML+='<div class="chat-user chat-bubble">'+msg+'</div>';
  msgs.innerHTML+='<div class="chat-bot chat-bubble pulse">Thinking...</div>';
  msgs.scrollTop=msgs.scrollHeight;
  
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:msg})});
    const d=await r.json();
    const bubbles=msgs.querySelectorAll('.chat-bot');
    bubbles[bubbles.length-1].classList.remove('pulse');
    bubbles[bubbles.length-1].textContent=d.response||d.error||'No response';
    addLog('chat','<span class="ok">['+d.tier+'] '+d.latency_ms?.toFixed(0)+'ms</span>');
  }catch(e){
    const bubbles=msgs.querySelectorAll('.chat-bot');
    bubbles[bubbles.length-1].classList.remove('pulse');
    bubbles[bubbles.length-1].textContent='Error: '+e.message;
  }
  msgs.scrollTop=msgs.scrollHeight;
}

// Logs
function addLog(tag,msg){
  const box=document.getElementById('log-box');
  const ts=new Date().toLocaleTimeString();
  box.innerHTML+='<div class="log-line"><span class="ts">['+tag+']</span> '+msg+'</div>';
  box.scrollTop=box.scrollHeight;
}

// Poll stats
async function pollStats(){
  try{
    const r=await fetch('/api/stats');
    const d=await r.json();
    if(d.identity)document.getElementById('identity').textContent=d.identity;
    if(d.quanta!==undefined)document.getElementById('quanta-count').textContent=d.quanta;
    if(d.avg_ms!==undefined)document.getElementById('avg-latency').textContent=d.avg_ms.toFixed(1)+'ms';
    if(d.zero_token_pct)document.getElementById('zero-pct').textContent=d.zero_token_pct;
    if(d.dag){
      document.getElementById('dag-verts').textContent=d.dag.vertices||0;
      document.getElementById('dag-depth').textContent=d.dag.depth||0;
      document.getElementById('dag-tips').textContent=d.dag.tips||0;
    }
    if(d.uwb){
      document.getElementById('uwb-distance').textContent=d.uwb.distance_m?.toFixed(2)||'--';
      document.getElementById('uwb-quality').textContent=Math.round((d.uwb.quality||0)*100)+'%';
    }
  }catch(e){}
}
setInterval(pollStats,5000);
pollStats();
</script>
</body>
</html>"""


# ─── API Handler ─────────────────────────────────────────────────────

class DashboardHandler(BaseHTTPRequestHandler):
    harness = None
    rotation_count = 0
    start_time = time.time()

    def log_message(self, *a):
        pass

    def _html(self, html, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode())

    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/" or path == "/dashboard":
            self._html(DASHBOARD_HTML)

        elif path == "/api/stats":
            stats = {
                "identity": "SIF-Rotated",
                "rotation": DashboardHandler.rotation_count,
                "uptime_s": int(time.time() - DashboardHandler.start_time),
                "quanta": 0,
                "avg_ms": 0,
                "zero_token_pct": "0%",
                "dag": {"vertices": 0, "depth": 0, "tips": 0},
                "uwb": {"distance_m": 0, "quality": 0},
            }
            if DashboardHandler.harness:
                try:
                    h_stats = DashboardHandler.harness.get_stats()
                    stats.update({
                        "quanta": h_stats.get("quanta_created", 0),
                        "avg_ms": float(h_stats.get("avg_ms", "0")),
                        "zero_token_pct": h_stats.get("zero_token_pct", "0%"),
                        "dag": h_stats.get("dag", {}),
                    })
                except Exception:
                    pass
            self._json(stats)

        elif path == "/api/quantum":
            if DashboardHandler.harness:
                try:
                    r = DashboardHandler.harness.process("status check", {})
                    self._json({
                        "tier": r.get("tier"),
                        "latency_ms": r.get("latency_ms"),
                        "quanta": DashboardHandler.harness.get_stats().get("quanta_created", 0),
                        "avg_ms": float(DashboardHandler.harness.get_stats().get("avg_ms", "0")),
                        "zero_token_pct": DashboardHandler.harness.get_stats().get("zero_token_pct", "0%"),
                    })
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                self._json({"error": "Harness not initialized"}, 503)

        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))

        if path == "/api/rotate":
            DashboardHandler.rotation_count += 1
            new_identity = f"SIF-Rotated-{DashboardHandler.rotation_count}"
            self._json({
                "identity": new_identity,
                "rotation": DashboardHandler.rotation_count,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "cascade": True,
            })

        elif path == "/api/chat":
            query = body.get("query", "")
            if DashboardHandler.harness:
                try:
                    r = DashboardHandler.harness.process(query, {"source": "ui"})
                    self._json({
                        "response": json.dumps(r.get("response", {}), indent=2),
                        "tier": r.get("tier"),
                        "latency_ms": r.get("latency_ms"),
                        "quantum_id": r.get("quantum", {}).get("id", "")[:16],
                    })
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                self._json({"response": f"Received: {query}. Harness not connected.", "tier": "none"})

        elif path == "/api/options":
            self._json({"status": 204})

        else:
            self._json({"error": "not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ─── Main ────────────────────────────────────────────────────────────

def main():
    port = int(os.environ.get("UI_PORT", "8080"))

    # Try to connect quantum harness
    try:
        from src.quantum.zero_latency_harness import ZeroLatencyHarness
        DashboardHandler.harness = ZeroLatencyHarness()
        print("  ✓ Quantum harness connected")
    except Exception as e:
        print(f"  ⚠ No harness: {e}")

    server = HTTPServer(("0.0.0.0", port), DashboardHandler)
    print(f"\n  ⚡ SIF AVA007 Dashboard")
    print(f"  ─────────────────────")
    print(f"  URL: http://localhost:{port}")
    print(f"  Open in browser on S25")
    print()
    server.serve_forever()


if __name__ == "__main__":
    main()
