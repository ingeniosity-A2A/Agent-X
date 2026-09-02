"""Agent-X Quantum compatibility layer.

The canonical InteractionQuantum now lives in a2a-exoskeleton and is
substrate-only. This module preserves Agent-X's historical builder/data
imports while preventing cognitive state from becoming part of a quantum.
Cognition remains owned by Cybernetic-Ava007 and crosses the A2A boundary as
opaque intent/capability references.
"""

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timezone

from exoskeleton.core.quantum import InteractionQuantum


class TweenType(str, Enum):
    LINEAR = "linear"
    EASE = "ease"
    SPRING = "spring"


class AgentRole(str, Enum):
    ROUTER = "router"
    DISPATCHER = "dispatcher"
    TECHNICIAN = "technician"
    BILLING = "billing"
    CUSTOMER_SUCCESS = "customer_success"
    QUOTE = "quote"
    SCHEDULER = "scheduler"
    FIELD_TECH = "field_tech"
    MESH_RELAY = "mesh_relay"
    CONSCIOUSNESS = "consciousness"


class Modulation(str, Enum):
    CSS = "CSS"
    FSK = "FSK"
    LORA = "LoRa"
    GFSK = "GFSK"
    OOK = "OOK"


class MeshProtocol(str, Enum):
    AODV = "AODV"
    BATMAN = "BATMAN"
    OLSR = "OLSR"


@dataclass
class TemporalTween:
    """GSAP-compatible substrate tween parameters."""
    type: TweenType = TweenType.LINEAR
    duration_ms: int = 100
    ease_curve: Optional[str] = None
    keyframes: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        data = {"type": self.type.value, "duration_ms": self.duration_ms}
        if self.ease_curve:
            data["ease_curve"] = self.ease_curve
        if self.keyframes:
            data["keyframes"] = self.keyframes
        return data


@dataclass
class RFPhysical:
    """RF physical-layer parameters."""
    transceiver: str = "SX1262"
    modulation: str = "LoRa"
    frequency_hz: int = 915000000
    bandwidth_hz: int = 125000
    spreading_factor: int = 7
    coding_rate: str = "4/5"
    tx_power_dbm: int = 22
    rx_sensitivity_dbm: int = -116
    regional_plan: str = "US915"
    data_rate_bps: int = 600000

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class CryptoRouting:
    """Transport/mesh routing metadata; no cognitive state."""
    aead: str = "ChaCha20-Poly1305"
    key_exchange: str = "X25519 ECDH"
    fec: str = "Reed-Solomon 8/16"
    mesh_protocol: str = "AODV"
    ttl: int = 15
    path_repair: bool = True
    destination_did: Optional[str] = None
    hop_count: int = 0
    session_key_hash: Optional[str] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class TemporalIndex:
    gsap_ticker_ms: int = 0
    doppler_shift_hz: float = 0.0
    rssi_dbm: float = -120.0
    snr_db: float = 0.0
    angle_of_arrival_deg: float = 0.0
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class TSLAT:
    geometry_hash: Optional[str] = None
    signal_fingerprint: Optional[str] = None
    rf_state_hash: Optional[str] = None
    timeline_position: float = 0.0
    latent_vector: list[float] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class SignalMetadata:
    rf_physical: Optional[RFPhysical] = None
    crypto_routing: Optional[CryptoRouting] = None
    temporal_index: Optional[TemporalIndex] = None
    tslat: Optional[TSLAT] = None

    def to_dict(self) -> dict:
        data = {}
        if self.rf_physical:
            data["rf_physical"] = self.rf_physical.to_dict()
        if self.crypto_routing:
            data["crypto_routing"] = self.crypto_routing.to_dict()
        if self.temporal_index:
            data["temporal_index"] = self.temporal_index.to_dict()
        if self.tslat:
            data["tslat"] = self.tslat.to_dict()
        return data


class QuantumBuilder:
    """Backward-compatible substrate builder.

    ``intent()`` is retained for existing Agent-X callers, but records only
    opaque routing references in the payload. Reasoning and cognitive state
    are deliberately not constructed or serialized here.
    """

    def __init__(self):
        self._source_did = "did:unknown"
        self._parent_quanta: list[str] = []
        self._tween: Optional[TemporalTween] = None
        self._rf: Optional[RFPhysical] = None
        self._crypto: Optional[CryptoRouting] = None
        self._temporal: Optional[TemporalIndex] = None
        self._tslat: Optional[TSLAT] = None
        self._payload: dict = {}

    def source(self, did: str) -> "QuantumBuilder":
        self._source_did = did
        return self

    def parent(self, *quantum_ids: str) -> "QuantumBuilder":
        self._parent_quanta.extend(quantum_ids)
        return self

    def intent(self, intent: str, confidence: float = 1.0, role: str = "router", reasoning: str = None) -> "QuantumBuilder":
        self._payload["intent_id"] = intent
        self._payload["confidence"] = confidence
        self._payload["agent_role"] = role
        # Deliberately ignore reasoning: CoT never enters the substrate.
        return self

    def tween(self, tween_type: TweenType = TweenType.LINEAR, duration_ms: int = 100, ease_curve: str = None) -> "QuantumBuilder":
        self._tween = TemporalTween(tween_type, duration_ms, ease_curve)
        return self

    def rf(self, config: RFPhysical = None, **kwargs) -> "QuantumBuilder":
        self._rf = config or RFPhysical(**kwargs)
        return self

    def crypto(self, config: CryptoRouting = None, **kwargs) -> "QuantumBuilder":
        self._crypto = config or CryptoRouting(**kwargs)
        return self

    def temporal(self, config: TemporalIndex = None, **kwargs) -> "QuantumBuilder":
        self._temporal = config or TemporalIndex(**kwargs)
        return self

    def tslat(self, config: TSLAT = None, **kwargs) -> "QuantumBuilder":
        self._tslat = config or TSLAT(**kwargs)
        return self

    def payload(self, data: dict) -> "QuantumBuilder":
        self._payload.update(data)
        return self

    def build(self) -> InteractionQuantum:
        now = datetime.now(timezone.utc).isoformat()
        payload = dict(self._payload)
        signal = SignalMetadata(self._rf, self._crypto, self._temporal, self._tslat)
        if signal.to_dict():
            payload["signal_metadata"] = signal.to_dict()

        quantum = InteractionQuantum(
            timestamp=now,
            source_did=self._source_did,
            parent_quanta=list(self._parent_quanta),
            payload=payload,
            temporal_tween=self._tween.to_dict() if self._tween else None,
        )
        return quantum.seal()
