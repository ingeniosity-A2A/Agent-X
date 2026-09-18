# Agent-X edge containers

Independently deployable runtime boundaries for physical connectivity.
**Not** cognitive layer. **Not** RAN (see fapo-ran).

```text
containers/
├── cellular-edge/     # Onomondo, nRF91, NCS
├── hardware-io/       # Termux USB serial / modem
├── rf-edge/           # SX1262, CC1101, LoRa
├── sdr-edge/          # xSDR, gr-gsm, etc.
├── telecom-gateway/   # Telnyx
└── edge-tunnel/       # Cloudflare Tunnel
```

Phase 1: structure + ownership docs.  
Phase 2–3: move implementations with import shims.  
Phase 6 only: remove duplicates after tests pass.
