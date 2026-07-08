"""
Interaction Quantum — Atomic JSON Memory Particle

The fundamental computational primitive replacing database rows,
log entries, and packet headers. Each quantum is a self-contained
unit of interaction state with cryptographic lineage, RF metadata,
and temporal orchestration fields.

Architecture:
  - Quantum Core: ID, timestamp, source DID, parent lineage, cognitive state
  - RF Physical Layer: CC1101/SX1262 transceiver parameters
  - Crypto Routing: NullSec AEAD + AODV mesh + FEC
  - Temporal Index: GSAP ticker, Doppler, RSSI, AoA
  - T-SLAT: Temporal Structured Latents (geometry + signal + RF)
"""

from .quantum import InteractionQuantum, QuantumBuilder, RFPhysical, CryptoRouting, TemporalIndex, TSLAT
from .crypto import QuantumSigner, QuantumVerifier
from .dag import TashiDAG
from .memory_lake import AtomicMemoryLake
from .vfile import VFile
from .gsap import TemporalOrchestrator, TweenAtom
from .rf_physical import RFPhysicalLayer, CC1101Config, SX1262Config
from .task_memory import GriptapeTaskMemory, MemoryEntry
from .lora_mesh import LoRaMeshProtocol, AODVRouter, ChaCha20, ReedSolomonFEC, MeshNode, MeshPacket, Transport
from .flipper import FlipperEncoder, FlipperCommand, FlipperSignal, FlipperProtocol
from .zero_latency_harness import ZeroLatencyHarness
from .termux_bridge import TermuxHardwareBridge, TermuxSMS, TermuxLocation, TermuxSensors, TermuxNotification, TermuxTTS
from .beeper_bridge import MatrixClient, BeeperQuantumBridge

__version__ = "2.0.0"
__all__ = [
    "InteractionQuantum",
    "QuantumBuilder",
    "QuantumSigner",
    "QuantumVerifier",
    "TashiDAG",
    "AtomicMemoryLake",
    "VFile",
    "TemporalOrchestrator",
    "TweenAtom",
    "RFPhysicalLayer",
    "CC1101Config",
    "SX1262Config",
    "GriptapeTaskMemory",
    "MemoryEntry",
    "LoRaMeshProtocol",
    "AODVRouter",
    "ChaCha20",
    "ReedSolomonFEC",
    "MeshNode",
    "MeshPacket",
    "Transport",
    "FlipperEncoder",
    "FlipperCommand",
    "FlipperSignal",
    "FlipperProtocol",
    "ZeroLatencyHarness",
    "TermuxHardwareBridge",
    "TermuxSMS",
    "TermuxLocation",
    "TermuxSensors",
    "TermuxNotification",
    "TermuxTTS",
    "MatrixClient",
    "BeeperQuantumBridge",
]
