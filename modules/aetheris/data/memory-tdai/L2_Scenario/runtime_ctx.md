# Runtime Context — L2 Active Scenarios

## Scenario: memory-tdai completion
- goal: complete the Aetheris pipeline (streamer + tiers + explorer)
- surfaces: /agent-browser/interface/aetheris (Bento UI8 plugin slot)
- engine: scripts/rev_ike_streamer.py + scripts/memory_tdai.py

## Scenario: forge-org boundary
- ForgedxFolders (F0-F3) is the canonical file system — retires "Forged File Vault".
- Aetheris (memory-tdai) is the trial pipeline to become the next FORGED
  (Forged File Standard §11) — not a competing file system.
- Vendor boundary: Hugging Face (huggingface_hub) — content-addressed, outside F0-F3.

## Active task directories
- modules/aetheris/data/memory-tdai   (housing)
- platform/src/app/api/memory         (API layer)
- platform/src/components/aetheris    (explorer surface)
