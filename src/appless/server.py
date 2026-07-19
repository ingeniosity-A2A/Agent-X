"""
Appless Web Server

Serves:
  - VCF download cards (all variants)
  - Landing page when customer taps the contact URL
  - API endpoint for Agent-X integration
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add parent to path for Agent-X imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.appless.vcf_generator import (
    generate_vcf_bytes,
    generate_filename,
    generate_vcf,
    VARIANTS,
)
from src.config import COMPANY_NAME, BUSINESS_PHONE, SERVICE_AREAS


# ─── HTML Templates ──────────────────────────────────────────────────

LANDING_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{company} — {title}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
    color: #e0e0e0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
  }}
  .card {{
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    max-width: 420px;
    width: 100%;
    text-align: center;
  }}
  .logo {{
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00d2ff, #3a7bd5);
    border-radius: 20px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }}
  h1 {{
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.25rem;
  }}
  .subtitle {{
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }}
  .services {{
    text-align: left;
    margin-bottom: 2rem;
  }}
  .services h3 {{
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #666;
    margin-bottom: 0.75rem;
  }}
  .svc-item {{
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 0.95rem;
  }}
  .svc-item:last-child {{ border: none; }}
  .svc-icon {{
    width: 32px;
    height: 32px;
    background: rgba(0,210,255,0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }}
  .btn {{
    display: block;
    width: 100%;
    padding: 1rem;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    text-align: center;
    margin-bottom: 0.75rem;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
  }}
  .btn-primary {{
    background: linear-gradient(135deg, #00d2ff, #3a7bd5);
    color: #000;
  }}
  .btn-primary:hover {{ transform: scale(1.02); }}
  .btn-secondary {{
    background: rgba(255,255,255,0.08);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.15);
  }}
  .chat-box {{
    margin-top: 1.5rem;
    width: 100%;
  }}
  .chat-input {{
    width: 100%;
    padding: 1rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    resize: none;
    outline: none;
  }}
  .chat-input::placeholder {{ color: #666; }}
  .chat-input:focus {{ border-color: #00d2ff; }}
  .chat-send {{
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: #00d2ff;
    color: #000;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
  }}
  .chat-send:hover {{ background: #00bfe6; }}
  .chat-send:disabled {{ opacity: 0.5; cursor: not-allowed; }}
  .response {{
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(0,210,255,0.05);
    border: 1px solid rgba(0,210,255,0.15);
    border-radius: 12px;
    text-align: left;
    font-size: 0.9rem;
    line-height: 1.6;
    display: none;
    white-space: pre-wrap;
  }}
  .areas {{
    margin-top: 1rem;
    font-size: 0.8rem;
    color: #555;
  }}
  .powered {{
    margin-top: 2rem;
    font-size: 0.75rem;
    color: #444;
  }}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🔧</div>
  <h1>{company}</h1>
  <p class="subtitle">{tagline}</p>

  <div class="services">
    <h3>What we do</h3>
    {service_items}
  </div>

  <a href="tel:{phone}" class="btn btn-primary">📞 Call Now</a>
  <a href="/vcf?v={variant}" class="btn btn-secondary" download>💾 Save Contact</a>

  <div class="chat-box">
    <textarea class="chat-input" id="query" rows="2"
      placeholder="Ask us anything — quote, scheduling, availability..."></textarea>
    <button class="chat-send" id="askBtn" onclick="askAgent()">Ask Agent</button>
    <div class="response" id="response"></div>
  </div>

  <p class="areas">Serving: {areas}</p>
  <p class="powered">Powered by Appless™ — No app needed</p>
</div>

<script>
async function askAgent() {{
  const q = document.getElementById('query').value.trim();
  if (!q) return;
  const btn = document.getElementById('askBtn');
  const res = document.getElementById('response');
  btn.disabled = true;
  btn.textContent = 'Thinking...';
  res.style.display = 'block';
  res.textContent = '⏳ Processing...';
  try {{
    const r = await fetch('/api/process', {{
      method: 'POST',
      headers: {{'Content-Type': 'application/json'}},
      body: JSON.stringify({{query: q, context: {{variant: '{variant}', sid: '{sid}'}}}})
    }});
    const data = await r.json();
    if (data.error) {{
      res.textContent = '❌ ' + data.error;
    }} else {{
      res.textContent = formatResponse(data);
    }}
  }} catch(e) {{
    res.textContent = '❌ Connection error. Try again.';
  }}
  btn.disabled = false;
  btn.textContent = 'Ask Agent';
}}

function formatResponse(data) {{
  const r = data.response || data;
  let lines = [];
  if (r.actions) {{
    r.actions.forEach(a => {{
      const icon = a.type.includes('schedule') ? '📅' : a.type.includes('estimate') || a.type.includes('price') ? '💰' : a.type.includes('dispatch') ? '🚗' : '✅';
      lines.push(icon + ' ' + a.type.replace(/_/g, ' '));
      if (a.details) {{
        Object.entries(a.details).forEach(([k,v]) => {{
          if (v !== null) lines.push('   ' + k.replace(/_/g,' ') + ': ' + v);
        }});
      }}
    }});
  }}
  if (r.message) lines.push(r.message);
  if (data.tier) lines.push('\\n📊 Routed: ' + data.tier + ' | ' + (data.latency_ms||0).toFixed(0) + 'ms');
  return lines.join('\\n') || JSON.stringify(data, null, 2);
}}

document.getElementById('query').addEventListener('keydown', e => {{
  if (e.key === 'Enter' && !e.shiftKey) {{ e.preventDefault(); askAgent(); }}
}});
</script>
</body>
</html>"""

SERVICE_ICONS = {
    "IKEA Assembly": "🪑",
    "Furniture Assembly": "🛋️",
    "Mounting & Installation": "🔨",
    "Outdoor Assembly": "🌳",
    "Commercial Assembly": "🏢",
    "Repairs & Adjustments": "🔧",
    "Kitchen Installation": "🍳",
    "Walk-in Closet Systems": "👔",
    "Murphy Beds": "🛏️",
    "Home Gym Setup": "🏋️",
    "Modular Sectionals": "🛋️",
    "Custom Solutions": "✨",
    "Office Desks": "🖥️",
    "Conference Tables": "📋",
    "Reception Areas": "🏛️",
    "Cubicle Partitions": "🔲",
    "Retail Shelving": "🏪",
    "Bulk Assembly": "📦",
    "On-site Assembly": "🏠",
    "Quality Inspection": "🔍",
    "Customer Walkthrough": "👋",
    "Post-Assembly Support": "📞",
    "Warranty Service": "🛡️",
}


def _build_landing_html(variant: str, service_id: str) -> str:
    """Build the landing page HTML for a given variant."""
    from src.appless.vcf_generator import VARIANTS
    v = VARIANTS.get(variant, VARIANTS["standard"])

    svc_items = ""
    for s in v["services"]:
        icon = SERVICE_ICONS.get(s, "•")
        svc_items += f'<div class="svc-item"><div class="svc-icon">{icon}</div>{s}</div>\n'

    areas_str = ", ".join(SERVICE_AREAS[:8]) + "..."

    return LANDING_HTML.format(
        company=COMPANY_NAME,
        title=v["title"],
        tagline=v["tagline"],
        service_items=svc_items,
        phone=BUSINESS_PHONE,
        variant=variant,
        sid=service_id,
        areas=areas_str,
    )


# ─── Request Handler ─────────────────────────────────────────────────

class ApplessHandler(BaseHTTPRequestHandler):
    harness = None  # Injected from Agent-X

    def log_message(self, *a):
        pass  # Quiet logs

    def _html(self, html: str, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(html.encode())

    def _json(self, data: dict, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _vcf(self, data: bytes, filename: str):
        self.send_response(200)
        self.send_header("Content-Type", "text/vcard; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        # ── Landing page ──
        if path == "/" or path == "/care":
            variant = params.get("v", ["standard"])[0]
            sid = params.get("sid", ["default"])[0]
            self._html(_build_landing_html(variant, sid))

        # ── VCF download ──
        elif path == "/vcf":
            variant = params.get("v", ["standard"])[0]
            vcf_data = generate_vcf_bytes(variant=variant)
            filename = generate_filename(variant=variant)
            self._vcf(vcf_data, filename)

        # ── All variants list ──
        elif path == "/variants":
            self._json({"variants": list(VARIANTS.keys())})

        # ── Health ──
        elif path == "/health":
            self._json({
                "ok": True,
                "service": "Appless",
                "company": COMPANY_NAME,
                "variants": list(VARIANTS.keys()),
            })

        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))

        if parsed.path == "/api/process":
            query = body.get("query", "")
            context = body.get("context", {})

            if ApplessHandler.harness:
                try:
                    result = ApplessHandler.harness.process(query, context)
                    self._json(result)
                except Exception as e:
                    self._json({"error": str(e)}, 500)
            else:
                # Fallback: echo with helpful message
                self._json({
                    "response": {
                        "message": f"Received: '{query}'. Agent-X harness not connected — start with: python3 -m src.appless.server",
                        "actions": [],
                    },
                    "tier": "none",
                    "latency_ms": 0,
                })

        elif parsed.path == "/api/vcf":
            variant = body.get("variant", "standard")
            vcf_data = generate_vcf_bytes(variant=variant)
            self._json({
                "variant": variant,
                "vcf": vcf_data.decode("utf-8"),
                "filename": generate_filename(variant=variant),
            })

        else:
            self._json({"error": "not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ─── App Factory ─────────────────────────────────────────────────────

def create_app(harness=None):
    """Create and return the Appless HTTP server."""
    ApplessHandler.harness = harness
    return HTTPServer(("0.0.0.0", 7475), ApplessHandler)


# ─── CLI Entry ───────────────────────────────────────────────────────

def main():
    """Run Appless standalone with Zero Latency Quantum Harness."""
    port = int(os.environ.get("APPLESS_PORT", "7475"))

    # Try to connect Zero Latency Quantum Harness
    harness = None
    try:
        mercury_key = os.environ.get("MERCURY_API_KEY", "")
        if mercury_key:
            from src.quantum.zero_latency_harness import ZeroLatencyHarness
            harness = ZeroLatencyHarness(
                mercury_engine=None,  # Set up if key available
                enable_flipper=True,
                enable_lora=True,
                enable_vfile=True,
            )
            print(f"  ✓ Zero Latency Quantum Harness connected")
    except Exception as e:
        print(f"  ⚠ Quantum Harness not available: {e}")
        # Fallback to base harness
        try:
            from src.mercury_engine import MercuryEngine
            from src.harness import Harness
            harness = Harness(mercury_engine=MercuryEngine(mercury_key))
            print(f"  ✓ Base Agent-X harness connected")
        except Exception as e2:
            print(f"  ⚠ Agent-X not available: {e2}")

    server = HTTPServer(("0.0.0.0", port), ApplessHandler)
    server.socket.setsockopt(__import__("socket").SOL_SOCKET, __import__("socket").SO_REUSEADDR, 1)
    ApplessHandler.harness = harness  # Wire up the harness
    print(f"\n  Appless™ Mobile Care")
    print(f"  ─────────────────────")
    print(f"  Company:  {COMPANY_NAME}")
    print(f"  Port:     {port}")
    print(f"  Landing:  http://0.0.0.0:{port}/")
    print(f"  VCF:      http://0.0.0.0:{port}/vcf?v=standard")
    print(f"  API:      http://0.0.0.0:{port}/api/process")
    print(f"  Variants: {', '.join(VARIANTS.keys())}")
    print()
    server.serve_forever()


if __name__ == "__main__":
    main()
