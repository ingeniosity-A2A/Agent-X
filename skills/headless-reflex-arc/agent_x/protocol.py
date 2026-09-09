"""
Agent X Handshake Protocol — wire format definitions.

Defines the exact HTTP contract between Agent X and Core-Membrane.
This file is the single source of truth for the API shape.
Any Agent X implementation (Python, CF Worker, Rust) must follow this contract.

Zero Context Weight: only stdlib imports.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ====================================================================
# Wire Types (shared between Agent X and Core-Membrane)
# ====================================================================

@dataclass
class CapabilityRegistration:
    """A single capability that Agent X registers with the membrane."""
    capability_name: str
    version: str = "1.0.0"
    schema_hash: Optional[str] = None
    priority: int = 50

    def to_dict(self) -> Dict[str, Any]:
        return {
            "capability_name": self.capability_name,
            "version": self.version,
            "schema_hash": self.schema_hash,
            "priority": self.priority,
        }


@dataclass
class RegistrationRequest:
    """POST /a2a/register request body."""
    agent_id: str
    capabilities: List[CapabilityRegistration] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "capabilities": [c.to_dict() for c in self.capabilities],
        }


@dataclass
class HeartbeatRequest:
    """POST /a2a/heartbeat request body."""
    agent_id: str

    def to_dict(self) -> Dict[str, Any]:
        return {"agent_id": self.agent_id}


@dataclass
class DeltaStateRequest:
    """POST /a2a/delta_state request body."""
    session_id: str
    agent_id: str
    turn_index: int
    delta_patch: str  # JSON string

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "turn_index": self.turn_index,
            "delta_patch": self.delta_patch,
        }


@dataclass
class RegistrationResponse:
    """Response from /a2a/register."""
    status: str
    agent_id: str
    capabilities_registered: int
    message: str = ""


@dataclass
class HeartbeatResponse:
    """Response from /a2a/heartbeat."""
    status: str
    agent_id: str
    registered_capabilities: int


@dataclass
class DeltaStateResponse:
    """Response from /a2a/delta_state."""
    status: str
    session_id: str
    turn_index: int


# ====================================================================
# API Endpoint Contract
# ====================================================================

A2A_ENDPOINTS = {
    "register": {
        "method": "POST",
        "path": "/a2a/register",
        "request": "RegistrationRequest",
        "response": "RegistrationResponse",
        "description": "Register Agent X capabilities with the Core-Membrane",
    },
    "heartbeat": {
        "method": "POST",
        "path": "/a2a/heartbeat",
        "request": "HeartbeatRequest",
        "response": "HeartbeatResponse",
        "description": "Liveness heartbeat (30s interval recommended)",
    },
    "delta_state": {
        "method": "POST",
        "path": "/a2a/delta_state",
        "request": "DeltaStateRequest",
        "response": "DeltaStateResponse",
        "description": "Push a DeltaState patch for O(1) session sync",
    },
    "session_history": {
        "method": "GET",
        "path": "/a2a/session_history",
        "params": ["session_id", "since_turn"],
        "response": "List[Dict]",
        "description": "Retrieve DeltaState patches for session rehydration",
    },
    "capabilities": {
        "method": "GET",
        "path": "/a2a/capabilities",
        "response": "List[Dict]",
        "description": "List all registered capabilities across all agents",
    },
}


# ====================================================================
# Cloudflare Worker Reference (TypeScript)
# ====================================================================

CLOUDFLARE_WORKER_REFERENCE = '''
// Agent X — Cloudflare Worker handshake reference
// Matches the protocol defined in protocol.py

interface Env {
  MEMBRANE_URL: string;
  AUTH_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", agent: "cf-worker" });
    }

    if (url.pathname === "/register" && request.method === "POST") {
      return handleRegister(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await request.json();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (env.AUTH_TOKEN) headers["Authorization"] = `Bearer ${env.AUTH_TOKEN}`;

  const resp = await fetch(`${env.MEMBRANE_URL}/a2a/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      agent_id: body.agent_id,
      capabilities: body.capabilities,
    }),
  });
  return resp;
}
'''


# ====================================================================
# Rust Reference (pseudo-code)
# ====================================================================

RUST_REFERENCE = '''
// Agent X — Rust handshake reference
// Matches the protocol defined in protocol.py
//
// Dependencies: reqwest, serde, serde_json, tokio

use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Serialize)]
struct RegistrationRequest {
    agent_id: String,
    capabilities: Vec<CapabilityRegistration>,
}

#[derive(Serialize, Deserialize)]
struct CapabilityRegistration {
    capability_name: String,
    version: String,
    schema_hash: Option<String>,
    priority: i32,
}

#[derive(Deserialize)]
struct RegistrationResponse {
    status: String,
    agent_id: String,
    capabilities_registered: i32,
}

async fn register(membrane_url: &str, agent_id: &str) -> Result<RegistrationResponse, reqwest::Error> {
    let client = Client::new();
    let body = RegistrationRequest {
        agent_id: agent_id.to_string(),
        capabilities: vec![
            CapabilityRegistration {
                capability_name: "rust-extract".into(),
                version: "1.0.0".into(),
                schema_hash: None,
                priority: 80,
            },
        ],
    };
    let resp = client
        .post(&format!("{}/a2a/register", membrane_url))
        .json(&body)
        .send()
        .await?
        .json::<RegistrationResponse>()
        .await?;
    Ok(resp)
}
'''