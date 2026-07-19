"""
Termux Hardware Bridge

Real hardware integration via Termux API:
- SMS send/receive (termux-sms-list, termux-sms-send)
- Telephony (termux-telephony-deviceinfo, termux-telephony-call)
- Camera (termux-camera-photo)
- Location (termux-location)
- Sensors (termux-sensor)
- Bluetooth (termux-bluetooth-scan)
- NFC (termux-nfc)
- Battery (termux-battery-status)
- Notifications (termux-notification)
- TTS (termux-tts-speak)
- Vibrate (termux-vibrate)
- Torch (termux-torch)
- WiFi (termux-wifi-*)
- Contacts (termux-contact-*)

Each hardware interaction becomes an Interaction Quantum
with full RF/signal metadata for mesh propagation.
"""

from __future__ import annotations

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import Optional


def _run_termux(args: list[str], timeout: int = 15) -> dict:
    """Run a termux-api command and return parsed JSON output."""
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            return {"error": result.stderr.strip() or "command failed"}
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            return {"output": result.stdout.strip()}
    except FileNotFoundError:
        return {"error": f"termux-api not installed. Run: pkg install termux-api"}
    except subprocess.TimeoutExpired:
        return {"error": "command timed out"}


# ─── SMS ─────────────────────────────────────────────────────────────

class TermuxSMS:
    """Termux SMS send/receive with quantum integration."""

    SEEN_FILE = os.path.expanduser("~/.openclaw/workspace/Agent-X/data/sms_seen.txt")

    @staticmethod
    def list(count: int = 10, offset: int = 0) -> list[dict]:
        """List recent SMS messages."""
        result = _run_termux(["termux-sms-list", "-l", str(count), "-o", str(offset)])
        if isinstance(result, list):
            return result
        return []

    @staticmethod
    def send(number: str, message: str) -> dict:
        """Send an SMS message."""
        return _run_termux(["termux-sms-send", "-n", number, message])

    @staticmethod
    def get_new() -> list[dict]:
        """Get only new (unseen) SMS messages."""
        seen = TermuxSMS._load_seen()
        msgs = TermuxSMS.list(count=20)
        new_msgs = []
        for msg in msgs:
            msg_id = str(msg.get("id", ""))
            if msg_id not in seen:
                new_msgs.append(msg)
                seen.add(msg_id)
        TermuxSMS._save_seen(seen)
        return new_msgs

    @staticmethod
    def _load_seen() -> set:
        if os.path.exists(TermuxSMS.SEEN_FILE):
            with open(TermuxSMS.SEEN_FILE) as f:
                return set(f.read().splitlines())
        return set()

    @staticmethod
    def _save_seen(seen: set):
        os.makedirs(os.path.dirname(TermuxSMS.SEEN_FILE), exist_ok=True)
        with open(TermuxSMS.SEEN_FILE, "w") as f:
            f.write("\n".join(seen))


# ─── Telephony ───────────────────────────────────────────────────────

class TermuxTelephony:
    """Termux telephony integration."""

    @staticmethod
    def device_info() -> dict:
        """Get cellular device info."""
        return _run_termux(["termux-telephony-deviceinfo"])

    @staticmethod
    def call(number: str) -> dict:
        """Initiate a phone call."""
        return _run_termux(["termux-telephony-call", number])

    @staticmethod
    def cell_info() -> dict:
        """Get cell tower info (for location/RF metadata)."""
        return _run_termux(["termux-telephony-cellinfo"])


# ─── Location ────────────────────────────────────────────────────────

class TermuxLocation:
    """Termux GPS/network location."""

    @staticmethod
    def get(provider: str = "gps") -> dict:
        """Get current location. Provider: gps, network, passive."""
        return _run_termux(["termux-location", "-p", provider])

    @staticmethod
    def get_all() -> dict:
        """Get location from all providers."""
        results = {}
        for provider in ["gps", "network", "passive"]:
            results[provider] = TermuxLocation.get(provider)
        return results


# ─── Sensors ─────────────────────────────────────────────────────────

class TermuxSensors:
    """Termux device sensors."""

    @staticmethod
    def list_sensors() -> dict:
        """List available sensors."""
        return _run_termux(["termux-sensor", "-l"])

    @staticmethod
    def read(sensor_names: list[str] = None) -> dict:
        """Read sensor data."""
        args = ["termux-sensor"]
        if sensor_names:
            args.extend(["-s", ",".join(sensor_names)])
        args.extend(["-n", "1"])  # Single reading
        return _run_termux(args, timeout=10)

    @staticmethod
    def read_all() -> dict:
        """Read all available sensors."""
        return TermuxSensors.read()


# ─── Bluetooth ───────────────────────────────────────────────────────

class TermuxBluetooth:
    """Termux Bluetooth scanning."""

    @staticmethod
    def scan(duration: int = 10) -> dict:
        """Scan for nearby Bluetooth devices."""
        return _run_termux(["termux-bluetooth-scan"], timeout=duration + 5)

    @staticmethod
    def info() -> dict:
        """Get Bluetooth adapter info."""
        return _run_termux(["termux-bluetooth-info"])


# ─── NFC ─────────────────────────────────────────────────────────────

class TermuxNFC:
    """Termux NFC tag reading."""

    @staticmethod
    def read() -> dict:
        """Read an NFC tag (blocks until tag detected)."""
        return _run_termux(["termux-nfc"], timeout=30)

    @staticmethod
    def scan_available() -> bool:
        """Check if NFC is available."""
        result = _run_termux(["termux-nfc", "-i"])
        return "error" not in result


# ─── Camera ──────────────────────────────────────────────────────────

class TermuxCamera:
    """Termux camera integration."""

    @staticmethod
    def photo(output_path: str = "/tmp/termux_photo.jpg", camera_id: int = 0) -> dict:
        """Take a photo."""
        return _run_termux([
            "termux-camera-photo",
            "-c", str(camera_id),
            output_path,
        ])

    @staticmethod
    def photo_base64(camera_id: int = 0) -> Optional[str]:
        """Take a photo and return as base64."""
        import base64
        path = f"/tmp/termux_{int(time.time())}.jpg"
        result = TermuxCamera.photo(path, camera_id)
        if os.path.exists(path):
            with open(path, "rb") as f:
                data = base64.b64encode(f.read()).decode()
            os.remove(path)
            return data
        return None


# ─── Battery ─────────────────────────────────────────────────────────

class TermuxBattery:
    """Termux battery status."""

    @staticmethod
    def status() -> dict:
        """Get battery status."""
        return _run_termux(["termux-battery-status"])


# ─── Notifications ───────────────────────────────────────────────────

class TermuxNotification:
    """Termux notification system."""

    @staticmethod
    def send(
        title: str,
        content: str,
        priority: str = "default",
        vibrate: str = None,
        sound: bool = True,
        action: str = None,
        id: str = None,
    ) -> dict:
        """Send a notification."""
        args = ["termux-notification"]
        args.extend(["--title", title])
        args.extend(["--content", content])
        if priority:
            args.extend(["--priority", priority])
        if vibrate:
            args.extend(["--vibrate", vibrate])
        if not sound:
            args.append("--sound")
            args.append("false")
        if action:
            args.extend(["--action", action])
        if id:
            args.extend(["--id", id])
        return _run_termux(args)

    @staticmethod
    def remove(notification_id: str) -> dict:
        """Remove a notification."""
        return _run_termux(["termux-notification-remove", notification_id])

    @staticmethod
    def list() -> dict:
        """List active notifications."""
        return _run_termux(["termux-notification-list"])


# ─── TTS ─────────────────────────────────────────────────────────────

class TermuxTTS:
    """Termux text-to-speech."""

    @staticmethod
    def speak(text: str, engine: str = None, language: str = "en", pitch: float = 1.0, rate: float = 1.0) -> dict:
        """Speak text using TTS."""
        args = ["termux-tts-speak"]
        if engine:
            args.extend(["-e", engine])
        args.extend(["-l", language])
        args.extend(["-p", str(pitch)])
        args.extend(["-r", str(rate)])
        args.append(text)
        return _run_termux(args)

    @staticmethod
    def engines() -> dict:
        """List available TTS engines."""
        return _run_termux(["termux-tts-engines"])


# ─── Hardware Quantum Bridge ─────────────────────────────────────────

class TermuxHardwareBridge:
    """
    Bridges Termux hardware to Interaction Quanta.
    
    Each hardware interaction (SMS, call, sensor read, etc.)
    produces an Interaction Quantum with full signal metadata.
    """

    def __init__(self, quantum_harness=None):
        self.harness = quantum_harness
        self.sms = TermuxSMS()
        self.telephony = TermuxTelephony()
        self.location = TermuxLocation()
        self.sensors = TermuxSensors()
        self.bluetooth = TermuxBluetooth()
        self.nfc = TermuxNFC()
        self.camera = TermuxCamera()
        self.battery = TermuxBattery()
        self.notification = TermuxNotification()
        self.tts = TermuxTTS()

    def poll_sms(self) -> list[dict]:
        """Poll for new SMS and process through quantum harness."""
        new_msgs = self.sms.get_new()
        results = []
        for msg in new_msgs:
            sender = msg.get("number", "unknown")
            body = msg.get("body", "")
            
            if self.harness:
                result = self.harness.process(body, {
                    "source": "sms",
                    "sender": sender,
                    "transport": "termux",
                })
                results.append(result)
                
                # Auto-reply if agent produced an SMS action
                response = result.get("response", {})
                actions = response.get("actions", [])
                for action in actions:
                    tool = action.get("tool", "")
                    params = action.get("params", {})
                    if "sms" in tool.lower():
                        reply = params.get("message", "")
                        if reply:
                            self.sms.send(sender, reply)
                            self.notification.send(
                                title="SMS Reply Sent",
                                content=f"To {sender}: {reply[:80]}...",
                                priority="low",
                            )
        return results

    def get_location_quantum(self) -> dict:
        """Get current location as quantum metadata."""
        loc = self.location.get()
        battery = self.battery.status()
        
        return {
            "location": loc,
            "battery": battery,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def send_notification(self, title: str, content: str, priority: str = "default"):
        """Send a Termux notification."""
        return self.notification.send(title, content, priority)

    def speak(self, text: str):
        """Speak text via TTS."""
        return self.tts.speak(text)

    def scan_environment(self) -> dict:
        """
        Full environment scan: location + sensors + bluetooth + battery.
        Returns data for quantum signal metadata.
        """
        return {
            "location": self.location.get(),
            "sensors": self.sensors.read(),
            "bluetooth": self.bluetooth.scan(duration=5),
            "battery": self.battery.status(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# ─── SMS Polling Daemon ─────────────────────────────────────────────

def run_sms_daemon(
    harness=None,
    poll_interval: int = 5,
    auto_reply: bool = True,
):
    """
    Background SMS polling daemon.
    
    Continuously polls for new SMS, processes through
    the quantum harness, and auto-replies.
    """
    bridge = TermuxHardwareBridge(quantum_harness=harness)
    
    print("📱 Termux SMS Daemon")
    print(f"  Poll interval: {poll_interval}s")
    print(f"  Auto-reply: {auto_reply}")
    print(f"  Harness: {'quantum' if harness else 'none'}")
    print()

    while True:
        try:
            results = bridge.poll_sms()
            for r in results:
                tier = r.get("tier", "?")
                latency = r.get("latency_ms", 0)
                qid = r.get("quantum", {}).get("id", "")[:16]
                print(f"  [{tier}] {latency:.0f}ms | Q:{qid}...")

        except KeyboardInterrupt:
            print("\n👋 Stopped.")
            break
        except Exception as e:
            print(f"⚠ Error: {e}")

        time.sleep(poll_interval)


if __name__ == "__main__":
    run_sms_daemon()
