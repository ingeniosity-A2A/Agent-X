import json, os, time
from http.server import HTTPServer, BaseHTTPRequestHandler
from src.capability_router import CapabilityRouter
from src.mercury_engine import Mercury2Engine
from src.patterns import list_patterns
from src.config import COMPANY_NAME, AGENT_X_TOOLS
router = None
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _j(self, d, s=200):
        self.send_response(s); self.send_header("Content-Type","application/json"); self.end_headers()
        self.wfile.write(json.dumps(d).encode())
    def do_GET(self):
        if self.path=="/health": self._j({"ok":True,"company":COMPANY_NAME,"stats":router.get_stats() if router else {}})
        elif self.path=="/patterns": self._j({"patterns":list_patterns()})
        else: self._j({"error":"not found"}, 404)
    def do_POST(self):
        b = json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))))
        if self.path=="/process":
            try: self._j(router.process(b.get("query",""), b.get("context",{})))
            except Exception as e: self._j({"error":str(e)}, 500)
        else: self._j({"error":"not found"}, 404)
def main():
    global router
    k = os.environ.get("MERCURY2_API_KEY","")
    if not k: print("ERROR: MERCURY2_API_KEY"); exit(1)
    router = CapabilityRouter(mercury_engine=Mercury2Engine(k))
    print(f"{COMPANY_NAME} API on http://0.0.0.0:7474")
    port = int(os.environ.get("PORT", 7474))
    HTTPServer(("0.0.0.0", port), H).serve_forever()
if __name__ == "__main__": main()
