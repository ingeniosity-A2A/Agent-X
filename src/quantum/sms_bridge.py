"""
Termux SMS → Agent-X Bridge with VFile Transport

Runs on Android (Termux) to:
1. Poll for incoming SMS via termux-sms-list
2. Wrap each SMS as an Interaction Quantum
3. Package as VFile for Beeper/A2A transport
4. Forward to Agent-X API for processing
5. Track seen messages to avoid duplicates

Requirements:
  pkg install termux-api
  pip install requests

Usage:
  python3 -m src.quantum.sms_bridge
"""

import subprocess
import json
import time
import os
import hashlib
import requests
from datetime import datetime, timezone

# ─── Config ──────────────────────────────────────────────────────────

AGENT_X_URL = os.environ.get("AGENT_X_URL", "http://127.0.0.1:7474")
APPLESS_URL = os.environ.get("APPLESS_URL", "http://127.0.0.1:7476")
SEEN_FILE = os.environ.get("SMS_SEEN_FILE", os.path.expanduser("~/Agent-X/sms_seen.txt"))
POLL_INTERVAL = int(os.environ.get("SMS_POLL_INTERVAL", "5"))
BEEPER_ENABLED = os.environ.get("BEEPER_ENABLED", "false").lower() == "true"
BEEPER_ROOM = os.environ.get("BEEPER_ROOM", "")
BEEPER_TOKEN = os.environ.get("BEEPER_TOKEN", "")


# ─── SMS Layer ───────────────────────────────────────────────────────

def get_latest_sms(count: int = 5) -> list[dict]:
    """Fetch latest SMS messages via Termux API."""
    try:
        out = subprocess.check_output(
            ["termux-sms-list", "-l", str(count)],
            text=True,
            timeout=10,
        )
        return json.loads(out)
    except FileNotFoundError:
        print("⚠ termux-sms-list not found. Install: pkg install termux-api")
        return []
    except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
        print(f"⚠ SMS read error: {e}")
        return []


def seen_ids() -> set[str]:
    """Load set of already-processed SMS IDs."""
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(f.read().splitlines())
    return set()


def mark_seen(msg_ids: set[str]):
    """Persist seen SMS IDs."""
    os.makedirs(os.path.dirname(SEEN_FILE) or ".", exist_ok=True)
    with open(SEEN_FILE, "w") as f:
        f.write("\n".join(msg_ids))


# ─── Quantum Builder ─────────────────────────────────────────────────

def sms_to_quantum(msg: dict) -> dict:
    """
    Convert an SMS message into an Interaction Quantum.
    
    This captures:
    - Source: the sender's phone number as a DID
    - Intent: inferred from message content
    - Payload: the raw SMS data
    - Temporal: timestamp of receipt
    """
    sender = msg.get("number", "unknown")
    body = msg.get("body", "")
    msg_id = msg.get("id", "")
    received = msg.get("received", datetime.now(timezone.utc).isoformat())

    # Derive DID from phone number
    source_did = f"did:sms:{sender.replace('+', '').replace('-', '')}"

    # Simple intent classification
    intent = classify_intent(body)

    # Build quantum
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")
    quantum = {
        "quantum_id": "",  # Computed below
        "timestamp": now,
        "source_did": source_did,
        "parent_quanta": [],
        "version": "2.0",
        "cognitive_state": {
            "intent": intent,
            "confidence": 0.85,
            "agent_role": "router",
        },
        "signal_metadata": {
            "rf_physical": {
                "transceiver": "cellular",
                "modulation": "SMS",
                "frequency_hz": 0,
            },
            "temporal_index": {
                "gsap_ticker_ms": int(time.time() * 1000),
                "rssi_dbm": 0,
            },
        },
        "payload": {
            "sms_id": str(msg_id),
            "sender": sender,
            "body": body,
            "received": received,
            "transport": "termux-sms",
        },
    }

    # Compute deterministic hash
    hashable = {k: v for k, v in quantum.items() if k != "quantum_id"}
    canonical = json.dumps(hashable, sort_keys=True, separators=(",", ":"))
    quantum["quantum_id"] = hashlib.sha256(canonical.encode()).hexdigest()

    return quantum


def classify_intent(body: str) -> str:
    """Simple keyword-based intent classification for SMS."""
    lower = body.lower()

    if any(w in lower for w in ["price", "cost", "how much", "quote", "estimate"]):
        return "quote"
    if any(w in lower for w in ["schedule", "book", "appointment", "available", "tomorrow"]):
        return "schedule"
    if any(w in lower for w in ["cancel", "reschedule", "change"]):
        return "reschedule"
    if any(w in lower for w in ["complaint", "problem", "issue", "wrong", "broken"]):
        return "complaint"
    if any(w in lower for w in ["review", "rating", "stars", "recommend"]):
        return "review"
    if any(w in lower for w in ["invoice", "payment", "pay", "bill"]):
        return "billing"
    if any(w in lower for w in ["help", "support", "assist"]):
        return "help"
    if any(w in lower for w in ["thank", "thanks", "appreciate"]):
        return "gratitude"
    if any(w in lower for w in ["hi", "hello", "hey"]):
        return "greeting"

    return "general_inquiry"


# ─── VFile Wrapper ───────────────────────────────────────────────────

def quantum_to_vfile(quantum: dict) -> dict:
    """Wrap a quantum in a VFile 2.0 envelope."""
    return {
        "vfile_version": "2.0",
        "type": "interaction_quantum",
        "quantum": quantum,
        "beep_channel": "wss://a2a.ava.network/beeper",
        "delegation_chain": [],
        "metadata": {
            "source": "termux-sms-bridge",
            "created": datetime.now(timezone.utc).isoformat(),
        },
    }


# ─── Agent-X Integration ────────────────────────────────────────────

def forward_to_agentx(quantum: dict) -> dict:
    """Forward an SMS quantum to Agent-X for processing."""
    payload = quantum.get("payload", {})
    body = payload.get("body", "")
    sender = payload.get("sender", "")

    # Try Appless endpoint first (port 7476)
    try:
        resp = requests.post(
            f"{APPLESS_URL}/api/process",
            json={
                "query": body,
                "context": {
                    "source": "sms",
                    "sender": sender,
                    "quantum_id": quantum["quantum_id"],
                    "transport": "termux",
                },
            },
            timeout=30,
        )
        if resp.status_code == 200:
            return {"endpoint": "appless", "result": resp.json()}
    except Exception:
        pass

    # Fall back to Agent-X direct (port 7474)
    try:
        resp = requests.post(
            f"{AGENT_X_URL}/process",
            json={
                "query": body,
                "context": {
                    "source": "sms",
                    "sender": sender,
                    "quantum_id": quantum["quantum_id"],
                },
            },
            timeout=30,
        )
        if resp.status_code == 200:
            return {"endpoint": "agent-x", "result": resp.json()}
    except Exception as e:
        return {"endpoint": "none", "error": str(e)}

    return {"endpoint": "none", "error": "All endpoints failed"}


def send_reply_sms(number: str, message: str):
    """Send an SMS reply via Termux API."""
    try:
        subprocess.run(
            ["termux-sms-send", "-n", number, message],
            check=True,
            timeout=15,
        )
        print(f"  📤 Replied to {number}")
    except Exception as e:
        print(f"  ⚠ Failed to send reply: {e}")


# ─── Beeper Bridge ───────────────────────────────────────────────────

def send_to_beeper(vfile: dict):
    """Send VFile to Beeper room as rich card."""
    if not BEEPER_ENABLED or not BEEPER_ROOM or not BEEPER_TOKEN:
        return

    try:
        from src.quantum.vfile import render_beeper_card
        from src.quantum.vfile import VFile as VFileObj

        vf = VFileObj.from_dict(vfile)
        card = render_beeper_card(vf)

        # Matrix API send
        resp = requests.put(
            f"https://matrix.org/_matrix/client/v3/rooms/{BEEPER_ROOM}/send/m.room.message",
            headers={"Authorization": f"Bearer {BEEPER_TOKEN}"},
            json=card,
            timeout=30,
        )
        if resp.status_code == 200:
            print("  🐝 Sent to Beeper")
    except Exception as e:
        print(f"  ⚠ Beeper send failed: {e}")


# ─── Main Loop ───────────────────────────────────────────────────────

def main():
    print("📱 Termux SMS → Agent-X Bridge")
    print(f"  Agent-X:   {AGENT_X_URL}")
    print(f"  Appless:   {APPLESS_URL}")
    print(f"  Beeper:    {'enabled' if BEEPER_ENABLED else 'disabled'}")
    print(f"  Poll:      every {POLL_INTERVAL}s")
    print(f"  Seen file: {SEEN_FILE}")
    print()

    while True:
        try:
            msgs = get_latest_sms()
            seen = seen_ids()
            new_seen = set(seen)

            for msg in msgs:
                msg_id = str(msg.get("id", ""))
                if msg_id in seen:
                    continue

                sender = msg.get("number", "Unknown")
                body = msg.get("body", "")

                print(f"\n📩 New SMS from {sender}: {body[:80]}...")

                # 1. Convert to Interaction Quantum
                quantum = sms_to_quantum(msg)
                print(f"  ⚛ Quantum: {quantum['quantum_id'][:16]}...")

                # 2. Wrap in VFile
                vfile = quantum_to_vfile(quantum)
                print(f"  📦 VFile: v{vfile['vfile_version']}")

                # 3. Forward to Agent-X
                result = forward_to_agentx(quantum)
                endpoint = result.get("endpoint", "none")

                if "result" in result:
                    agent_result = result["result"]
                    print(f"  ✅ {endpoint} processed (tier={agent_result.get('tier', '?')})")

                    # Extract reply from agent response
                    response = agent_result.get("response", {})
                    actions = response.get("actions", [])

                    # Look for SMS reply action
                    for action in actions:
                        tool = action.get("tool", action.get("type", ""))
                        params = action.get("params", action.get("details", {}))

                        if "sms" in tool.lower() or "respond" in tool.lower():
                            reply_msg = params.get("message", params.get("body", ""))
                            if reply_msg:
                                send_reply_sms(sender, reply_msg)
                                break
                else:
                    print(f"  ❌ {endpoint}: {result.get('error', 'unknown')}")

                # 4. Send to Beeper (if enabled)
                send_to_beeper(vfile)

                new_seen.add(msg_id)

            # Persist seen IDs
            if new_seen != seen:
                mark_seen(new_seen)

        except KeyboardInterrupt:
            print("\n👋 Stopped.")
            break
        except Exception as e:
            print(f"⚠ Bridge error: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
