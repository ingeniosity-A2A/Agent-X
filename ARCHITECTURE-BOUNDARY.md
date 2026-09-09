# Agent-X — Canonical Capability and Mesh Boundary

Status: authoritative Agent-X boundary.

Agent-X is the world-facing capability and distributed coordination surface attached through the A2A Exoskeleton. It is not Cybernetic-Ava007 and it is not the device-wide runtime.

## Owns

- capability adapters and execution surfaces
- Browser, Bash, Linux, Termux and connectivity capabilities
- ESA and HelpAssembly capability/service surfaces
- experimental/latent capability execution under runtime isolation
- mesh and distributed/network coordination
- normalized observations returned through the A2A boundary

## Does not own

- Ava007 cognition, reasoning, or identity
- Skills/Firmware intelligence authority
- persistent cognitive memory
- runtime/device management
- NPU/GPU/thermal scheduling
- global orchestration substrate

## Skill/Firmware relationship

```text
Cybernetic-Ava007
  Skill = intelligence / firmware authority
          │
          ▼
A2A Exoskeleton
  verify + mount + transport
          │
          ▼
Agent-X
  capability adapter / execution
```

The existence of an adapter in Agent-X never makes that adapter the authority for the Skill's intelligence.

## Experimental path

Experimental capability code remains isolated and returns normalized observations. Promotion to a stable capability requires the repository's governance/promotion process. Experimental state must not be injected into Ava007 cognitive context.

## UI authority

Visual and shell authority for console surfaces lives with the Agent Browser surface and uploaded shell attachments, which are applied verbatim. `esa-exoskeleton/` is a mount/verify/transport host: it carries the tenants' service cards (ESA: five rendering cards, calendar, catalog DB, inventory) and must not originate shell or UI redesigns. Tenant brands stay inside tenant cards; framework chrome stays framework-branded. Full manifest: `esa-exoskeleton/docs/UI-AUTHORITY.md`.

## Boundary cleanup

Legacy `cognitive_state` fields in transport/capability code are not an alternative A2A protocol. Replace their use with opaque `intent_id`, `capability`, skill/version references, and observation metadata. Preserve behavior and UI while removing cognitive ownership from the execution surface.

## Scientific integrity

Do not encode fictional research names or unsupported benchmark claims as implementation facts. Established mechanisms must retain their real names and citations.
