"""Flipper Zero Sub-GHz command encoder for Agent-X capabilities."""

import hashlib
import json
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class FlipperProtocol(str, Enum):
    FIXED_CODE = "fixed_code"
    ROLLING_CODE = "rolling_code"
    RAW_SIGNAL = "raw_signal"
    CUSTOM_OOK = "custom_ook"
    CUSTOM_FSK = "custom_fsk"
    BAD_USB = "bad_usb"
    SUB_GHZ_STATIC = "subghz_static"


class FlipperFrequency(str, Enum):
    FREQ_315 = "315000000"
    FREQ_390 = "390000000"
    FREQ_433 = "433920000"
    FREQ_868 = "868350000"
    FREQ_915 = "915000000"


@dataclass
class FlipperSignal:
    protocol: FlipperProtocol
    frequency: str = FlipperFrequency.FREQ_433
    data: bytes = b""
    bit_length: int = 0
    repeat_count: int = 3
    te_us: int = 0
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        data = {"protocol": self.protocol.value, "frequency": self.frequency, "data_hex": self.data.hex(), "bit_length": self.bit_length, "repeat_count": self.repeat_count}
        if self.te_us:
            data["te_us"] = self.te_us
        if self.metadata:
            data["metadata"] = self.metadata
        return data


@dataclass
class FlipperCommand:
    command_id: str
    name: str
    signals: list[FlipperSignal] = field(default_factory=list)
    quantum_id: Optional[str] = None
    source_did: Optional[str] = None
    timestamp: str = ""
    payload: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"command_id": self.command_id, "name": self.name, "signals": [s.to_dict() for s in self.signals], "quantum_id": self.quantum_id, "source_did": self.source_did, "timestamp": self.timestamp, "payload": self.payload}

    def to_flipper_file(self) -> str:
        lines = ["Filetype: Flipper SubGhz RAW File", "Version: 1"]
        for signal in self.signals:
            lines.append(f"Frequency: {signal.frequency}")
            if signal.protocol == FlipperProtocol.RAW_SIGNAL:
                lines += ["Preset: FuriHalSubGhzPresetOok650Async", "Protocol: RAW", f"RAW_Data: {' '.join(str(b - 128) for b in signal.data[:256])}"]
            elif signal.protocol == FlipperProtocol.FIXED_CODE:
                lines += ["Preset: FuriHalSubGhzPresetOok650Async", "Protocol: Princetons", f"Bit: {signal.bit_length}", f"Key: {signal.data.hex().upper()}", f"TE: {signal.te_us}"]
            elif signal.protocol == FlipperProtocol.CUSTOM_OOK:
                lines += ["Preset: FuriHalSubGhzPresetOok650Async", "Protocol: Custom", f"Bit: {signal.bit_length}", f"Key: {signal.data.hex().upper()}"]
            elif signal.protocol == FlipperProtocol.CUSTOM_FSK:
                lines += ["Preset: FuriHalSubGhzPreset2FSKDev238Async", "Protocol: Custom", f"Bit: {signal.bit_length}", f"Key: {signal.data.hex().upper()}"]
        return "\n".join(lines)


class FlipperEncoder:
    """Encode substrate quanta into physical Flipper capability commands."""

    def __init__(self, default_frequency: str = FlipperFrequency.FREQ_433):
        self.default_frequency = default_frequency
        self.command_log: list[FlipperCommand] = []

    @staticmethod
    def _refs(q: dict) -> str:
        payload = q.get("payload", {}) or {}
        return str(payload.get("intent_id") or payload.get("capability") or q.get("intent") or "unknown")

    def encode_quantum(self, quantum) -> FlipperCommand:
        from datetime import datetime, timezone
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        intent = self._refs(q)
        payload = q.get("payload", {}) or {}
        cmd = FlipperCommand(
            command_id=hashlib.sha256(json.dumps(q, sort_keys=True).encode()).hexdigest()[:16],
            name=f"quantum_{intent}", quantum_id=q.get("quantum_id", ""),
            source_did=q.get("source_did", ""), timestamp=datetime.now(timezone.utc).isoformat(), payload=payload,
        )
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
        signal = FlipperSignal(FlipperProtocol.RAW_SIGNAL, frequency or self.default_frequency, data, len(data) * 8)
        cmd = FlipperCommand(hashlib.sha256(data).hexdigest()[:16], "raw_signal", [signal])
        self.command_log.append(cmd)
        return cmd

    def encode_fixed_code(self, code: int, bits: int = 24, te: int = 350) -> FlipperCommand:
        data = code.to_bytes((bits + 7) // 8, byteorder="big")
        signal = FlipperSignal(FlipperProtocol.FIXED_CODE, self.default_frequency, data, bits, te_us=te)
        cmd = FlipperCommand(f"fixed_{code:06x}", f"fixed_code_{code:06x}", [signal])
        self.command_log.append(cmd)
        return cmd

    def _encode_access_control(self, payload):
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).digest()
        code = int.from_bytes(digest[:3], "big")
        return FlipperSignal(FlipperProtocol.FIXED_CODE, FlipperFrequency.FREQ_315, code.to_bytes(3, "big"), 24, 5, 350, {"type": "access_control", "code": f"{code:06x}"})

    def _encode_sensor_query(self, payload):
        address = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).digest()[:2]
        data = b"\xAA" + address + b"\x01"
        return FlipperSignal(FlipperProtocol.CUSTOM_OOK, FlipperFrequency.FREQ_433, data, len(data) * 8, 3, 500, {"type": "sensor_query", "address": address.hex()})

    def _encode_alert_beacon(self, payload):
        severity = payload.get("severity", "medium")
        sev = {"low": b"\x01", "medium": b"\x02", "high": b"\x03", "critical": b"\x04"}.get(severity, b"\x02")
        data = b"\xFF\x00\xFF" + sev + hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).digest()[:4]
        return FlipperSignal(FlipperProtocol.CUSTOM_FSK, FlipperFrequency.FREQ_915, data, len(data) * 8, 10, 200, {"type": "alert_beacon", "severity": severity})

    def _encode_relay_control(self, payload):
        device_id = payload.get("device_id", "default")
        state = payload.get("state", "on")
        state_code = {"off": b"\x00", "on": b"\x01", "toggle": b"\x02"}.get(state, b"\x01")
        data = hashlib.sha256(device_id.encode()).digest()[:3] + state_code
        return FlipperSignal(FlipperProtocol.FIXED_CODE, FlipperFrequency.FREQ_433, data, 32, 4, 400, {"type": "relay_control", "device": device_id, "state": state})

    def _encode_custom(self, payload):
        data = json.dumps(payload, sort_keys=True).encode()[:64]
        return FlipperSignal(FlipperProtocol.CUSTOM_OOK, self.default_frequency, data, len(data) * 8, 2, 500, {"type": "custom"})

    def save_flipper_file(self, command: FlipperCommand, filepath: str):
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        with open(filepath, "w") as f:
            f.write(command.to_flipper_file())

    def save_all_commands(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        for cmd in self.command_log:
            self.save_flipper_file(cmd, os.path.join(output_dir, f"{cmd.command_id}_{cmd.name}.sub"))

    def stats(self) -> dict:
        return {"commands_encoded": len(self.command_log), "protocols_used": list(set(s.protocol.value for c in self.command_log for s in c.signals))}


def quantum_to_flipper(quantum, output_dir: str = None) -> FlipperCommand:
    encoder = FlipperEncoder()
    cmd = encoder.encode_quantum(quantum)
    if output_dir:
        encoder.save_flipper_file(cmd, os.path.join(output_dir, f"{cmd.command_id}.sub"))
    return cmd
