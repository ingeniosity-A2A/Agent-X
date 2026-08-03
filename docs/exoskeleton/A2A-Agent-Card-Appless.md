# A2A Agent Card (VCard) — Appless Communication

**Role:** External discovery & A2A interop for appless surfaces  
**Architecture:** Cybernetic Ava007 · Rotational Exoskeleton  
**Version:** 0.1  
**Status:** Active  
**Related:** Capability Discovery, Capability Orchestration, Agent-X appless

---

## 1. Naming

| Term | Meaning here |
|------|----------------|
| **Agent Card** | A2A discovery document (JSON) — industry standard name |
| **VCard** | Same artifact in Ava007 docs (discovery “calling card” for A2A) — **not** IETF personal vCard (`.vcf`) |
| **Appless** | Channel that works without a full native app shell (headless HTTP/gRPC/JSON-RPC endpoint, messenger bridge, or minimal WebView) |

The VCard lets **external** A2A clients discover how to talk to an Ava007 **gateway**.  
It does **not** advertise a peer Intellect equal to Core-Q².

---

## 2. Principle

```text
External A2A client
        │
        │ GET Agent Card (VCard)
        ▼
Appless A2A gateway (capability surface)
        │
        │ map task → Intent / capability call
        ▼
Exoskeleton substrate → capabilities → observation
        │
        ▼
A2A task result (structured)
```

Cybernetic Ava007 remains sovereign behind the gateway.  
The card describes **what the gateway accepts**, auth, endpoints, and modalities.

---

## 3. Well-known locations

Publish at least one:

```text
https://<gateway-host>/.well-known/agent-card.json
https://<gateway-host>/.well-known/agent.json
```

Appless mobile/edge may also serve:

```text
https://<gateway-host>/a2a/vcard
```

Same JSON schema either way.

---

## 4. VCard schema (A2A Agent Card profile)

```json
{
  "name": "Ava007 Help Assembly Gateway",
  "description": "Appless A2A entry for Help Assembly Exoskeleton workflows. Not a peer Intellect.",
  "version": "1.0.0",
  "protocol": "a2a",
  "protocol_version": "1.0",
  "url": "https://gateway.example.com/a2a",
  "provider": {
    "organization": "Ingeniosity",
    "url": "https://github.com/ingeniosity-A2A"
  },
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "structuredOutputs": true
  },
  "defaultInputModes": ["text", "application/json"],
  "defaultOutputModes": ["text", "application/json"],
  "skills": [
    {
      "id": "help_assembly.quote",
      "name": "Assembly quote",
      "description": "Create or revise a field assembly quote",
      "tags": ["exo.help_assembly", "quote"],
      "inputModes": ["application/json", "text"],
      "outputModes": ["application/json"]
    },
    {
      "id": "esa.inventory_match",
      "name": "Inventory match",
      "description": "Match part text or reference to catalog",
      "tags": ["exo.esa", "inventory"],
      "inputModes": ["application/json", "text"],
      "outputModes": ["application/json"]
    }
  ],
  "authentication": {
    "schemes": ["bearer", "oauth2"]
  },
  "exo_default": "exo.help_assembly",
  "sovereignty_note": "Tasks are fulfilled by Cybernetic Ava007 via substrate capabilities. This card is a gateway, not a second mind."
}
```

### Field guidance

| Field | Rule |
|-------|------|
| `skills[]` | Map to **internal capability ids** or skill ids |
| `tags` | Include `exo.*` where relevant |
| `url` | Appless A2A endpoint (JSON-RPC/HTTP/gRPC per deployment) |
| `sovereignty_note` | Required in Ava007-issued cards |
| Auth | Mandatory for production |

---

## 5. Appless channel behavior

**Appless** means the client may be:

- Another organization’s A2A agent  
- A messenger/automation bridge  
- A headless script or edge service  
- Agent-X appless UI path  

Requirements:

1. **No assumption of a full app shell** — card + endpoint suffice.  
2. **Structured tasks** preferred (`application/json` aligned with Structured Outputs).  
3. **Streaming** optional via SSE/A2A stream if `capabilities.streaming` is true.  
4. **Session** may be short-lived; bind `session_id` in task metadata when receipts required.  
5. Active Exoskeleton may be pinned by card `exo_default` or task metadata override (policy-checked).

---

## 6. Inbound task mapping

```text
A2A Task
  → validate auth + skill id
  → resolve skill/capability via Capability Discovery
  → build Intent (Ava) or direct capability call (substrate policy)
  → execute under exo allowlist
  → return A2A artifact / structured result
  → receipt if production
```

Forbidden: exposing raw Core-Q² weights, MemBrain full dump, or sandbox internals in A2A artifacts.

---

## 7. Outbound A2A (optional)

If Ava’s substrate must call an external A2A agent:

1. Fetch their Agent Card.  
2. Verify auth/identity policy.  
3. Treat remote agent as **external capability/gateway**.  
4. Map result into an **observation**.  
5. Never import remote agent as a peer Intellect into context.

---

## 8. Example — Help Assembly appless VCard (minimal)

```json
{
  "name": "Help Assembly Appless",
  "description": "A2A gateway for exo.help_assembly",
  "version": "1.0.0",
  "url": "https://help-assembly.example/a2a",
  "skills": [
    {
      "id": "help_assembly.patterns",
      "name": "Assembly patterns",
      "description": "Run field assembly pattern library",
      "tags": ["exo.help_assembly"]
    }
  ],
  "authentication": { "schemes": ["bearer"] },
  "exo_default": "exo.help_assembly",
  "sovereignty_note": "Gateway only. Intellect is Cybernetic Ava007."
}
```

---

## 9. Implementation map

| Piece | Location |
|-------|----------|
| Card document | Served by appless gateway / Agent-X edge |
| Skill ↔ capability map | Capability Discovery registry |
| Runtime | Agent-X `src/` + platform or dedicated gateway service |
| Policy | Exo allowlist + Shared Execution Contract |

---

## 10. One-Line Summary

> **VCard = A2A Agent Card for appless entry.  
> Discover the gateway, not a second Ava.  
> Tasks become Intent or capability calls.  
> Sovereignty stays behind the card.**
EOF