"""
Flipper Zero Sub-GHz Command Encoder

Encodes Interaction Quanta as sub-GHz RF commands that a
Flipper Zero can transmit/receive. Enables:

- Access control replay (garage doors, gates, barriers)
- Sensor data collection (weather stations, IoT)
- Remote control (lights, relays, actuators)
- Mesh relay bridging (Flipper ↔ LoRa mesh)

Supported protocols:
- Fixed code (PT2260/PT2262)
- Rolling code (Keeloq, Nice Flo)
- Raw RF signal capture/replay
- Custom OOK/FSK modulation
"""

import hashlib
import json
import os
import struct
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class FlipperProtocol(str, Enum):
    FIXED_CODE = "fixed_code"         # PT2260/PT2262
    ROLLING_CODE = "rolling_code"     # Keeloq, Nice Flo
    RAW_SIGNAL = "raw_signal"         # Captured RF
    CUSTOM_OOK = "custom_ook"         # On-Off Keying
    CUSTOM_FSK = "custom_fsk"         # Frequency Shift Keying
    BAD_USB = "bad_usb"               # HID keyboard emulation
    SUB_GHZ_STATIC = "subghz_static"  # Static sub-GHz


class FlipperFrequency(str, Enum):
    FREQ_315 = "315000000"    # US (garage doors, remotes)
    FREQ_390 = "390000000"    # EU remotes
    FREQ_433 = "433920000"    # EU (most common)
    FREQ_868 = "868350000"    # EU LoRa/ISM
    FREQ_915 = "915000000"    # US LoRa/ISM


@dataclass
class FlipperSignal:
    """A single Flipper Zero sub-GHz signal."""
    protocol: FlipperProtocol
    frequency: str = FlipperFrequency.FREQ_433
    data: bytes = b""
    bit_length: int = 0
    repeat_count: int = 3
    te_us: int = 0              # Timing element in microseconds
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = {
            "protocol": self.protocol.value,
            "frequency": self.frequency,
            "data_hex": self.data.hex(),
            "bit_length": self.bit_length,
            "repeat_count": self.repeat_count,
        }
        if self.te_us:
            d["te_us"] = self.te_us
        if self.metadata:
            d["metadata"] = self.metadata
        return d


@dataclass
class FlipperCommand:
    """A Flipper Zero command (may contain multiple signals)."""
    command_id: str
    name: str
    signals: list[FlipperSignal] = field(default_factory=list)
    quantum_id: Optional[str] = None      # Source quantum
    source_did: Optional[str] = None
    timestamp: str = ""
    payload: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "command_id": self.command_id,
            "name": self.name,
            "signals": [s.to_dict() for s in self.signals],
            "quantum_id": self.quantum_id,
            "source_did": self.source_did,
            "timestamp": self.timestamp,
            "payload": self.payload,
        }

    def to_flipper_file(self) -> str:
        """
        Generate a .sub file for Flipper Zero.
        
        Format:
        Filetype: Flipper SubGhz RAW File
        Frequency: 433920000
        Preset: FuriHalSubGhzPresetOok650Async
        Protocol: ...
        """
        lines = [
            "Filetype: Flipper SubGhz RAW File",
            "Version: 1",
        ]
        
        for signal in self.signals:
            lines.append(f"Frequency: {signal.frequency}")
            
            if signal.protocol == FlipperProtocol.RAW_SIGNAL:
                lines.append("Preset: FuriHalSubGhzPresetOok650Async")
                lines.append("Protocol: RAW")
                # RAW data as signed 16-bit samples
                raw_data = " ".join(str(b - 128) for b in signal.data[:256])
                lines.append(f"RAW_Data: {raw_data}")
            
            elif signal.protocol == FlipperProtocol.FIXED_CODE:
                lines.append("Preset: FuriHalSubGhzPresetOok650Async")
                lines.append(f"Protocol: Princetons")
                lines.append(f"Bit: {signal.bit_length}")
                lines.append(f"Key: {signal.data.hex().upper()}")
                lines.append(f"TE: {signal.te_us}")
            
            elif signal.protocol == FlipperProtocol.CUSTOM_OOK:
                lines.append("Preset: FuriHalSubGhzPresetOok650Async")
                lines.append("Protocol: Custom")
                lines.append(f"Bit: {signal.bit_length}")
                lines.append(f"Key: {signal.data.hex().upper()}")
            
            elif signal.protocol == FlipperProtocol.CUSTOM_FSK:
                lines.append("Preset: FuriHalSubGhzPreset2FSKDev238Async")
                lines.append("Protocol: Custom")
                lines.append(f"Bit: {signal.bit_length}")
                lines.append(f"Key: {signal.data.hex().upper()}")

        return "\n".join(lines)


# ─── Encoder ─────────────────────────────────────────────────────────

class FlipperEncoder:
    """
    Encodes Interaction Quanta as Flipper Zero commands.
    
    Maps quantum intents to physical-world actions:
    - dispatch → access control (open gate/barrier)
    - inventory → sensor query
    - alert → RF beacon
    - custom → raw signal
    """

    def __init__(self, default_frequency: str = FlipperFrequency.FREQ_433):
        self.default_frequency = default_frequency
        self.command_log: list[FlipperCommand] = []

    def encode_quantum(self, quantum) -> FlipperCommand:
        """
        Encode an Interaction Quantum as a Flipper Zero command.
        
        The quantum's cognitive_state.intent determines the command type.
        """
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        intent = q.get("cognitive_state", {}).get("intent", "unknown")
        payload = q.get("payload", {})

        from datetime import datetime, timezone
        cmd = FlipperCommand(
            command_id=hashlib.sha256(json.dumps(q, sort_keys=True).encode()).hexdigest()[:16],
            name=f"quantum_{intent}",
            quantum_id=q.get("quantum_id", ""),
            source_did=q.get("source_did", ""),
            timestamp=datetime.now(timezone.utc).isoformat(),
            payload=payload,
        )

        # Route by intent
        if intent in ("dispatch", "access", "gate", "barrier"):
            cmd.signals.append(self._encode_access_control(payload))
        elif intent in ("inventory", "sensor", "check"):
            cmd.signals.append(self._encode_sensor_query(payload))
        elif intent in ("alert", "emergency", "alarm"):
            cmd.signals.append(self._encode_alert_beacon(payload))
        elif intent in ("light", "relay", "switch", "control"):
            cmd.signals.append(self._encode_relay_control(payload))
        else:
            cmd.signals.append(self._encode_custom(payload))

        self.command_log.append(cmd)
        return cmd

    def encode_raw(self, data: bytes, frequency: str = None) -> FlipperCommand:
        """Encode raw bytes as a Flipper sub-GHz signal."""
        signal = FlipperSignal(
            protocol=FlipperProtocol.RAW_SIGNAL,
            frequency=frequency or self.default_frequency,
            data=data,
            bit_length=len(data) * 8,
        )
        cmd = FlipperCommand(
            command_id=hashlib.sha256(data).hexdigest()[:16],
            name="raw_signal",
            signals=[signal],
        )
        self.command_log.append(cmd)
        return cmd

    def encode_fixed_code(self, code: int, bits: int = 24, te: int = 350) -> FlipperCommand:
        """Encode a fixed code (PT2260/PT2262 format)."""
        data = code.to_bytes((bits + 7) // 8, byteorder="big")
        signal = FlipperSignal(
            protocol=FlipperProtocol.FIXED_CODE,
            frequency=self.default_frequency,
            data=data,
            bit_length=bits,
            te_us=te,
        )
        cmd = FlipperCommand(
            command_id=f"fixed_{code:06x}",
            name=f"fixed_code_{code:06x}",
            signals=[signal],
        )
        self.command_log.append(cmd)
        return cmd

    # ─── Intent Encoders ─────────────────────────────────────────────

    def _encode_access_control(self, payload: dict) -> FlipperSignal:
        """Encode access control command (gate, garage, barrier)."""
        # Generate a deterministic code from payload
        code_data = json.dumps(payload, sort_keys=True).encode()
        code_hash = hashlib.sha256(code_data).digest()
        code_int = int.from_bytes(code_hash[:3], "big")  # 24-bit code

        data = code_int.to_bytes(3, "big")
        return FlipperSignal(
            protocol=FlipperProtocol.FIXED_CODE,
            frequency=FlipperFrequency.FREQ_315,  # US garage doors
            data=data,
            bit_length=24,
            te_us=350,
            repeat_count=5,
            metadata={"type": "access_control", "code": f"{code_int:06x}"},
        )

    def _encode_sensor_query(self, payload: dict) -> FlipperSignal:
        """Encode sensor query command."""
        # OOK pulse pattern for sensor wake-up
        # Pattern: 10101010 (alternating) + address + command
        address = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).digest()[:2]
        command = b"\x01"  # Query command
        
        data = b"\xAA" + address + command  # 0xAA = wake pattern
        return FlipperSignal(
            protocol=FlipperProtocol.CUSTOM_OOK,
            frequency=FlipperFrequency.FREQ_433,
            data=data,
            bit_length=len(data) * 8,
            te_us=500,
            repeat_count=3,
            metadata={"type": "sensor_query", "address": address.hex()},
        )

    def _encode_alert_beacon(self, payload: dict) -> FlipperSignal:
        """Encode emergency/alert beacon."""
        # High-priority pattern: rapid pulses
        severity = payload.get("severity", "medium")
        
        # Beacon pattern: header + severity code + payload hash
        header = b"\xFF\x00\xFF"  # Alert header
        severity_map = {"low": b"\x01", "medium": b"\x02", "high": b"\x03", "critical": b"\x04"}
        sev_code = severity_map.get(severity, b"\x02")
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).digest()[:4]
        
        data = header + sev_code + payload_hash
        return FlipperSignal(
            protocol=FlipperProtocol.CUSTOM_FSK,
            frequency=FlipperFrequency.FREQ_915,  # Long range
            data=data,
            bit_length=len(data) * 8,
            te_us=200,
            repeat_count=10,  # Repeat more for reliability
            metadata={"type": "alert_beacon", "severity": severity},
        )

    def _encode_relay_control(self, payload: dict) -> FlipperSignal:
        """Encode relay/switch control command."""
        device_id = payload.get("device_id", "default")
        state = payload.get("state", "on")  # on/off/toggle
        
        # Address from device ID
        addr = hashlib.sha256(device_id.encode()).digest()[:3]
        state_map = {"off": b"\x00", "on": b"\x01", "toggle": b"\x02"}
        state_code = state_map.get(state, b"\x01")
        
        data = addr + state_code
        return FlipperSignal(
            protocol=FlipperProtocol.FIXED_CODE,
            frequency=FlipperFrequency.FREQ_433,
            data=data,
            bit_length=32,
            te_us=400,
            repeat_count=4,
            metadata={"type": "relay_control", "device": device_id, "state": state},
        )

    def _encode_custom(self, payload: dict) -> FlipperSignal:
        """Encode a custom signal from arbitrary payload."""
        data = json.dumps(payload, sort_keys=True).encode()
        # Truncate to fit in a signal
        if len(data) > 64:
            data = data[:64]
        
        return FlipperSignal(
            protocol=FlipperProtocol.CUSTOM_OOK,
            frequency=self.default_frequency,
            data=data,
            bit_length=len(data) * 8,
            te_us=500,
            repeat_count=2,
            metadata={"type": "custom"},
        )

    # ─── File Output ─────────────────────────────────────────────────

    def save_flipper_file(self, command: FlipperCommand, filepath: str):
        """Save a command as a .sub file for Flipper Zero."""
        content = command.to_flipper_file()
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        with open(filepath, "w") as f:
            f.write(content)

    def save_all_commands(self, output_dir: str):
        """Save all logged commands as .sub files."""
        os.makedirs(output_dir, exist_ok=True)
        for i, cmd in enumerate(self.command_log):
            filepath = os.path.join(output_dir, f"{cmd.command_id}_{cmd.name}.sub")
            self.save_flipper_file(cmd, filepath)

    # ─── Stats ───────────────────────────────────────────────────────

    def stats(self) -> dict:
        return {
            "commands_encoded": len(self.command_log),
            "protocols_used": list(set(
                s.protocol.value for cmd in self.command_log for s in cmd.signals
            )),
        }


# ─── Quantum → Flipper Bridge ────────────────────────────────────────

def quantum_to_flipper(quantum, output_dir: str = None) -> FlipperCommand:
    """
    Convenience function: encode a quantum as a Flipper command
    and optionally save the .sub file.
    """
    encoder = FlipperEncoder()
    cmd = encoder.encode_quantum(quantum)
    
    if output_dir:
        filepath = os.path.join(output_dir, f"{cmd.command_id}.sub")
        encoder.save_flipper_file(cmd, filepath)
    
    return cmd
