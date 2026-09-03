"""
Agent X Client SDK — lightweight O(1) client for Core-Membrane handshake.

Agent X is any external entity (Python process, Cloudflare Worker, Rust binary)
that connects to the Core-Membrane (central DuckDB + Quack server) to:
  1. Register capabilities into capability_registry
  2. Push DeltaState patches into session_history
  3. Send telemetry via Quack protocol
  4. Receive heartbeats and stay alive

The Hardware Membrane provides the Unified Collapse layer for 5G NR Sidelink
communication with UWB AoA spatial gating and HMAC-SHA256 cryptographic
verification. It transforms voice intents into signed A2A payloads and
mutates transient Vfile state projections without opening native apps.

Edge Device: Galaxy S26 Ultra (canonical per AGENTS.md).
Consumer Connectivity: Entitled SIM/eSIM (Xfinity / Google Fi) + Google Voice.
SoftSIM is IoT-only; never used as a consumer carrier unlock.

CRITICAL CONSTRAINT — Zero Context Weight:
    This module MUST import in O(1) time with zero heavy dependencies.
    Only stdlib imports at module level. DuckDB, requests, etc. are gated
    behind _ensure_loaded() lazy gates.
"""
from exoskeleton.agent_x.client import AgentXClient, AgentXConfig
from exoskeleton.agent_x.membrane import (
    EDGE_DEVICE_CLASS,
    AgentXHardwareMembrane,
    FrameVerificationResult,
    SpatialBounds,
    SpatialGateResult,
    VfileStatus,
    VfileStore,
)

__all__ = [
    "AgentXClient",
    "AgentXConfig",
    "AgentXHardwareMembrane",
    "EDGE_DEVICE_CLASS",
    "FrameVerificationResult",
    "SpatialBounds",
    "SpatialGateResult",
    "VfileStatus",
    "VfileStore",
]
