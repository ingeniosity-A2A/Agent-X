"""
Agent X Client — Core-Membrane Handshake SDK.

Provides a lightweight client for external agents (Python, CF Worker, Rust)
to register capabilities and sync DeltaState patches with the central
Core-Membrane DuckDB instance.

Architecture:
  - Registration: HTTP POST to /a2a/register (FastAPI on http-api)
  - Heartbeat:    HTTP POST to /a2a/heartbeat
  - DeltaState:   HTTP POST to /a2a/delta_state
  - Telemetry:    Quack protocol (quack://host:9494) or HTTP fallback

Zero Context Weight: only stdlib at module level.
"""
import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AgentXConfig:
    """Configuration for Agent X client connection."""
    agent_id: str = ""
    membrane_http_url: str = "http://localhost:8000"
    quack_url: str = "quack://localhost:9494"
    heartbeat_interval_seconds: float = 30.0
    auth_token: Optional[str] = None
    capabilities: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self):
        if not self.agent_id:
            self.agent_id = f"agent-{uuid.uuid4().hex[:8]}"


class AgentXClient:
    """
    Agent X client for Core-Membrane handshake.

    Usage:
        client = AgentXClient(AgentXConfig(
            membrane_http_url="http://localhost:8000",
            capabilities=[{"name": "pdf-extract", "version": "1.2.0"}]
        ))
        await client.connect()
        await client.push_delta(session_id, turn_index, {"status": "complete"})
        await client.disconnect()
    """

    def __init__(self, config: Optional[AgentXConfig] = None):
        self.config = config or AgentXConfig()
        self._connected = False
        self._session = None
        self._heartbeat_task = None
        self._duckdb_conn = None

    @property
    def agent_id(self) -> str:
        return self.config.agent_id

    @property
    def is_connected(self) -> bool:
        return self._connected

    # ------------------------------------------------------------------
    # Lazy gates — zero context weight at import time
    # ------------------------------------------------------------------

    @staticmethod
    def _ensure_requests():
        """Lazy gate for requests library."""
        import requests as _r
        return _r

    @staticmethod
    def _ensure_duckdb():
        """Lazy gate for DuckDB (Quack direct connect)."""
        import duckdb as _d
        return _d

    def _headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.config.auth_token:
            h["Authorization"] = f"Bearer {self.config.auth_token}"
        return h

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> Dict[str, Any]:
        """
        Perform the full handshake:
        1. Register capabilities with Core-Membrane
        2. Start heartbeat loop
        3. Optionally connect via Quack protocol

        Returns the registration response from the membrane.
        """
        import asyncio

        result = await self._register_capabilities()
        self._connected = True

        # Start background heartbeat
        self._heartbeat_task = asyncio.ensure_future(self._heartbeat_loop())

        # Attempt Quack direct connection (non-blocking, best-effort)
        self._try_quack_connect()

        return result

    async def disconnect(self):
        """Graceful disconnect — cancel heartbeat, close Quack."""
        self._connected = False
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            self._heartbeat_task = None
        if self._duckdb_conn:
            try:
                self._duckdb_conn.close()
            except Exception:
                pass
            self._duckdb_conn = None

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    async def _register_capabilities(self) -> Dict[str, Any]:
        """Register all capabilities with the Core-Membrane via HTTP."""
        import asyncio

        requests = self._ensure_requests()
        loop = asyncio.get_event_loop()

        url = f"{self.config.membrane_http_url}/a2a/register"
        payload = {
            "agent_id": self.config.agent_id,
            "capabilities": [
                {
                    "capability_name": cap.get("name", "unknown"),
                    "version": cap.get("version", "1.0.0"),
                    "schema_hash": cap.get("schema_hash") or self._compute_schema_hash(cap),
                    "priority": cap.get("priority", 50),
                }
                for cap in self.config.capabilities
            ],
        }

        response = await loop.run_in_executor(
            None,
            lambda: requests.post(url, json=payload, headers=self._headers(), timeout=10.0),
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Heartbeat
    # ------------------------------------------------------------------

    async def _heartbeat_loop(self):
        """Background loop sending heartbeats to the membrane."""
        import asyncio

        while self._connected:
            await asyncio.sleep(self.config.heartbeat_interval_seconds)
            if not self._connected:
                break
            try:
                await self._send_heartbeat()
            except Exception:
                pass  # Heartbeat failures are non-fatal

    async def _send_heartbeat(self) -> bool:
        """Send a single heartbeat to the membrane."""
        import asyncio

        requests = self._ensure_requests()
        loop = asyncio.get_event_loop()

        url = f"{self.config.membrane_http_url}/a2a/heartbeat"
        payload = {"agent_id": self.config.agent_id}

        response = await loop.run_in_executor(
            None,
            lambda: requests.post(url, json=payload, headers=self._headers(), timeout=5.0),
        )
        return response.status_code == 200

    # ------------------------------------------------------------------
    # DeltaState sync
    # ------------------------------------------------------------------

    async def push_delta(
        self,
        session_id: str,
        turn_index: int,
        delta_patch: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Push a DeltaState patch to the Core-Membrane.

        This is the core O(1) context scaling mechanism:
        only the minimal diff is transmitted, never full state.

        Args:
            session_id: Active substrate session identifier.
            turn_index: Monotonic turn counter.
            delta_patch: Minimal diff (scalar refs, never raw buffers).

        Returns:
            Server acknowledgment.
        """
        import asyncio

        requests = self._ensure_requests()
        loop = asyncio.get_event_loop()

        url = f"{self.config.membrane_http_url}/a2a/delta_state"
        payload = {
            "session_id": session_id,
            "agent_id": self.config.agent_id,
            "turn_index": turn_index,
            "delta_patch": json.dumps(delta_patch),
        }

        response = await loop.run_in_executor(
            None,
            lambda: requests.post(url, json=payload, headers=self._headers(), timeout=5.0),
        )
        response.raise_for_status()
        return response.json()

    async def get_session_history(
        self, session_id: str, since_turn: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve DeltaState patches for a session since a given turn.

        Used for session rehydration when a new Agent X instance
        takes over for a previously-disconnected agent.
        """
        import asyncio

        requests = self._ensure_requests()
        loop = asyncio.get_event_loop()

        url = f"{self.config.membrane_http_url}/a2a/session_history"
        params = {
            "session_id": session_id,
            "since_turn": since_turn,
        }

        response = await loop.run_in_executor(
            None,
            lambda: requests.get(
                url, params=params, headers=self._headers(), timeout=10.0
            ),
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Capability queries
    # ------------------------------------------------------------------

    async def list_capabilities(self) -> List[Dict[str, Any]]:
        """List all capabilities registered in the membrane."""
        import asyncio

        requests = self._ensure_requests()
        loop = asyncio.get_event_loop()

        url = f"{self.config.membrane_http_url}/a2a/capabilities"
        response = await loop.run_in_executor(
            None,
            lambda: requests.get(url, headers=self._headers(), timeout=10.0),
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Quack direct connection (best-effort)
    # ------------------------------------------------------------------

    def _try_quack_connect(self):
        """
        Attempt to connect directly via Quack protocol for
        low-latency telemetry and delta transport.

        Falls back to HTTP if Quack extension is unavailable.
        """
        try:
            duckdb = self._ensure_duckdb()
            self._duckdb_conn = duckdb.connect(self.config.quack_url)
        except Exception:
            self._duckdb_conn = None

    def send_telemetry_quack(self, events: List[Dict[str, Any]]) -> bool:
        """
        Send telemetry directly via Quack protocol (no HTTP overhead).

        This is the preferred path when Quack is available, as it
        avoids JSON serialization and HTTP framing entirely.
        """
        if self._duckdb_conn is None:
            return False

        try:
            # Insert telemetry directly into the remote DuckDB
            for event in events:
                self._duckdb_conn.execute(
                    "INSERT INTO telemetry VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        event.get("timestamp", time.time()),
                        event.get("event_type", "unknown"),
                        event.get("capability_name", "unknown"),
                        event.get("tier"),
                        event.get("duration_ms", 0.0),
                        event.get("status", "unknown"),
                        event.get("tokens"),
                        event.get("error_message"),
                        json.dumps(event.get("metadata", {})),
                    ],
                )
            return True
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_schema_hash(capability: Dict[str, Any]) -> str:
        """Compute a deterministic hash of a capability's schema definition."""
        schema_str = json.dumps(capability, sort_keys=True)
        return hashlib.sha256(schema_str.encode()).hexdigest()[:16]
