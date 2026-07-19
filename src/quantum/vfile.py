"""
VFile 2.0 — Interaction Quantum Container

VFile (application/vnd.ava.vfile+json) wraps an Interaction Quantum
or a collection of quanta for transport over Beeper, A2A, or any
messaging channel.

Structure:
{
  "vfile_version": "2.0",
  "type": "interaction_quantum | quantum_batch",
  "quantum": { ... },
  "beep_channel": "wss://a2a.ava.network/beeper",
  "delegation_chain": ["did:ava:parent"]
}
"""

import json
import time
import hashlib
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class VFile:
    """
    VFile 2.0 — wraps Interaction Quanta for transport.
    
    When sent to a Beeper contact, the VFile:
    1. Appears as an interactive rich card in chat
    2. Spawns an agent in the recipient's local runtime (with consent)
    3. Syncs the Interaction Quantum lineage
    4. Agents reconstruct full conversation state from quanta
    """

    vfile_version: str = "2.0"
    type: str = "interaction_quantum"        # interaction_quantum | quantum_batch
    quantum: Optional[dict] = None           # Single quantum
    quanta: list[dict] = field(default_factory=list)  # Batch of quanta
    beep_channel: str = "wss://a2a.ava.network/beeper"
    delegation_chain: list[str] = field(default_factory=list)
    consent_token: Optional[str] = None      # Recipient consent for agent spawn
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = {
            "vfile_version": self.vfile_version,
            "type": self.type,
            "beep_channel": self.beep_channel,
        }
        if self.quantum:
            d["quantum"] = self.quantum
        if self.quanta:
            d["quanta"] = self.quanta
        if self.delegation_chain:
            d["delegation_chain"] = self.delegation_chain
        if self.consent_token:
            d["consent_token"] = self.consent_token
        if self.metadata:
            d["metadata"] = self.metadata
        return d

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
        """Wrap a single Interaction Quantum in a VFile."""
        return cls(
            type="interaction_quantum",
            quantum=quantum.to_dict(),
            delegation_chain=delegation_chain or [],
        )

    @classmethod
    def wrap_batch(cls, quanta: list, delegation_chain: list[str] = None) -> "VFile":
        """Wrap multiple quanta in a batch VFile."""
        return cls(
            type="quantum_batch",
            quanta=[q.to_dict() for q in quanta],
            delegation_chain=delegation_chain or [],
        )

    def content_type(self) -> str:
        """MIME type for HTTP transport."""
        return "application/vnd.ava.vfile+json"

    def fingerprint(self) -> str:
        """Content-addressable fingerprint of the VFile."""
        canonical = json.dumps(self.to_dict(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()


# ─── Beeper Rich Card Rendering ─────────────────────────────────────

def render_beeper_card(vfile: VFile) -> dict:
    """
    Render a VFile as a Beeper interactive rich card.
    
    Beeper supports Matrix-style message types. This generates
    an m.room.message with rich formatting.
    """
    q = vfile.quantum or {}
    cog = q.get("cognitive_state", {})
    payload = q.get("payload", {})

    intent = cog.get("intent", "message")
    confidence = cog.get("confidence", 0)
    source = q.get("source_did", "unknown")

    # Intent → emoji mapping
    intent_icons = {
        "voice_call": "📞",
        "dispatch": "🚗",
        "quote": "💰",
        "schedule": "📅",
        "reminder": "⏰",
        "complaint": "⚠️",
        "review": "⭐",
        "billing": "💳",
        "inventory": "📦",
        "marketing": "📣",
        "greeting": "👋",
        "help": "🆘",
    }
    icon = intent_icons.get(intent, "💬")

    # Build card body
    body_lines = [
        f"{icon} **{intent.replace('_', ' ').title()}**",
        f"Source: `{source[:30]}`",
        f"Confidence: {confidence:.0%}",
    ]

    if payload:
        body_lines.append("---")
        for k, v in payload.items():
            if v is not None:
                body_lines.append(f"**{k}**: {v}")

    # Matrix m.room.message format
    return {
        "msgtype": "m.text",
        "body": "\n".join(body_lines),
        "format": "org.matrix.custom.html",
        "formatted_body": _render_html_card(vfile),
    }


def _render_html_card(vfile: VFile) -> str:
    """Render VFile as HTML for Matrix/Beeper rich display."""
    q = vfile.quantum or {}
    cog = q.get("cognitive_state", {})
    payload = q.get("payload", {})
    
    intent = cog.get("intent", "message")
    confidence = cog.get("confidence", 0)
    source = q.get("source_did", "unknown")
    qid = q.get("quantum_id", "")[:16]

    intent_icons = {
        "voice_call": "📞", "dispatch": "🚗", "quote": "💰",
        "schedule": "📅", "reminder": "⏰", "complaint": "⚠️",
    }
    icon = intent_icons.get(intent, "💬")

    payload_html = ""
    if payload:
        rows = "".join(
            f'<tr><td style="padding:2px 8px;color:#888">{k}</td>'
            f'<td style="padding:2px 8px">{v}</td></tr>'
            for k, v in payload.items() if v is not None
        )
        payload_html = f'<table style="margin-top:8px">{rows}</table>'

    return f"""
    <div style="border:1px solid #333;border-radius:12px;padding:16px;max-width:320px;font-family:sans-serif;background:#111;color:#eee">
      <div style="font-size:1.2em;margin-bottom:8px">{icon} <strong>{intent.replace('_', ' ').title()}</strong></div>
      <div style="color:#888;font-size:0.85em">Source: <code>{source[:30]}</code></div>
      <div style="color:#888;font-size:0.85em">Confidence: {confidence:.0%}</div>
      <div style="color:#555;font-size:0.75em;margin-top:4px">QID: {qid}...</div>
      {payload_html}
      <div style="margin-top:12px;padding-top:8px;border-top:1px solid #222;font-size:0.75em;color:#555">
        VFile v{vfile.vfile_version} • Quantum Transport
      </div>
    </div>
    """


# ─── Beeper Send ─────────────────────────────────────────────────────

def send_to_beeper(
    vfile: VFile,
    room_id: str,
    homeserver: str = "https://matrix.org",
    access_token: str = None,
) -> dict:
    """
    Send a VFile as a Beeper rich card to a Matrix room.
    
    Args:
        vfile: The VFile to send
        room_id: Matrix room ID (!room:server)
        homeserver: Matrix homeserver URL
        access_token: Matrix access token
    
    Returns:
        Matrix API response
    """
    import requests

    card = render_beeper_card(vfile)
    url = f"{homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    resp = requests.put(url, headers=headers, json=card, timeout=30)
    return resp.json()
