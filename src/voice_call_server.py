"""Private Telnyx Call Control capability service for Agent-X.

Run with: python3 -m src.voice_call_server
Default bind is loopback (127.0.0.1:8081). Keep it behind a private reverse
proxy / Tailscale Serve; do not expose this port directly to the public internet.
"""
from __future__ import annotations

import hmac
import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

API_BASE = os.getenv("TELNYX_API_BASE", "https://api.telnyx.com/v2").rstrip("/")
HOST = os.getenv("AGENT_X_VOICE_HOST", "127.0.0.1")
PORT = int(os.getenv("AGENT_X_VOICE_PORT", "8081"))
TIMEOUT = 12
E164 = re.compile(r"\+[1-9]\d{7,14}\Z")
CALL_ID = re.compile(r"[A-Za-z0-9_-]{8,128}\Z")


def _telnyx_request(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    key = os.getenv("TELNYX_API_KEY", "")
    if not key:
        return {"ok": False, "error": "TELNYX_API_KEY is not configured"}
    request = urllib.request.Request(
        f"{API_BASE}{path}",
        data=json.dumps(payload or {}).encode("utf-8") if method != "GET" else None,
        method=method,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            raw = response.read().decode("utf-8", "replace")
            decoded = json.loads(raw) if raw else {}
            return decoded if isinstance(decoded, dict) else {"data": decoded}
    except urllib.error.HTTPError as exc:
        try:
            body = json.loads(exc.read().decode("utf-8", "replace"))
            errors = body.get("errors") if isinstance(body, dict) else None
            detail = (
                str(errors[0].get("detail") or errors[0].get("title") or "")
                if errors and isinstance(errors[0], dict) else ""
            )
        except (ValueError, OSError):
            detail = ""
        return {"ok": False, "error": detail or f"Telnyx rejected the request (HTTP {exc.code})"}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return {"ok": False, "error": f"Telnyx API unreachable: {type(exc).__name__}"}
    except ValueError:
        return {"ok": False, "error": "Telnyx returned invalid JSON"}


def dial_call(to: str) -> dict[str, Any]:
    destination = str(to or "").strip()
    sender = os.getenv("TELNYX_FROM_NUMBER", "").strip()
    connection_id = os.getenv("TELNYX_CONNECTION_ID", "").strip()
    if not E164.fullmatch(destination):
        return {"ok": False, "error": "to must be an E.164 number beginning with +"}
    if not E164.fullmatch(sender):
        return {"ok": False, "error": "TELNYX_FROM_NUMBER must be a valid E.164 number"}
    if not connection_id:
        return {"ok": False, "error": "TELNYX_CONNECTION_ID is not configured"}
    result = _telnyx_request("POST", "/calls", {
        "connection_id": connection_id,
        "to": destination,
        "from": sender,
    })
    if result.get("ok") is False or not isinstance(result.get("data"), dict):
        return {"ok": False, "error": str(result.get("error") or "Telnyx did not return a call session")}
    call_id = result["data"].get("call_control_id")
    if not isinstance(call_id, str) or not call_id:
        return {"ok": False, "error": "Telnyx response omitted call_control_id"}
    return {"ok": True, "call_control_id": call_id, "detail": "Telnyx accepted the outbound call request"}


def hangup_call(call_control_id: str) -> dict[str, Any]:
    call_id = str(call_control_id or "").strip()
    if not CALL_ID.fullmatch(call_id):
        return {"ok": False, "error": "call_control_id is invalid"}
    result = _telnyx_request("POST", f"/calls/{call_id}/actions/hangup", {})
    if result.get("ok") is False or not isinstance(result.get("data"), dict):
        return {"ok": False, "error": str(result.get("error") or "Telnyx did not accept the hangup request")}
    return {"ok": True, "call_control_id": call_id, "detail": "Telnyx accepted the hangup request"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write(f"[agent-x-voice] {self.address_string()} {fmt % args}\n")

    def _json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self) -> bool:
        expected = os.getenv("AGENT_X_VOICE_TOKEN", "")
        supplied = self.headers.get("Authorization", "")
        if not expected:
            self._json({"error": "voice capability disabled: set AGENT_X_VOICE_TOKEN"}, 503)
            return False
        if not supplied.startswith("Bearer ") or not hmac.compare_digest(supplied[7:], expected):
            self._json({"error": "unauthorized"}, 401)
            return False
        return True

    def _body(self) -> dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length") or "0")
        except ValueError:
            return {}
        if length <= 0 or length > 16_384:
            return {}
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
            return value if isinstance(value, dict) else {}
        except (ValueError, UnicodeDecodeError):
            return {}

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/healthz":
            self._json({"error": "not found"}, 404)
            return
        configured = bool(
            os.getenv("TELNYX_API_KEY")
            and os.getenv("TELNYX_FROM_NUMBER")
            and os.getenv("TELNYX_CONNECTION_ID")
            and os.getenv("AGENT_X_VOICE_TOKEN")
        )
        self._json({"service": "agent-x-voice-call-control", "ok": configured}, 200 if configured else 503)

    def do_POST(self) -> None:  # noqa: N802
        if self.path not in ("/api/voice/dial", "/api/voice/hangup"):
            self._json({"error": "not found"}, 404)
            return
        if not self._authorized():
            return
        body = self._body()
        if self.path == "/api/voice/dial":
            result = dial_call(str(body.get("to") or ""))
        else:
            result = hangup_call(str(body.get("call_control_id") or ""))
        if not result.get("ok"):
            error = str(result.get("error") or "voice call control failed")
            status = 400 if "must be" in error or "valid" in error or "invalid" in error else 503 if "not configured" in error else 502
            self._json({"ok": False, "error": error}, status)
            return
        self._json(result, 202)


def main() -> int:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    sys.stderr.write(f"[agent-x-voice] listening on {HOST}:{PORT} (private call-control adapter)\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
