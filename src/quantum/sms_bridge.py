"""
Termux SMS → Agent-X Bridge with VFile Transport

Transport-only Android bridge. SMS is an observation/input; Ava007 owns
intent classification and cognition. Agent-X receives the message payload
without a locally manufactured CognitiveState.
"""

import subprocess
import json
import time
import os
import hashlib
import requests
from datetime import datetime, timezone

AGENT_X_URL = os.environ.get("AGENT_X_URL", "http://127.0.0.1:7474")
APPLESS_URL = os.environ.get("APPLESS_URL", "http://127.0.0.1:7476")
SEEN_FILE = os.environ.get("SMS_SEEN_FILE", os.path.expanduser("~/agent-x/sms_seen.txt"))
POLL_INTERVAL = int(os.environ.get("SMS_POLL_INTERVAL", "5"))
BEEPER_ENABLED = os.environ.get("BEEPER_ENABLED", "false").lower() == "true"
BEEPER_ROOM = os.environ.get("BEEPER_ROOM", "")
BEEPER_TOKEN = os.environ.get("BEEPER_TOKEN", "")


def get_latest_sms(count: int = 5) -> list[dict]:
    """Fetch latest SMS messages via Termux API."""
    try:
        out = subprocess.check_output(["termux-sms-list", "-l", str(count)], text=True, timeout=10)
        return json.loads(out)
    except FileNotFoundError:
        print("⚠ termux-sms-list not found. Install: pkg install termux-api")
        return []
    except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
        print(f"⚠ SMS read error: {e}")
        return []


def seen_ids() -> set[str]:
    if os.path.exists(SEEN_FILE):
        with open(SEEN_FILE) as f:
            return set(f.read().splitlines())
    return set()


def mark_seen(msg_ids: set[str]):
    os.makedirs(os.path.dirname(SEEN_FILE) or ".", exist_ok=True)
    with open(SEEN_FILE, "w") as f:
        f.write("\n".join(msg_ids))


def sms_to_quantum(msg: dict) -> dict:
    """Wrap an SMS observation as a substrate Interaction Quantum."""
    sender = msg.get("number", "unknown")
    body = msg.get("body", "")
    msg_id = msg.get("id", "")
    received = msg.get("received", datetime.now(timezone.utc).isoformat())
    source_did = f"did:sms:{sender.replace('+', '').replace('-', '')}"

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")
    quantum = {
        "quantum_id": "",
        "timestamp": now,
        "source_did": source_did,
        "parent_quanta": [],
        "version": "2.0",
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
            "observation_type": "sms",
        },
    }

    hashable = {k: v for k, v in quantum.items() if k != "quantum_id"}
    canonical = json.dumps(hashable, sort_keys=True, separators=(",", ":"))
    quantum["quantum_id"] = hashlib.sha256(canonical.encode()).hexdigest()
    return quantum


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


def forward_to_agentx(quantum: dict) -> dict:
    """Forward an SMS observation to Agent-X without local intent inference."""
    payload = quantum.get("payload", {})
    body = payload.get("body", "")
    sender = payload.get("sender", "")
    context = {
        "source": "sms",
        "sender": sender,
        "quantum_id": quantum["quantum_id"],
        "transport": "termux",
    }

    try:
        resp = requests.post(f"{APPLESS_URL}/api/process", json={"query": body, "context": context}, timeout=30)
        if resp.status_code == 200:
            return {"endpoint": "appless", "result": resp.json()}
    except Exception:
        pass

    try:
        resp = requests.post(f"{AGENT_X_URL}/process", json={"query": body, "context": context}, timeout=30)
        if resp.status_code == 200:
            return {"endpoint": "agent-x", "result": resp.json()}
    except Exception as e:
        return {"endpoint": "none", "error": str(e)}

    return {"endpoint": "none", "error": "All endpoints failed"}


def send_reply_sms(number: str, message: str):
    """Send an SMS reply via Termux API."""
    try:
        subprocess.run(["termux-sms-send", "-n", number, message], check=True, timeout=15)
        print(f"  📤 Replied to {number}")
    except Exception as e:
        print(f"  ⚠ Failed to send reply: {e}")


def send_to_beeper(vfile: dict):
    """Send VFile to Beeper room as rich card."""
    if not BEEPER_ENABLED or not BEEPER_ROOM or not BEEPER_TOKEN:
        return
    try:
        from src.quantum.vfile import render_beeper_card, VFile as VFileObj
        vf = VFileObj.from_dict(vfile)
        card = render_beeper_card(vf)
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

                quantum = sms_to_quantum(msg)
                print(f"  ⚛ Quantum: {quantum['quantum_id'][:16]}...")
                vfile = quantum_to_vfile(quantum)
                print(f"  📦 VFile: v{vfile['vfile_version']}")

                result = forward_to_agentx(quantum)
                endpoint = result.get("endpoint", "none")
                if "result" in result:
                    agent_result = result["result"]
                    print(f"  ✅ {endpoint} processed (tier={agent_result.get('tier', '?')})")
                    response = agent_result.get("response", {})
                    actions = response.get("actions", [])
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

                send_to_beeper(vfile)
                new_seen.add(msg_id)

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
