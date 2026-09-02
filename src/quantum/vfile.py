"""VFile 2.0 — Interaction Quantum transport container.

Rendering reads opaque intent/capability references from the quantum payload.
Cognitive state is never required by the transport layer.
"""

import hashlib
import json
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class VFile:
    vfile_version: str = "2.0"
    type: str = "interaction_quantum"
    quantum: Optional[dict] = None
    quanta: list[dict] = field(default_factory=list)
    beep_channel: str = "wss://a2a.ava.network/beeper"
    delegation_chain: list[str] = field(default_factory=list)
    consent_token: Optional[str] = None
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        data = {"vfile_version": self.vfile_version, "type": self.type, "beep_channel": self.beep_channel}
        if self.quantum:
            data["quantum"] = self.quantum
        if self.quanta:
            data["quanta"] = self.quanta
        if self.delegation_chain:
            data["delegation_chain"] = self.delegation_chain
        if self.consent_token:
            data["consent_token"] = self.consent_token
        if self.metadata:
            data["metadata"] = self.metadata
        return data

    def to_json(self, indent: int = None) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def to_jsonl(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    @classmethod
    def from_dict(cls, data: dict) -> "VFile":
        return cls(
            vfile_version=data.get("vfile_version", "2.0"),
            type=data.get("type", "interaction_quantum"),
            quantum=data.get("quantum"),
            quanta=data.get("quanta", []),
            beep_channel=data.get("beep_channel", "wss://a2a.ava.network/beeper"),
            delegation_chain=data.get("delegation_chain", []),
            consent_token=data.get("consent_token"),
            metadata=data.get("metadata", {}),
        )

    @classmethod
    def from_json(cls, json_str: str) -> "VFile":
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def wrap_quantum(cls, quantum, delegation_chain: list[str] = None) -> "VFile":
        return cls(type="interaction_quantum", quantum=quantum.to_dict(), delegation_chain=delegation_chain or [])

    @classmethod
    def wrap_batch(cls, quanta: list, delegation_chain: list[str] = None) -> "VFile":
        return cls(type="quantum_batch", quanta=[q.to_dict() for q in quanta], delegation_chain=delegation_chain or [])

    def content_type(self) -> str:
        return "application/vnd.ava.vfile+json"

    def fingerprint(self) -> str:
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()


def _routing_refs(q: dict) -> tuple[str, float]:
    payload = q.get("payload", {}) or {}
    intent = payload.get("intent_id") or payload.get("capability") or q.get("intent") or "message"
    confidence = float(payload.get("confidence", q.get("confidence", 0)) or 0)
    return str(intent), confidence


def render_beeper_card(vfile: VFile) -> dict:
    q = vfile.quantum or {}
    intent, confidence = _routing_refs(q)
    payload = q.get("payload", {}) or {}
    source = q.get("source_did", "unknown")

    intent_icons = {
        "voice_call": "📞", "dispatch": "🚗", "quote": "💰", "schedule": "📅",
        "reminder": "⏰", "complaint": "⚠️", "review": "⭐", "billing": "💳",
        "inventory": "📦", "marketing": "📣", "greeting": "👋", "help": "🆘",
    }
    icon = intent_icons.get(intent, "💬")
    body_lines = [f"{icon} **{intent.replace('_', ' ').title()}**", f"Source: `{source[:30]}`", f"Confidence: {confidence:.0%}"]
    if payload:
        body_lines.append("---")
        for key, value in payload.items():
            if key not in {"intent_id", "confidence", "agent_role", "signal_metadata"} and value is not None:
                body_lines.append(f"**{key}**: {value}")

    return {
        "msgtype": "m.text",
        "body": "\n".join(body_lines),
        "format": "org.matrix.custom.html",
        "formatted_body": _render_html_card(vfile),
    }


def _render_html_card(vfile: VFile) -> str:
    q = vfile.quantum or {}
    intent, confidence = _routing_refs(q)
    payload = q.get("payload", {}) or {}
    source = q.get("source_did", "unknown")
    qid = q.get("quantum_id", "")[:16]
    icon = {"voice_call": "📞", "dispatch": "🚗", "quote": "💰", "schedule": "📅", "reminder": "⏰", "complaint": "⚠️"}.get(intent, "💬")

    payload_html = ""
    visible = {k: v for k, v in payload.items() if k not in {"intent_id", "confidence", "agent_role", "signal_metadata"} and v is not None}
    if visible:
        rows = "".join(f'<tr><td style="padding:2px 8px;color:#888">{k}</td><td style="padding:2px 8px">{v}</td></tr>' for k, v in visible.items())
        payload_html = f'<table style="margin-top:8px">{rows}</table>'

    return f"""
    <div style="border:1px solid #333;border-radius:12px;padding:16px;max-width:320px;font-family:sans-serif;background:#111;color:#eee">
      <div style="font-size:1.2em;margin-bottom:8px">{icon} <strong>{intent.replace('_', ' ').title()}</strong></div>
      <div style="color:#888;font-size:0.85em">Source: <code>{source[:30]}</code></div>
      <div style="color:#888;font-size:0.85em">Confidence: {confidence:.0%}</div>
      <div style="color:#555;font-size:0.75em;margin-top:4px">QID: {qid}...</div>
      {payload_html}
      <div style="margin-top:12px;padding-top:8px;border-top:1px solid #222;font-size:0.75em;color:#555">VFile v{vfile.vfile_version} • Quantum Transport</div>
    </div>
    """


def send_to_beeper(vfile: VFile, room_id: str, homeserver: str = "https://matrix.org", access_token: str = None) -> dict:
    import requests
    card = render_beeper_card(vfile)
    url = f"{homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    resp = requests.put(url, headers=headers, json=card, timeout=30)
    return resp.json()
