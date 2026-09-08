# Runtime Context — L2 Active Scenarios

## Scenario: memory-tdai completion
- goal: complete the Aetheris file system (streamer + tiers + explorer)
- surfaces: /agent-browser/interface/aetheris (Bento UI8 plugin slot)
- engine: scripts/rev_ike_streamer.py + scripts/memory_tdai.py

## Scenario: forge-org boundary
- The Forged File Vault (F0-F3) is the governance pipeline.
- memory-tdai is the lived-in file system the explorer presents.
- Vendor boundary: Hugging Face (huggingface_hub) — content-addressed, outside F0-F3.

## Active task directories
- modules/aetheris/data/memory-tdai   (housing)
- platform/src/app/api/memory         (API layer)
- platform/src/components/aetheris    (explorer surface)
