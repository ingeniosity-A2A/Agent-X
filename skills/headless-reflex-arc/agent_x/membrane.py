"""
Agent X Hardware Membrane — Unified Collapse Layer.

Transforms raw voice intents into cryptographically signed, spatially verified
A2A payloads over 5G NR Sidelink with local Vfile state projections.

Architecture Position:
    L4  Cybernetic Ava007 (Intellect)  →  emits Intent only
    L3  Agent X Substrate Runtime     →  THIS MODULE
    L2  Hardware Membrane             →  5G NR Sidelink, UWB, Vfile I/O

Design Principles:
    1. Unified Collapse: tool-harness dichotomy reduced to single
       O(1) intent resolution. The LLM never sees tool JSON schemas,
       retry loops, or network routing topologies.
    2. Sovereignty: Ava007 is the sole reasoner. This module executes
       hardware authorization, spatial checks, and radio injection.
       It does NOT reason — it enforces.
    3. Zero Context Weight: only stdlib imports. No torch, no pyarrow.
    4. Appless: All state lives in transient Vfiles, not native apps.

Edge Device: Galaxy S26 Ultra (canonical per AGENTS.md).
Consumer Connectivity: Entitled SIM/eSIM (Xfinity / Google Fi) +
    Google Voice over data/Wi-Fi. SoftSIM is IoT-only and never used
    as a consumer carrier unlock mechanism.

Security Boundaries:
    - Spatial Gate: UWB AoA +/-15 deg azimuth, <5m radius
    - Crypto: HMAC-SHA256 over full A2A envelope
    - No raw Core-Q2 weights, MemBrain dumps, or sandbox internals
      in outbound frames
"""
import hashlib
import hmac as _hmac
import json
import math
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


# ====================================================================
# Constants
# ====================================================================

# Galaxy S26 Ultra — canonical edge device class
EDGE_DEVICE_CLASS = "galaxy_s26_ultra"

# Spatial gate defaults
DEFAULT_MAX_DISTANCE_M = 5.0
DEFAULT_MAX_AZIMUTH_DEG = 15.0

# A2A protocol constants
A2A_JSONRPC_VERSION = "2.0"
A2A_METHOD_DELEGATE = "a2a.task.delegate"
A2A_SENDER_ID = "Zello_Ella_v6.6"
A2A_TRANSPORT_SIDELINK = "5G_NR_SIDELINK_DIRECT"


# ====================================================================
# Enums
# ====================================================================

class VfileStatus(str, Enum):
    """Lifecycle states for a Vfile projection."""
    CREATED = "CREATED"
    MUTATED = "MUTATED"
    READ = "READ"
    EVICTED = "EVICTED"


class SpatialGateResult(str, Enum):
    """Outcome of a spatial boundary check."""
    PASSED = "passed"
    REJECTED_DISTANCE = "rejected_distance"
    REJECTED_AZIMUTH = "rejected_azimuth"


class FrameVerificationResult(str, Enum):
    """Outcome of A2A frame verification."""
    VALID = "valid"
    INVALID_SIGNATURE = "invalid_signature"
    SPATIAL_VIOLATION = "spatial_violation"
    MALFORMED = "malformed"


# ====================================================================
# Spatial Gate
# ====================================================================

@dataclass(frozen=True)
class SpatialBounds:
    """
    Immutable spatial boundary parameters for UWB AoA filtering.

    Attributes:
        distance_m: Range distance in meters.
        azimuth_deg: Azimuth angle in degrees (0 = dead ahead).
        max_distance_m: Rejection threshold for distance.
        max_azimuth_deg: Rejection threshold for azimuth (absolute value).
    """
    distance_m: float
    azimuth_deg: float
    max_distance_m: float = DEFAULT_MAX_DISTANCE_M
    max_azimuth_deg: float = DEFAULT_MAX_AZIMUTH_DEG

    def check(self) -> Tuple[SpatialGateResult, Optional[str]]:
        """
        Verify spatial alignment against boundaries.

        Returns:
            (result, reason) — PASSED with None reason on success,
            or (REJECTED_*, human-readable reason) on failure.
        """
        if self.distance_m > self.max_distance_m:
            return (
                SpatialGateResult.REJECTED_DISTANCE,
                f"Distance {self.distance_m:.2f}m exceeds {self.max_distance_m:.1f}m threshold",
            )
        if abs(self.azimuth_deg) > self.max_azimuth_deg:
            return (
                SpatialGateResult.REJECTED_AZIMUTH,
                f"Azimuth {self.azimuth_deg:.1f} deg outside +/-{self.max_azimuth_deg:.0f} deg cone",
            )
        return (SpatialGateResult.PASSED, None)

    def to_dict(self) -> Dict[str, float]:
        return {
            "distance_m": self.distance_m,
            "azimuth_deg": self.azimuth_deg,
        }


# ====================================================================
# Vfile — Transient In-Memory State Projection
# ====================================================================

class VfileStore:
    """
    Transient in-memory Vfile store for appless state management.

    Vfiles replace cloud DB sync and native app navigation.
    All operational states exist as lightweight, in-memory projections
    mounted to the local runtime. 5G Sidelink frames directly mutate
    Vfile paths without opening native applications.

    Thread-safety: uses a simple dict protected by the GIL for
    single-threaded substrate execution. For concurrent access,
    wrap with external locking.
    """

    def __init__(self, max_files: int = 1024) -> None:
        self._store: Dict[str, Dict[str, Any]] = {}
        self._max_files = max_files

    def write(self, path: str, data: Dict[str, Any]) -> None:
        """
        Write or mutate a Vfile at the given path.

        Args:
            path: Vfile path (e.g. "/vfile/schedules/ASSEMBLY_9821.json").
            data: State dictionary to write.
        """
        self._enforce_limit()
        self._store[path] = {
            "vfile_path": path,
            "status": VfileStatus.MUTATED.value,
            "data": data,
            "written_at": time.time(),
        }

    def read(self, path: str) -> Optional[Dict[str, Any]]:
        """Read a Vfile. Returns None if not found."""
        entry = self._store.get(path)
        if entry is None:
            return None
        # Mark as read
        entry["status"] = VfileStatus.READ.value
        entry["read_at"] = time.time()
        return entry

    def delete(self, path: str) -> bool:
        """Delete a Vfile. Returns True if it existed."""
        evicted = self._store.pop(path, None)
        return evicted is not None

    def list_paths(self, prefix: Optional[str] = None) -> List[str]:
        """List all Vfile paths, optionally filtered by prefix."""
        paths = list(self._store.keys())
        if prefix:
            paths = [p for p in paths if p.startswith(prefix)]
        return sorted(paths)

    def apply_delta(self, path: str, delta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Apply a delta patch to an existing Vfile.

        Creates the Vfile if it does not exist.
        Returns the updated Vfile entry.
        """
        existing = self._store.get(path)
        current_data = existing["data"] if existing else {}
        current_data.update(delta)
        self.write(path, current_data)
        return self.read(path)

    def clear(self) -> int:
        """Evict all Vfiles. Returns count of evicted files."""
        count = len(self._store)
        self._store.clear()
        return count

    @property
    def size(self) -> int:
        """Number of active Vfiles."""
        return len(self._store)

    def _enforce_limit(self) -> None:
        """Evict oldest Vfiles if at capacity."""
        if len(self._store) >= self._max_files:
            # Evict oldest by written_at
            oldest = min(
                self._store.items(),
                key=lambda kv: kv[1].get("written_at", 0),
            )
            del self._store[oldest[0]]


# ====================================================================
# A2A Sidelink Frame
# ====================================================================

@dataclass
class SidelinkFrame:
    """
    A parsed A2A Sidelink frame before envelope encapsulation.

    This is the inner JSON-RPC payload that gets signed.
    """
    jsonrpc: str = A2A_JSONRPC_VERSION
    method: str = A2A_METHOD_DELEGATE
    frame_id: str = ""
    sender_agent: str = A2A_SENDER_ID
    transport_medium: str = A2A_TRANSPORT_SIDELINK
    spatial: Optional[SpatialBounds] = None
    action: str = ""
    service_id: str = ""
    timestamp: int = 0
    ui_hint: str = ""

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "jsonrpc": self.jsonrpc,
            "method": self.method,
            "id": self.frame_id,
            "params": {
                "sender_agent": self.sender_agent,
                "transport_medium": self.transport_medium,
                "action": self.action,
                "payload": {
                    "service_id": self.service_id,
                    "timestamp": self.timestamp,
                },
            },
        }
        if self.spatial:
            d["params"]["spatial_bounds"] = self.spatial.to_dict()
        if self.ui_hint:
            d["params"]["ui_hint"] = {
                "structured_prompt": self.ui_hint,
            }
        return d


# ====================================================================
# Agent X Hardware Membrane
# ====================================================================

class AgentXHardwareMembrane:
    """
    Agent X Substrate Layer handling Unified Collapse.

    Transforms raw voice intents into cryptographically signed, spatially
    verified A2A payloads over 5G NR Sidelink and local Vfile projections.

    The LLM Intellect emits a single intent (e.g. CANCEL_APPOINTMENT).
    This module handles hardware authorization, spatial line-of-sight
    checking, cryptographic envelope generation, and 5G radio buffer
    injection. The model context receives only a 53-token execution
    result delta.

    Usage:
        membrane = AgentXHardwareMembrane(device_secret_key)
        buf = membrane.construct_signed_sidelink_packet(
            service_id="ASSEMBLY_9821",
            action="CANCEL_APPOINTMENT",
            uwb_distance_m=2.1,
            uwb_azimuth_deg=4.5,
        )
        result = membrane.receive_and_verify_sidelink_frame(
            raw_buffer=buf,
            target_vfile_path="/vfile/schedules/ASSEMBLY_9821.json",
        )
    """

    def __init__(
        self,
        device_secret_key: bytes,
        max_distance_m: float = DEFAULT_MAX_DISTANCE_M,
        max_azimuth_deg: float = DEFAULT_MAX_AZIMUTH_DEG,
    ) -> None:
        self._key = device_secret_key
        self._max_distance_m = max_distance_m
        self._max_azimuth_deg = max_azimuth_deg
        self._vfiles = VfileStore()
        self._frame_log: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def vfiles(self) -> VfileStore:
        """Access the transient Vfile store."""
        return self._vfiles

    @property
    def frame_log(self) -> List[Dict[str, Any]]:
        """Access the frame verification log."""
        return list(self._frame_log)

    # ------------------------------------------------------------------
    # Cryptographic Operations
    # ------------------------------------------------------------------

    def sign(self, payload_bytes: bytes) -> str:
        """
        Compute HMAC-SHA256 signature over raw payload bytes.

        Args:
            payload_bytes: Serialized A2A packet bytes.

        Returns:
            Hex-encoded HMAC digest.
        """
        return _hmac.new(
            self._key, payload_bytes, hashlib.sha256
        ).hexdigest()

    def verify(self, payload_bytes: bytes, signature: str) -> bool:
        """
        Verify an HMAC-SHA256 signature using constant-time comparison.

        Args:
            payload_bytes: Original payload bytes.
            signature: Hex-encoded signature to verify against.

        Returns:
            True if signature matches.
        """
        expected = self.sign(payload_bytes)
        return _hmac.compare_digest(signature, expected)

    # ------------------------------------------------------------------
    # Spatial Gate
    # ------------------------------------------------------------------

    def check_spatial(
        self,
        distance_m: float,
        azimuth_deg: float,
    ) -> Tuple[SpatialGateResult, Optional[str]]:
        """
        Check if a spatial position passes the UWB AoA gate.

        Returns:
            (result, reason) tuple.
        """
        bounds = SpatialBounds(
            distance_m=distance_m,
            azimuth_deg=azimuth_deg,
            max_distance_m=self._max_distance_m,
            max_azimuth_deg=self._max_azimuth_deg,
        )
        return bounds.check()

    # ------------------------------------------------------------------
    # Frame Construction (Sender Side)
    # ------------------------------------------------------------------

    def construct_signed_sidelink_packet(
        self,
        service_id: str,
        action: str,
        uwb_distance_m: float,
        uwb_azimuth_deg: float,
        sender_agent: Optional[str] = None,
        ui_hint: Optional[str] = None,
    ) -> bytes:
        """
        Collapses protocol construction, cryptographic signing, and
        spatial checks into a single byte buffer for 5G Sidelink broadcast.

        Args:
            service_id: Target service identifier.
            action: Intent action (e.g. "CANCEL_APPOINTMENT").
            uwb_distance_m: UWB measured distance in meters.
            uwb_azimuth_deg: UWB azimuth angle in degrees.
            sender_agent: Override sender agent ID.
            ui_hint: Optional structured prompt for UI overlay.

        Returns:
            Signed envelope as UTF-8 encoded bytes.

        Raises:
            ValueError: If spatial gate rejects the position.
        """
        # Spatial boundary check before packet generation
        result, reason = self.check_spatial(uwb_distance_m, uwb_azimuth_deg)
        if result != SpatialGateResult.PASSED:
            raise ValueError(f"Spatial Gate Rejected: {reason}")

        now = int(time.time())
        hint = ui_hint or f"Zello Ella: {action} request for {service_id}. Confirm?"

        frame = SidelinkFrame(
            frame_id=f"zello_ella_{now}",
            sender_agent=sender_agent or A2A_SENDER_ID,
            spatial=SpatialBounds(
                distance_m=uwb_distance_m,
                azimuth_deg=uwb_azimuth_deg,
                max_distance_m=self._max_distance_m,
                max_azimuth_deg=self._max_azimuth_deg,
            ),
            action=action,
            service_id=service_id,
            timestamp=now,
            ui_hint=hint,
        )

        # Serialize inner payload
        frame_dict = frame.to_dict()
        raw_json_bytes = json.dumps(
            frame_dict, separators=(",", ":")
        ).encode("utf-8")

        # Envelope with signature header
        signature = self.sign(raw_json_bytes)
        envelope = {
            "sig": signature,
            "data": frame_dict,
        }

        final_buffer = json.dumps(
            envelope, separators=(",", ":")
        ).encode("utf-8")

        return final_buffer

    # ------------------------------------------------------------------
    # Frame Verification (Receiver Side)
    # ------------------------------------------------------------------

    def receive_and_verify_sidelink_frame(
        self,
        raw_buffer: bytes,
        target_vfile_path: str,
    ) -> Tuple[FrameVerificationResult, Optional[Dict[str, Any]]]:
        """
        Execute on the recipient device: validates signature, verifies
        spatial alignment, and mutates local Vfile projection.

        This is the appless state update path — no native apps are opened.

        Args:
            raw_buffer: Raw signed envelope bytes.
            target_vfile_path: Vfile path to mutate on successful verification.

        Returns:
            (result, vfile_delta) — VALID + delta dict on success,
            or (error_result, None) on failure.
        """
        log_entry: Dict[str, Any] = {
            "timestamp": time.time(),
            "target_vfile": target_vfile_path,
        }

        try:
            envelope = json.loads(raw_buffer.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            log_entry["result"] = FrameVerificationResult.MALFORMED.value
            log_entry["error"] = str(e)
            self._frame_log.append(log_entry)
            return (FrameVerificationResult.MALFORMED, None)

        signature = envelope.get("sig")
        data = envelope.get("data")

        if not signature or not data:
            log_entry["result"] = FrameVerificationResult.MALFORMED.value
            log_entry["error"] = "Missing sig or data in envelope"
            self._frame_log.append(log_entry)
            return (FrameVerificationResult.MALFORMED, None)

        # Re-serialize inner payload for signature verification
        try:
            reconstructed_bytes = json.dumps(
                data, separators=(",", ":")
            ).encode("utf-8")
        except (TypeError, ValueError) as e:
            log_entry["result"] = FrameVerificationResult.MALFORMED.value
            log_entry["error"] = f"Cannot re-serialize data: {e}"
            self._frame_log.append(log_entry)
            return (FrameVerificationResult.MALFORMED, None)

        # Verify cryptographic signature
        if not self.verify(reconstructed_bytes, signature):
            log_entry["result"] = FrameVerificationResult.INVALID_SIGNATURE.value
            self._frame_log.append(log_entry)
            return (FrameVerificationResult.INVALID_SIGNATURE, None)

        # Extract and verify spatial bounds
        params = data.get("params", {})
        spatial = params.get("spatial_bounds", {})

        distance = spatial.get("distance_m", 999.0)
        azimuth = spatial.get("azimuth_deg", 180.0)

        result, reason = self.check_spatial(distance, azimuth)
        if result != SpatialGateResult.PASSED:
            log_entry["result"] = FrameVerificationResult.SPATIAL_VIOLATION.value
            log_entry["reason"] = reason
            self._frame_log.append(log_entry)
            return (FrameVerificationResult.SPATIAL_VIOLATION, None)

        # Mutate Vfile (Appless State Update)
        action = params.get("action", "")
        payload = params.get("payload", {})

        vfile_delta = {
            "vfile_path": target_vfile_path,
            "status": VfileStatus.MUTATED.value,
            "action": action,
            "service_id": payload.get("service_id", ""),
            "updated_at": payload.get("timestamp", int(time.time())),
        }

        self._vfiles.write(target_vfile_path, vfile_delta)

        # Extract UI hint for prompt overlay
        ui_hint_data = params.get("ui_hint", {})
        structured_prompt = ui_hint_data.get("structured_prompt", "")

        log_entry["result"] = FrameVerificationResult.VALID.value
        log_entry["action"] = action
        log_entry["service_id"] = payload.get("service_id", "")
        self._frame_log.append(log_entry)

        # Attach prompt hint to returned delta
        if structured_prompt:
            vfile_delta["ui_prompt"] = structured_prompt

        return (FrameVerificationResult.VALID, vfile_delta)

    # ------------------------------------------------------------------
    # Frame Log
    # ------------------------------------------------------------------

    def clear_frame_log(self) -> int:
        """Clear the frame verification log. Returns count of cleared entries."""
        count = len(self._frame_log)
        self._frame_log.clear()
        return count

    def get_frame_log_stats(self) -> Dict[str, int]:
        """Return counts by verification result."""
        stats: Dict[str, int] = {}
        for entry in self._frame_log:
            r = entry.get("result", "unknown")
            stats[r] = stats.get(r, 0) + 1
        return stats
