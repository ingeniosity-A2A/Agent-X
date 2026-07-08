"""
Interaction Quantum — Core Data Model

The atomic unit of interaction. Every message, decision, signal,
and state transition is captured as a Quantum — a signed, lineage-
linked JSON particle that can be gossiped, reconstructed, and
verified across any node.
"""

import hashlib
import json
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


# ─── Enums ───────────────────────────────────────────────────────────

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
    CSS = "CSS"      # Chirp Spread Spectrum (LoRa)
    FSK = "FSK"      # Frequency Shift Keying
    LORA = "LoRa"    # LoRa modulation
    GFSK = "GFSK"    # Gaussian FSK
    OOK = "OOK"      # On-Off Keying


class MeshProtocol(str, Enum):
    AODV = "AODV"    # Ad hoc On-Demand Distance Vector
    BATMAN = "BATMAN" # Better Approach To Mobile Adhoc Networking
    OLSR = "OLSR"    # Optimized Link State Routing


# ─── Sub-structures ──────────────────────────────────────────────────

@dataclass
class CognitiveState:
    """What the agent was thinking when this quantum was created."""
    intent: str                              # e.g., "voice_call", "dispatch", "quote"
    confidence: float = 0.0                  # 0.0–1.0
    agent_role: str = "router"
    reasoning: Optional[str] = None          # Chain-of-thought trace
    alternatives: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = {"intent": self.intent, "confidence": self.confidence, "agent_role": self.agent_role}
        if self.reasoning:
            d["reasoning"] = self.reasoning
        if self.alternatives:
            d["alternatives"] = self.alternatives
        return d


@dataclass
class TemporalTween:
    """GSAP-compatible tween parameters for deterministic state reconstruction."""
    type: TweenType = TweenType.LINEAR
    duration_ms: int = 100
    ease_curve: Optional[str] = None         # e.g., "power2.inOut"
    keyframes: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = {"type": self.type.value, "duration_ms": self.duration_ms}
        if self.ease_curve:
            d["ease_curve"] = self.ease_curve
        if self.keyframes:
            d["keyframes"] = self.keyframes
        return d


@dataclass
class RFPhysical:
    """RF physical layer parameters for CC1101/SX1262 transceivers."""
    transceiver: str = "SX1262"
    modulation: str = "LoRa"
    frequency_hz: int = 915000000            # US915 default
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
    """NullSec cryptographic and mesh routing metadata."""
    aead: str = "ChaCha20-Poly1305"
    key_exchange: str = "X25519 ECDH"
    fec: str = "Reed-Solomon 8/16"
    mesh_protocol: str = "AODV"
    ttl: int = 15
    path_repair: bool = True
    destination_did: Optional[str] = None
    hop_count: int = 0
    session_key_hash: Optional[str] = None   # Hash of active session key

    def to_dict(self) -> dict:
        d = asdict(self)
        # Remove None values
        return {k: v for k, v in d.items() if v is not None}


@dataclass
class TemporalIndex:
    """Temporal and spatial indexing for signal correlation."""
    gsap_ticker_ms: int = 0
    doppler_shift_hz: float = 0.0
    rssi_dbm: float = -120.0
    snr_db: float = 0.0
    angle_of_arrival_deg: float = 0.0
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


@dataclass
class TSLAT:
    """
    Temporal Structured Latents — jointly encode 3D geometry,
    signal appearance, and RF parameters along the GSAP timeline.
    Part of the MORPHOS architecture.
    """
    geometry_hash: Optional[str] = None      # Hash of 3D geometry state
    signal_fingerprint: Optional[str] = None  # RF signal fingerprint
    rf_state_hash: Optional[str] = None       # RF parameters hash
    timeline_position: float = 0.0            # 0.0–1.0 along GSAP timeline
    latent_vector: list[float] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}


@dataclass
class SignalMetadata:
    """Complete signal processing metadata container."""
    rf_physical: Optional[RFPhysical] = None
    crypto_routing: Optional[CryptoRouting] = None
    temporal_index: Optional[TemporalIndex] = None
    tslat: Optional[TSLAT] = None

    def to_dict(self) -> dict:
        d = {}
        if self.rf_physical:
            d["rf_physical"] = self.rf_physical.to_dict()
        if self.crypto_routing:
            d["crypto_routing"] = self.crypto_routing.to_dict()
        if self.temporal_index:
            d["temporal_index"] = self.temporal_index.to_dict()
        if self.tslat:
            d["tslat"] = self.tslat.to_dict()
        return d


# ─── Interaction Quantum ─────────────────────────────────────────────

@dataclass
class InteractionQuantum:
    """
    The fundamental atomic unit of interaction.
    
    Every quantum is:
    - Content-addressed by SHA-256 hash
    - Cryptographically signed by creator's DID
    - Linked to parent quanta via lineage
    - Self-contained with RF, crypto, and temporal metadata
    - Deterministically reconstructable
    """
    quantum_id: str                                          # SHA-256 hash
    timestamp: str                                           # ISO-8601
    source_did: str                                          # Creator DID
    parent_quanta: list[str] = field(default_factory=list)   # Parent hashes
    lineage_signature: Optional[str] = None                  # Base64 signature
    temporal_tween: Optional[TemporalTween] = None
    cognitive_state: Optional[CognitiveState] = None
    signal_metadata: Optional[SignalMetadata] = None
    payload: dict = field(default_factory=dict)              # Arbitrary data
    version: str = "2.0"

    def to_dict(self) -> dict:
        """Serialize to dictionary (for JSON)."""
        d = {
            "quantum_id": self.quantum_id,
            "timestamp": self.timestamp,
            "source_did": self.source_did,
            "parent_quanta": self.parent_quanta,
            "version": self.version,
        }
        if self.lineage_signature:
            d["lineage_signature"] = self.lineage_signature
        if self.temporal_tween:
            d["temporal_tween"] = self.temporal_tween.to_dict()
        if self.cognitive_state:
            d["cognitive_state"] = self.cognitive_state.to_dict()
        if self.signal_metadata:
            d["signal_metadata"] = self.signal_metadata.to_dict()
        if self.payload:
            d["payload"] = self.payload
        return d

    def to_json(self, indent: int = None) -> str:
        """Serialize to JSON string."""
        return json.dumps(self.to_dict(), indent=indent, sort_keys=False)

    def to_jsonl(self) -> str:
        """Serialize to single JSONL line."""
        return json.dumps(self.to_dict(), sort_keys=False)

    @classmethod
    def from_dict(cls, data: dict) -> "InteractionQuantum":
        """Deserialize from dictionary."""
        # Reconstruct sub-objects
        tween = None
        if "temporal_tween" in data:
            t = data["temporal_tween"]
            tween = TemporalTween(
                type=TweenType(t.get("type", "linear")),
                duration_ms=t.get("duration_ms", 100),
                ease_curve=t.get("ease_curve"),
                keyframes=t.get("keyframes", []),
            )

        cog = None
        if "cognitive_state" in data:
            c = data["cognitive_state"]
            cog = CognitiveState(
                intent=c.get("intent", "unknown"),
                confidence=c.get("confidence", 0.0),
                agent_role=c.get("agent_role", "router"),
                reasoning=c.get("reasoning"),
                alternatives=c.get("alternatives", []),
            )

        sig = None
        if "signal_metadata" in data:
            s = data["signal_metadata"]
            rf = None
            if "rf_physical" in s:
                r = s["rf_physical"]
                rf = RFPhysical(**{k: v for k, v in r.items() if k in RFPhysical.__dataclass_fields__})

            cr = None
            if "crypto_routing" in s:
                cr_data = s["crypto_routing"]
                cr = CryptoRouting(**{k: v for k, v in cr_data.items() if k in CryptoRouting.__dataclass_fields__})

            ti = None
            if "temporal_index" in s:
                ti_data = s["temporal_index"]
                ti = TemporalIndex(**{k: v for k, v in ti_data.items() if k in TemporalIndex.__dataclass_fields__})

            tslat = None
            if "tslat" in s:
                tslat_data = s["tslat"]
                tslat = TSLAT(**{k: v for k, v in tslat_data.items() if k in TSLAT.__dataclass_fields__})

            sig = SignalMetadata(rf_physical=rf, crypto_routing=cr, temporal_index=ti, tslat=tslat)

        return cls(
            quantum_id=data.get("quantum_id", ""),
            timestamp=data.get("timestamp", ""),
            source_did=data.get("source_did", ""),
            parent_quanta=data.get("parent_quanta", []),
            lineage_signature=data.get("lineage_signature"),
            temporal_tween=tween,
            cognitive_state=cog,
            signal_metadata=sig,
            payload=data.get("payload", {}),
            version=data.get("version", "2.0"),
        )

    @classmethod
    def from_json(cls, json_str: str) -> "InteractionQuantum":
        """Deserialize from JSON string."""
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def from_jsonl(cls, line: str) -> "InteractionQuantum":
        """Deserialize from a JSONL line."""
        return cls.from_dict(json.loads(line.strip()))

    def compute_hash(self) -> str:
        """Compute deterministic SHA-256 hash of the quantum content."""
        # Hash everything except quantum_id and lineage_signature
        hashable = {
            "timestamp": self.timestamp,
            "source_did": self.source_did,
            "parent_quanta": sorted(self.parent_quanta),
            "temporal_tween": self.temporal_tween.to_dict() if self.temporal_tween else None,
            "cognitive_state": self.cognitive_state.to_dict() if self.cognitive_state else None,
            "signal_metadata": self.signal_metadata.to_dict() if self.signal_metadata else None,
            "payload": self.payload,
            "version": self.version,
        }
        canonical = json.dumps(hashable, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()

    def verify_hash(self) -> bool:
        """Verify that quantum_id matches the computed hash."""
        return self.quantum_id == self.compute_hash()

    def __repr__(self) -> str:
        return f"Quantum({self.quantum_id[:12]}... src={self.source_did} intent={self.cognitive_state.intent if self.cognitive_state else '?'}>)"


# ─── Builder ─────────────────────────────────────────────────────────

class QuantumBuilder:
    """
    Fluent builder for Interaction Quanta.
    
    Usage:
        q = (QuantumBuilder()
            .source("did:helpassembly:router:001")
            .intent("dispatch", confidence=0.95)
            .parent(prev_quantum_id)
            .rf(CC1101Config())
            .tween(TweenType.EASE, duration_ms=200)
            .payload({"action": "dispatch_tech", "tech_id": "marcus"})
            .build())
    """

    def __init__(self):
        self._source_did: str = "did:unknown"
        self._parent_quanta: list[str] = []
        self._cognitive: Optional[CognitiveState] = None
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
        self._cognitive = CognitiveState(intent=intent, confidence=confidence, agent_role=role, reasoning=reasoning)
        return self

    def tween(self, tween_type: TweenType = TweenType.LINEAR, duration_ms: int = 100, ease_curve: str = None) -> "QuantumBuilder":
        self._tween = TemporalTween(type=tween_type, duration_ms=duration_ms, ease_curve=ease_curve)
        return self

    def rf(self, config: RFPhysical = None, **kwargs) -> "QuantumBuilder":
        if config:
            self._rf = config
        else:
            self._rf = RFPhysical(**kwargs)
        return self

    def crypto(self, config: CryptoRouting = None, **kwargs) -> "QuantumBuilder":
        if config:
            self._crypto = config
        else:
            self._crypto = CryptoRouting(**kwargs)
        return self

    def temporal(self, config: TemporalIndex = None, **kwargs) -> "QuantumBuilder":
        if config:
            self._temporal = config
        else:
            self._temporal = TemporalIndex(**kwargs)
        return self

    def tslat(self, config: TSLAT = None, **kwargs) -> "QuantumBuilder":
        if config:
            self._tslat = config
        else:
            self._tslat = TSLAT(**kwargs)
        return self

    def payload(self, data: dict) -> "QuantumBuilder":
        self._payload = data
        return self

    def build(self) -> InteractionQuantum:
        """Build the Interaction Quantum with computed hash."""
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", ".000Z")

        signal = SignalMetadata(
            rf_physical=self._rf,
            crypto_routing=self._crypto,
            temporal_index=self._temporal,
            tslat=self._tslat,
        )

        # Build without ID first to compute hash
        proto = InteractionQuantum(
            quantum_id="",  # Placeholder
            timestamp=now,
            source_did=self._source_did,
            parent_quanta=self._parent_quanta,
            temporal_tween=self._tween,
            cognitive_state=self._cognitive,
            signal_metadata=signal if signal.to_dict() else None,
            payload=self._payload,
        )

        # Compute deterministic hash
        proto.quantum_id = proto.compute_hash()
        return proto
