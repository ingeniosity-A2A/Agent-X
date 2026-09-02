"""Agent-X GSAP compatibility layer.

Temporal mechanics are substrate concerns. This module remains as a
compatibility surface for Agent-X callers while using opaque correlation
references instead of Ava007 cognitive state.

RF spatial projection remains a capability-side concern here.
"""

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Optional


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


def _bounce_out(t: float) -> float:
    if t < 1 / 2.75:
        return 7.5625 * t * t
    if t < 2 / 2.75:
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
    if t < 2.5 / 2.75:
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
    t -= 2.625 / 2.75
    return 7.5625 * t * t + 0.984375


EASING_FUNCTIONS: dict[str, Callable[[float], float]] = {
    "linear": lambda t: t,
    "ease-in": lambda t: t * t,
    "ease-out": lambda t: t * (2 - t),
    "ease-in-out": lambda t: 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t,
    "power2.in": lambda t: t * t,
    "power2.out": lambda t: t * (2 - t),
    "power2.inOut": lambda t: 2 * t * t if t < 0.5 else -1 + (4 - 2 * t) * t,
    "elastic": lambda t: 0 if t == 0 else 1 if t == 1 else -(2 ** (10 * (t - 1))) * math.sin((t - 1.1) * 5 * math.pi),
    "bounce": lambda t: 1 - _bounce_out(1 - t),
    "back": lambda t: t * t * (2.70158 * t - 1.70158),
}


@dataclass
class TweenAtom:
    start: float = 0.0
    end: float = 1.0
    duration_ms: int = 100
    easing: str = "linear"
    delay_ms: int = 0

    def interpolate(self, elapsed_ms: float) -> float:
        if elapsed_ms < self.delay_ms:
            return self.start
        if self.duration_ms <= 0:
            return self.end
        t = max(0.0, min(1.0, (elapsed_ms - self.delay_ms) / self.duration_ms))
        return self.start + (self.end - self.start) * EASING_FUNCTIONS.get(self.easing, EASING_FUNCTIONS["linear"])(t)

    def to_dict(self) -> dict:
        return {"start": self.start, "end": self.end, "duration_ms": self.duration_ms, "easing": self.easing, "delay_ms": self.delay_ms}

    @classmethod
    def from_dict(cls, data: dict) -> "TweenAtom":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    def bandwidth_savings(self, state_updates_per_second: int = 30) -> dict:
        raw_bytes = state_updates_per_second * 8 * (self.duration_ms / 1000)
        atom_bytes = 100
        return {
            "raw_bytes_per_second": state_updates_per_second * 8,
            "total_raw_bytes": int(raw_bytes),
            "atom_bytes": atom_bytes,
            "savings_percent": round((1 - atom_bytes / raw_bytes) * 100, 1) if raw_bytes > 0 else 0,
        }


@dataclass
class TweenTimeline:
    atoms: list[TweenAtom] = field(default_factory=list)
    total_duration_ms: int = 0

    def add(self, atom: TweenAtom) -> "TweenTimeline":
        self.atoms.append(atom)
        self.total_duration_ms = max(self.total_duration_ms, atom.delay_ms + atom.duration_ms)
        return self

    def evaluate(self, elapsed_ms: float) -> list[float]:
        return [atom.interpolate(elapsed_ms) for atom in self.atoms]

    def to_dict(self) -> dict:
        return {"atoms": [a.to_dict() for a in self.atoms], "total_duration_ms": self.total_duration_ms}


class TemporalOrchestrator:
    """Compatibility orchestrator keyed only by opaque correlation_ref."""

    def __init__(self):
        self.timelines: dict[str, TweenTimeline] = {}
        self.quanta: list[dict] = []

    def ingest(self, quantum) -> None:
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        self.quanta.append(q)
        tween_data = q.get("temporal_tween") or q.get("payload", {}).get("temporal_tween", {})
        if not tween_data:
            return
        ref = q.get("correlation_ref") or q.get("payload", {}).get("correlation_ref") or q.get("intent_id") or "default"
        atom = TweenAtom(
            start=float(tween_data.get("start", 0.0)),
            end=float(tween_data.get("end", 1.0)),
            duration_ms=int(tween_data.get("duration_ms", 100)),
            easing=tween_data.get("ease_curve", tween_data.get("type", "linear")),
            delay_ms=int(tween_data.get("delay_ms", 0)),
        )
        self.timelines.setdefault(str(ref), TweenTimeline()).add(atom)

    def reconstruct(self, elapsed_ms: float) -> dict:
        return {
            ref: (values[-1] if values else 0.0)
            for ref, timeline in self.timelines.items()
            for values in [timeline.evaluate(elapsed_ms)]
        }

    def get_bandwidth_stats(self) -> dict:
        total_raw = total_atom = 0
        for timeline in self.timelines.values():
            for atom in timeline.atoms:
                stats = atom.bandwidth_savings()
                total_raw += stats["total_raw_bytes"]
                total_atom += stats["atom_bytes"]
        return {
            "total_raw_bytes": total_raw,
            "total_atom_bytes": total_atom,
            "savings_bytes": total_raw - total_atom,
            "savings_percent": round((1 - total_atom / total_raw) * 100, 1) if total_raw else 0,
            "quanta_count": len(self.quanta),
            "timelines": len(self.timelines),
        }


class SpatialMemoryPalace:
    """Capability-side RF spatial projection; no cognitive interpretation."""

    def __init__(self, origin_lat: float = 0.0, origin_lon: float = 0.0):
        self.origin = (origin_lat, origin_lon)
        self.points: list[dict] = []

    def add_point(self, quantum) -> dict:
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        signal = q.get("signal_metadata", {})
        ti = signal.get("temporal_index", {}) if isinstance(signal, dict) else {}
        rssi = ti.get("rssi_dbm", -120)
        aoa = ti.get("angle_of_arrival_deg", 0)
        snr = ti.get("snr_db", 0)
        distance = 10 ** ((22 - rssi) / 20) if rssi < 22 else 0.1
        angle_rad = math.radians(aoa)
        point = {
            "x": round(distance * math.cos(angle_rad), 2),
            "y": round(distance * math.sin(angle_rad), 2),
            "z": round(max(0, min(10, snr / 3)), 2),
            "rssi": rssi,
            "aoa": aoa,
            "snr": snr,
            "quantum_id": q.get("quantum_id", "")[:16],
        }
        self.points.append(point)
        return point

    def to_scroll_trigger_data(self) -> dict:
        return {"origin": self.origin, "points": self.points, "bounds": self._compute_bounds()}

    def _compute_bounds(self) -> dict:
        if not self.points:
            return {"min": [0, 0, 0], "max": [0, 0, 0]}
        xs = [p["x"] for p in self.points]
        ys = [p["y"] for p in self.points]
        zs = [p["z"] for p in self.points]
        return {"min": [min(xs), min(ys), min(zs)], "max": [max(xs), max(ys), max(zs)]}
