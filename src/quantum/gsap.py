"""
GSAP Temporal Orchestrator

Extends the GSAP animation engine (ScrollTrigger, tween atoms)
to consume temporal_tween and doppler_shift fields from each
Interaction Quantum.

Key concepts:
- Tween atoms: mathematical transition laws (linear, ease, spring)
  shared instead of raw state streams
- Bandwidth efficiency: drops from MB/s to bytes per second
- Spatial Memory Palace: ScrollTrigger maps RF angle-of-arrival
  and RSSI to 3D coordinates
"""

import math
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable


class Easing(str, Enum):
    LINEAR = "linear"
    EASE_IN = "ease-in"
    EASE_OUT = "ease-out"
    EASE_IN_OUT = "ease-in-out"
    POWER2_IN = "power2.in"
    POWER2_OUT = "power2.out"
    POWER2_INOUT = "power2.inOut"
    ELASTIC = "elastic"
    BOUNCE = "bounce"
    BACK = "back"


# ─── Easing Functions ────────────────────────────────────────────────

EASING_FUNCTIONS: dict[str, Callable[[float], float]] = {
    "linear": lambda t: t,
    "ease-in": lambda t: t * t,
    "ease-out": lambda t: t * (2 - t),
    "ease-in-out": lambda t: 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t,
    "power2.in": lambda t: t * t,
    "power2.out": lambda t: t * (2 - t),
    "power2.inOut": lambda t: 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t,
    "elastic": lambda t: (
        0 if t == 0
        else 1 if t == 1
        else -(2 ** (10 * (t - 1))) * math.sin((t - 1.1) * 5 * math.pi)
    ),
    "bounce": lambda t: (
        1 - _bounce_out(1 - t)
    ),
    "back": lambda t: t * t * (2.70158 * t - 1.70158),
}


def _bounce_out(t: float) -> float:
    if t < 1 / 2.75:
        return 7.5625 * t * t
    elif t < 2 / 2.75:
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    elif t < 2.5 / 2.75:
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    else:
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375


# ─── Tween Atom ──────────────────────────────────────────────────────

@dataclass
class TweenAtom:
    """
    A mathematical transition law that can be shared between nodes
    instead of raw state streams.
    
    Given start/end values and an easing function, any node can
    deterministically reconstruct intermediate states at any time.
    """
    start: float = 0.0
    end: float = 1.0
    duration_ms: int = 100
    easing: str = "linear"
    delay_ms: int = 0

    def interpolate(self, elapsed_ms: float) -> float:
        """Compute the interpolated value at elapsed_ms."""
        if elapsed_ms < self.delay_ms:
            return self.start
        
        t = (elapsed_ms - self.delay_ms) / self.duration_ms
        t = max(0.0, min(1.0, t))  # Clamp

        easing_fn = EASING_FUNCTIONS.get(self.easing, EASING_FUNCTIONS["linear"])
        eased_t = easing_fn(t)

        return self.start + (self.end - self.start) * eased_t

    def to_dict(self) -> dict:
        return {
            "start": self.start,
            "end": self.end,
            "duration_ms": self.duration_ms,
            "easing": self.easing,
            "delay_ms": self.delay_ms,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TweenAtom":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    def bandwidth_savings(self, state_updates_per_second: int = 30) -> dict:
        """
        Calculate bandwidth savings vs transmitting raw state updates.
        
        A tween atom is ~100 bytes. Raw state at 30fps for duration is much more.
        """
        raw_bytes = state_updates_per_second * 8 * (self.duration_ms / 1000)  # 8 bytes per update
        atom_bytes = 100  # Approximate serialized tween atom size
        savings_pct = (1 - atom_bytes / raw_bytes) * 100 if raw_bytes > 0 else 0

        return {
            "raw_bytes_per_second": state_updates_per_second * 8,
            "total_raw_bytes": int(raw_bytes),
            "atom_bytes": atom_bytes,
            "savings_percent": round(savings_pct, 1),
        }


# ─── Tween Timeline ──────────────────────────────────────────────────

@dataclass
class TweenTimeline:
    """
    A collection of tween atoms that run in sequence or parallel.
    Maps to GSAP timeline concept.
    """
    atoms: list[TweenAtom] = field(default_factory=list)
    total_duration_ms: int = 0

    def add(self, atom: TweenAtom) -> "TweenTimeline":
        """Add a tween atom to the timeline."""
        self.atoms.append(atom)
        self.total_duration_ms = max(
            self.total_duration_ms,
            atom.delay_ms + atom.duration_ms,
        )
        return self

    def evaluate(self, elapsed_ms: float) -> list[float]:
        """Evaluate all atoms at the given time."""
        return [atom.interpolate(elapsed_ms) for atom in self.atoms]

    def to_dict(self) -> dict:
        return {
            "atoms": [a.to_dict() for a in self.atoms],
            "total_duration_ms": self.total_duration_ms,
        }


# ─── Temporal Orchestrator ───────────────────────────────────────────

class TemporalOrchestrator:
    """
    Orchestrates temporal reconstruction from Interaction Quanta.
    
    Instead of streaming raw audio/video/RF data, nodes share
    Interaction Quanta with temporal_tween fields. The orchestrator
    reconstructs the full timeline deterministically.
    
    Usage:
        orch = TemporalOrchestrator()
        orch.ingest(quantum1)
        orch.ingest(quantum2)
        
        # Reconstruct state at any point in time
        state = orch.reconstruct(elapsed_ms=500)
    """

    def __init__(self):
        self.timelines: dict[str, TweenTimeline] = {}  # intent → timeline
        self.quanta: list[dict] = []
        self.start_time: Optional[float] = None

    def ingest(self, quantum) -> None:
        """Ingest an Interaction Quantum into the orchestrator."""
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        self.quanta.append(q)

        if self.start_time is None:
            self.start_time = time.time()

        # Extract tween parameters
        tween_data = q.get("temporal_tween", {})
        if not tween_data:
            return

        intent = q.get("cognitive_state", {}).get("intent", "default")

        atom = TweenAtom(
            start=0.0,
            end=1.0,
            duration_ms=tween_data.get("duration_ms", 100),
            easing=tween_data.get("type", "linear"),
        )

        if intent not in self.timelines:
            self.timelines[intent] = TweenTimeline()
        self.timelines[intent].add(atom)

    def reconstruct(self, elapsed_ms: float) -> dict:
        """
        Reconstruct the state at a given elapsed time.
        
        Returns a dict mapping each intent to its interpolated value.
        """
        state = {}
        for intent, timeline in self.timelines.items():
            values = timeline.evaluate(elapsed_ms)
            state[intent] = values[-1] if values else 0.0
        return state

    def get_bandwidth_stats(self) -> dict:
        """Calculate bandwidth savings from tween-based transport."""
        total_raw = 0
        total_atom = 0

        for timeline in self.timelines.values():
            for atom in timeline.atoms:
                savings = atom.bandwidth_savings()
                total_raw += savings["total_raw_bytes"]
                total_atom += savings["atom_bytes"]

        return {
            "total_raw_bytes": total_raw,
            "total_atom_bytes": total_atom,
            "savings_bytes": total_raw - total_atom,
            "savings_percent": round((1 - total_atom / total_raw) * 100, 1) if total_raw > 0 else 0,
            "quanta_count": len(self.quanta),
            "timelines": len(self.timelines),
        }


# ─── Spatial Memory Palace ───────────────────────────────────────────

class SpatialMemoryPalace:
    """
    Maps RF angle-of-arrival and RSSI to 3D coordinates,
    allowing users to "walk through" their digital footprint
    based on real-world signal strength.
    
    Uses ScrollTrigger-compatible coordinate system.
    """

    def __init__(self, origin_lat: float = 0.0, origin_lon: float = 0.0):
        self.origin = (origin_lat, origin_lon)
        self.points: list[dict] = []

    def add_point(self, quantum) -> dict:
        """
        Add a quantum's spatial data to the palace.
        
        Maps:
        - RSSI → distance (inverse square law approximation)
        - AoA → rotation angle
        - SNR → elevation (confidence)
        """
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        ti = q.get("signal_metadata", {}).get("temporal_index", {})

        rssi = ti.get("rssi_dbm", -120)
        aoa = ti.get("angle_of_arrival_deg", 0)
        snr = ti.get("snr_db", 0)

        # RSSI → distance (simplified path loss model)
        # d = 10^((Tx_power - RSSI) / (10 * n)) where n=2 for free space
        distance = 10 ** ((22 - rssi) / 20) if rssi < 22 else 0.1

        # AoA → 2D position
        angle_rad = math.radians(aoa)
        x = distance * math.cos(angle_rad)
        y = distance * math.sin(angle_rad)

        # SNR → elevation (normalized)
        z = max(0, min(10, snr / 3))

        point = {
            "x": round(x, 2),
            "y": round(y, 2),
            "z": round(z, 2),
            "rssi": rssi,
            "aoa": aoa,
            "snr": snr,
            "quantum_id": q.get("quantum_id", "")[:16],
            "intent": q.get("cognitive_state", {}).get("intent", "unknown"),
        }
        self.points.append(point)
        return point

    def to_scroll_trigger_data(self) -> dict:
        """
        Export points as GSAP ScrollTrigger-compatible data.
        """
        return {
            "origin": self.origin,
            "points": self.points,
            "bounds": self._compute_bounds(),
        }

    def _compute_bounds(self) -> dict:
        """Compute bounding box of all points."""
        if not self.points:
            return {"min": [0, 0, 0], "max": [0, 0, 0]}
        
        xs = [p["x"] for p in self.points]
        ys = [p["y"] for p in self.points]
        zs = [p["z"] for p in self.points]
        
        return {
            "min": [min(xs), min(ys), min(zs)],
            "max": [max(xs), max(ys), max(zs)],
        }
