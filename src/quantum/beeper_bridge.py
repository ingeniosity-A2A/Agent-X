"""
Beeper Matrix Bridge

Full Matrix/Beeper integration for Interaction Quantum transport.

Features:
- Matrix client-server API (login, sync, send, receive)
- VFile rich card rendering
- Quantum lineage sync via Matrix threads
- E2EE support (via olm/megolm — placeholder)
- Room management (create, join, invite)
- Media upload (images, files, VCF cards)

Beeper is a Matrix-based universal chat app. This bridge
turns every Beeper conversation into a quantum-aware channel.
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
    """
    Matrix client-server API wrapper.
    
    Handles authentication, sync, messaging, and room management
    for Beeper/Matrix homeservers.
    """

    def __init__(
        self,
        homeserver: str = "https://matrix.org",
        access_token: str = None,
        user_id: str = None,
        device_id: str = None,
    ):
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

    # ─── Authentication ──────────────────────────────────────────────

    def login(self, username: str, password: str) -> dict:
        """Login with username/password. Returns access token."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/login",
            json={
                "type": "m.login.password",
                "identifier": {"type": "m.id.user", "user": username},
                "password": password,
            },
            headers=self.headers,
            timeout=30,
        )
        data = resp.json()
        if "access_token" in data:
            self.access_token = data["access_token"]
            self.user_id = data.get("user_id")
            self.device_id = data.get("device_id")
        return data

    def logout(self) -> dict:
        """Logout and invalidate access token."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/logout",
            headers=self.headers,
            timeout=30,
        )
        self.access_token = None
        return resp.json()

    # ─── Sync ────────────────────────────────────────────────────────

    def sync(self, timeout: int = 30000, filter_json: dict = None) -> dict:
        """Sync with the homeserver (long-polling)."""
        params = {"timeout": timeout}
        if self.next_batch:
            params["since"] = self.next_batch
        if filter_json:
            params["filter"] = json.dumps(filter_json)

        resp = requests.get(
            f"{self.homeserver}/_matrix/client/v3/sync",
            params=params,
            headers=self.headers,
            timeout=60,
        )
        data = resp.json()
        self.next_batch = data.get("next_batch")
        return data

    def get_messages(self, room_id: str, limit: int = 50, from_token: str = None) -> dict:
        """Get messages from a room."""
        params = {"limit": limit, "dir": "b"}  # Backward
        if from_token:
            params["from"] = from_token

        resp = requests.get(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/messages",
            params=params,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    # ─── Messaging ───────────────────────────────────────────────────

    def send_message(self, room_id: str, body: str, msgtype: str = "m.text", extra: dict = None) -> dict:
        """Send a text message to a room."""
        txn_id = uuid.uuid4().hex
        content = {
            "msgtype": msgtype,
            "body": body,
        }
        if extra:
            content.update(extra)

        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
            json=content,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def send_notice(self, room_id: str, body: str) -> dict:
        """Send a notice (bot message) to a room."""
        return self.send_message(room_id, body, msgtype="m.notice")

    def send_html(self, room_id: str, plain: str, html: str) -> dict:
        """Send an HTML-formatted message."""
        txn_id = uuid.uuid4().hex
        content = {
            "msgtype": "m.text",
            "body": plain,
            "format": "org.matrix.custom.html",
            "formatted_body": html,
        }
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
            json=content,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def send_vfile(self, room_id: str, vfile) -> dict:
        """Send a VFile as a rich card to a room."""
        from src.quantum.vfile import render_beeper_card, VFile as VFileObj
        
        if isinstance(vfile, dict):
            vf = VFileObj.from_dict(vfile)
        else:
            vf = vfile
        
        card = render_beeper_card(vf)
        txn_id = uuid.uuid4().hex
        
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
            json=card,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def send_quantum(self, room_id: str, quantum) -> dict:
        """Send an Interaction Quantum as a formatted message."""
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        cog = q.get("cognitive_state", {})
        intent = cog.get("intent", "message")
        confidence = cog.get("confidence", 0)
        qid = q.get("quantum_id", "")[:16]

        intent_icons = {
            "dispatch": "🚗", "quote": "💰", "schedule": "📅",
            "reminder": "⏰", "complaint": "⚠️", "invoice": "💳",
            "review": "⭐", "inventory": "📦", "alert": "🚨",
        }
        icon = intent_icons.get(intent, "⚛")

        plain = f"{icon} {intent.replace('_', ' ').title()} | QID: {qid}... | Confidence: {confidence:.0%}"
        html = f"""
        <div style="border:1px solid #333;border-radius:8px;padding:12px;font-family:sans-serif">
          <strong>{icon} {intent.replace('_', ' ').title()}</strong><br>
          <span style="color:#888">QID: <code>{qid}...</code></span><br>
          <span style="color:#888">Confidence: {confidence:.0%}</span>
        </div>
        """
        return self.send_html(room_id, plain, html)

    # ─── Media ───────────────────────────────────────────────────────

    def upload_media(self, data: bytes, content_type: str, filename: str = None) -> dict:
        """Upload media to the Matrix content repository."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/media/v3/upload",
            params={"filename": filename or "file"},
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": content_type,
            },
            data=data,
            timeout=60,
        )
        return resp.json()

    def send_image(self, room_id: str, image_data: bytes, caption: str = "") -> dict:
        """Upload and send an image to a room."""
        upload = self.upload_media(image_data, "image/jpeg", "quantum.jpg")
        mxc_url = upload.get("content_uri", "")
        
        txn_id = uuid.uuid4().hex
        content = {
            "msgtype": "m.image",
            "body": caption or "Quantum capture",
            "url": mxc_url,
            "info": {
                "mimetype": "image/jpeg",
                "size": len(image_data),
            },
        }
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
            json=content,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def send_vcf(self, room_id: str, vcf_data: bytes, filename: str = "contact.vcf") -> dict:
        """Upload and send a VCF contact card."""
        upload = self.upload_media(vcf_data, "text/vcard", filename)
        mxc_url = upload.get("content_uri", "")
        
        txn_id = uuid.uuid4().hex
        content = {
            "msgtype": "m.file",
            "body": filename,
            "filename": filename,
            "url": mxc_url,
            "info": {
                "mimetype": "text/vcard",
                "size": len(vcf_data),
            },
        }
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
            json=content,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    # ─── Room Management ─────────────────────────────────────────────

    def create_room(self, name: str, topic: str = "", is_public: bool = False, invite: list[str] = None) -> dict:
        """Create a new Matrix room."""
        body = {
            "name": name,
            "topic": topic,
            "is_public": is_public,
        }
        if invite:
            body["invite"] = invite

        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/createRoom",
            json=body,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def join_room(self, room_id_or_alias: str) -> dict:
        """Join a room by ID or alias."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/join/{room_id_or_alias}",
            json={},
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def invite_user(self, room_id: str, user_id: str) -> dict:
        """Invite a user to a room."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/invite",
            json={"user_id": user_id},
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def leave_room(self, room_id: str) -> dict:
        """Leave a room."""
        resp = requests.post(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/leave",
            json={},
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def get_room_members(self, room_id: str) -> dict:
        """Get members of a room."""
        resp = requests.get(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/members",
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def get_joined_rooms(self) -> dict:
        """Get list of joined rooms."""
        resp = requests.get(
            f"{self.homeserver}/_matrix/client/v3/joined_rooms",
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    # ─── Reactions ───────────────────────────────────────────────────

    def react(self, room_id: str, event_id: str, emoji: str) -> dict:
        """React to a message with an emoji."""
        txn_id = uuid.uuid4().hex
        content = {
            "m.relates_to": {
                "rel_type": "m.annotation",
                "event_id": event_id,
                "key": emoji,
            },
        }
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/rooms/{room_id}/send/m.reaction/{txn_id}",
            json=content,
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    # ─── Profile ─────────────────────────────────────────────────────

    def set_display_name(self, name: str) -> dict:
        """Set display name."""
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/profile/{self.user_id}/displayname",
            json={"displayname": name},
            headers=self.headers,
            timeout=30,
        )
        return resp.json()

    def set_avatar(self, mxc_url: str) -> dict:
        """Set avatar from MXC URL."""
        resp = requests.put(
            f"{self.homeserver}/_matrix/client/v3/profile/{self.user_id}/avatar_url",
            json={"avatar_url": mxc_url},
            headers=self.headers,
            timeout=30,
        )
        return resp.json()


# ─── Quantum-Beeper Bridge ───────────────────────────────────────────

class BeeperQuantumBridge:
    """
    Bridges Interaction Quanta to Beeper conversations.
    
    Features:
    - Receives Beeper messages → wraps as Quanta → processes through harness
    - Sends Quanta as rich cards to Beeper rooms
    - Syncs quantum lineage across Beeper threads
    - VCF contact card delivery via Beeper
    """

    def __init__(
        self,
        homeserver: str = "https://matrix.org",
        access_token: str = None,
        quantum_harness=None,
    ):
        self.client = MatrixClient(homeserver=homeserver, access_token=access_token)
        self.harness = quantum_harness
        self.running = False

    def process_room_message(self, room_id: str, event: dict) -> Optional[dict]:
        """
        Process an incoming Beeper/Matrix message.
        
        1. Extract message content
        2. Wrap as Interaction Quantum
        3. Process through harness
        4. Send response back to room
        """
        content = event.get("content", {})
        body = content.get("body", "")
        sender = event.get("sender", "")
        event_id = event.get("event_id", "")
        msgtype = content.get("msgtype", "")

        # Skip bot's own messages
        if sender == self.client.user_id:
            return None

        # Skip non-text messages for now
        if msgtype not in ("m.text", "m.notice"):
            return None

        # Process through harness
        if self.harness:
            result = self.harness.process(body, {
                "source": "beeper",
                "sender": sender,
                "room_id": room_id,
                "event_id": event_id,
                "transport": "matrix",
            })

            # Send response
            response = result.get("response", {})
            actions = response.get("actions", [])

            if actions:
                # Format response
                lines = []
                for action in actions:
                    tool = action.get("tool", action.get("type", ""))
                    params = action.get("params", action.get("details", {}))
                    reason = action.get("reason", "")
                    
                    icon = "✅" if "create" in tool else "📤" if "send" in tool else "🔧"
                    lines.append(f"{icon} **{tool.replace('_', ' ').title()}**")
                    if reason:
                        lines.append(f"   {reason}")
                
                reply = "\n".join(lines)
                self.client.send_message(room_id, reply)

            # React to acknowledge
            if event_id:
                self.client.react(room_id, event_id, "⚛")

            return result

        return None

    def sync_loop(self, room_ids: list[str] = None, timeout: int = 30000):
        """
        Main sync loop — processes incoming Beeper messages.
        
        Optionally filters to specific room IDs.
        """
        self.running = True
        print(f"🐝 Beeper Quantum Bridge")
        print(f"  User: {self.client.user_id}")
        print(f"  Rooms: {room_ids or 'all'}")
        print()

        while self.running:
            try:
                sync = self.client.sync(timeout=timeout)
                rooms = sync.get("rooms", {}).get("join", {})

                for room_id, room_data in rooms.items():
                    if room_ids and room_id not in room_ids:
                        continue

                    timeline = room_data.get("timeline", {})
                    events = timeline.get("events", [])

                    for event in events:
                        if event.get("type") == "m.room.message":
                            result = self.process_room_message(room_id, event)
                            if result:
                                tier = result.get("tier", "?")
                                qid = result.get("quantum", {}).get("id", "")[:16]
                                print(f"  [{tier}] Q:{qid}... | {room_id}")

            except KeyboardInterrupt:
                print("\n👋 Stopped.")
                self.running = False
                break
            except Exception as e:
                print(f"⚠ Sync error: {e}")
                time.sleep(5)

    def send_quantum_update(self, room_id: str, quantum, message: str = None):
        """Send a quantum status update to a Beeper room."""
        if message:
            self.client.send_message(room_id, message)
        self.client.send_quantum(room_id, quantum)

    def send_vcf_card(self, room_id: str, variant: str = "standard"):
        """Send an Appless VCF contact card to a Beeper room."""
        from src.quantum.vfile import VFile
        from src.appless.vcf_generator import generate_vcf_bytes, generate_filename

        vcf_data = generate_vcf_bytes(variant=variant)
        filename = generate_filename(variant=variant)
        
        # Upload and send
        self.client.send_vcf(room_id, vcf_data, filename)
        
        # Also send a description
        self.client.send_message(
            room_id,
            f"📇 {variant.title()} contact card — save to your phone for instant support!"
        )

    def send_flipper_command(self, room_id: str, command):
        """Send a Flipper Zero command summary to Beeper."""
        cmd = command.to_dict() if hasattr(command, "to_dict") else command
        
        lines = [f"📡 **Flipper Command: {cmd.get('name', 'unknown')}**"]
        for sig in cmd.get("signals", []):
            lines.append(f"  Protocol: {sig.get('protocol', '?')}")
            lines.append(f"  Frequency: {sig.get('frequency', '?')}")
            lines.append(f"  Data: `{sig.get('data_hex', '')[:32]}...`")
        
        self.client.send_message(room_id, "\n".join(lines))

    def stop(self):
        """Stop the sync loop."""
        self.running = False


# ─── Standalone Runner ───────────────────────────────────────────────

def run_beeper_bridge(
    homeserver: str = None,
    access_token: str = None,
    room_ids: list[str] = None,
):
    """Run the Beeper Quantum Bridge standalone."""
    homeserver = homeserver or os.environ.get("BEEPER_HOMESERVER", "https://matrix.org")
    access_token = access_token or os.environ.get("BEEPER_ACCESS_TOKEN", "")

    if not access_token:
        print("❌ BEEPER_ACCESS_TOKEN required")
        print("   export BEEPER_ACCESS_TOKEN='your_token_here'")
        return

    # Try to set up quantum harness
    harness = None
    try:
        from src.quantum.zero_latency_harness import ZeroLatencyHarness
        harness = ZeroLatencyHarness(
            enable_flipper=True,
            enable_lora=True,
            enable_vfile=True,
        )
        print("  ✓ Quantum harness connected")
    except Exception as e:
        print(f"  ⚠ No quantum harness: {e}")

    bridge = BeeperQuantumBridge(
        homeserver=homeserver,
        access_token=access_token,
        quantum_harness=harness,
    )

    # Set bot profile
    try:
        bridge.client.set_display_name("Agent-X Quantum Bot")
    except Exception:
        pass

    bridge.sync_loop(room_ids=room_ids)


if __name__ == "__main__":
    run_beeper_bridge()
