"""
Beeper Matrix Bridge

Full Matrix/Beeper integration for Interaction Quantum transport.

This bridge is transport-only: it renders opaque routing/observation metadata
from the substrate and never consumes Ava007 cognitive state.
"""

import hashlib
import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

try:
    import requests
except ImportError:
    requests = None


class MatrixClient:
    """Matrix client-server API wrapper for Beeper/Matrix transport."""

    def __init__(self, homeserver: str = "https://matrix.org", access_token: str = None, user_id: str = None, device_id: str = None):
        self.homeserver = homeserver.rstrip("/")
        self.access_token = access_token
        self.user_id = user_id
        self.device_id = device_id
        self.next_batch: Optional[str] = None

    @property
    def headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.access_token:
            h["Authorization"] = f"Bearer {self.access_token}"
        return h

    def login(self, username: str, password: str) -> dict:
        resp = requests.post(f"{self.homeserver}/_matrix/client/v3/login", json={"type": "m.login.password", "identifier": {"type": "m.id.user", "user": username}, "password": password}, headers=self.headers, timeout=30)
        data = resp.json()
        if "access_token" in data:
            self.access_token = data["access_token"]
            self.user_id = data.get("user_id")
            self.device_id = data.get("device_id")
        return data

    def logout(self) -> dict:
        resp = requests.post(f"{self.homeserver}/_matrix/client/v3/logout", headers=self.headers, timeout=30)
        self.access_token = None
        return resp.json()

    def sync(self, timeout: int = 30000, filter_json: dict = None) -> dict:
        params = {"timeout": timeout}
        if self.next_batch:
            params["since"] = self.next_batch
        if filter_json:
            params["filter"] = json.dumps(filter_json)
        resp = requests.get(f"{self.homeserver}/_matrix/client/v3/sync", params=params, headers=self.headers, timeout=60)
        data = resp.json()
        self.next_batch = data.get("next_batch")
        return data

    def get_messages(self, room_id: str, limit: int = 50, from_token: str = None) -> dict:
        params = {"limit": limit, "dir": "b"}
        if from_token:
            params["from"] = from_token
        resp = requests.get(f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/messages", params=params, headers=self.headers, timeout=30)
        return resp.json()

    def send_message(self, room_id: str, body: str, msgtype: str = "m.text", extra: dict = None) -> dict:
        txn_id = uuid.uuid4().hex
        content = {"msgtype": msgtype, "body": body}
        if extra:
            content.update(extra)
        resp = requests.put(f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}", json=content, headers=self.headers, timeout=30)
        return resp.json()

    def send_notice(self, room_id: str, body: str) -> dict:
        return self.send_message(room_id, body, msgtype="m.notice")

    def send_html(self, room_id: str, plain: str, html: str) -> dict:
        txn_id = uuid.uuid4().hex
        content = {"msgtype": "m.text", "body": plain, "format": "org.matrix.custom.html", "formatted_body": html}
        resp = requests.put(f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}", json=content, headers=self.headers, timeout=30)
        return resp.json()

    def send_vfile(self, room_id: str, vfile) -> dict:
        from src.quantum.vfile import render_beeper_card, VFile as VFileObj
        vf = VFileObj.from_dict(vfile) if isinstance(vfile, dict) else vfile
        card = render_beeper_card(vf)
        txn_id = uuid.uuid4().hex
        resp = requests.put(f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}", json=card, headers=self.headers, timeout=30)
        return resp.json()

    def send_quantum(self, room_id: str, quantum) -> dict:
        """Send an Interaction Quantum using opaque substrate references."""
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        payload = q.get("payload", {}) or {}
        metadata = q.get("metadata", {}) or {}
        intent = q.get("intent_id") or payload.get("intent_id") or payload.get("capability") or q.get("intent") or "message"
        confidence = payload.get("confidence", metadata.get("confidence", 0))
        try:
            confidence = float(confidence)
        except (TypeError, ValueError):
            confidence = 0.0
        qid = q.get("quantum_id", "")[:16]

        intent_icons = {"dispatch": "🚗", "quote": "💰", "schedule": "📅", "reminder": "⏰", "complaint": "⚠️", "invoice": "💳", "review": "⭐", "inventory": "📦", "alert": "🚨"}
        icon = intent_icons.get(intent, "⚛")
        label = str(intent).replace("_", " ").title()
        plain = f"{icon} {label} | QID: {qid}... | Confidence: {confidence:.0%}"
        html = f"""
        <div style="border:1px solid #333;border-radius:8px;padding:12px;font-family:sans-serif">
          <strong>{icon} {label}</strong><br>
          <span style="color:#888">QID: <code>{qid}...</code></span><br>
          <span style="color:#888">Confidence: {confidence:.0%}</span>
        </div>
        """
        return self.send_html(room_id, plain, html)

    def upload_media(self, data: bytes, content_type: str, filename: str = None) -> dict:
        resp = requests.post(f"{self.homeserver}/_matrix/media/v3/upload", params={"filename": filename or "file"}, headers={"Authorization": f"Bearer {self.access_token}", "Content-Type": content_type}, data=data, timeout=60)
        return resp.json()
