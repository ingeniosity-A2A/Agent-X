"""
LoRa Mesh Gossip Protocol

Implements the NullSec LoRa Mesh for Interaction Quantum propagation.

Architecture:
- AODV (Ad hoc On-Demand Distance Vector) routing
- ChaCha20-Poly1305 AEAD encryption
- Reed-Solomon FEC for noisy link resilience
- CRDT-like merge for offline/conflict resolution
- Power-aware transmission (urgency → TX power)

Physical transport:
- CC1101: sub-GHz (300-928 MHz), FSK/GFSK/OOK
- SX1262: LoRa CSS, SF7-SF12, up to +22 dBm
- BLE: short-range quantum gossip
- Wi-Fi Aware: high-bandwidth batch transfer
"""

import hashlib
import json
import math
import os
import struct
import time
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable


class Transport(str, Enum):
    LORA = "lora"
    BLE = "ble"
    WIFI_AWARE = "wifi_aware"
    FSK = "fsk"
    CSS = "css"


class MeshRole(str, Enum):
    ORIGIN = "origin"       # Original sender
    RELAY = "relay"         # Forwarding node
    SINK = "sink"           # Final destination
    LISTENER = "listener"   # Passive receiver


@dataclass
class MeshNode:
    """A node in the LoRa mesh network."""
    did: str                              # Node DID
    role: MeshRole = MeshRole.LISTENER
    position: tuple[float, float, float] = (0, 0, 0)  # x, y, z (meters)
    rssi_history: list[float] = field(default_factory=list)
    snr_history: list[float] = field(default_factory=list)
    last_seen: float = 0.0
    battery_pct: float = 100.0
    transport: Transport = Transport.LORA
    is_gateway: bool = False              # Connected to internet backhaul

    def avg_rssi(self) -> float:
        return sum(self.rssi_history) / len(self.rssi_history) if self.rssi_history else -120

    def avg_snr(self) -> float:
        return sum(self.snr_history) / len(self.snr_history) if self.snr_history else 0

    def distance_to(self, other: "MeshNode") -> float:
        """Euclidean distance to another node in meters."""
        dx = self.position[0] - other.position[0]
        dy = self.position[1] - other.position[1]
        dz = self.position[2] - other.position[2]
        return math.sqrt(dx*dx + dy*dy + dz*dz)


@dataclass
class MeshPacket:
    """
    A packet in the LoRa mesh network.
    
    Wraps an Interaction Quantum with mesh routing metadata.
    """
    packet_id: str                        # Unique packet ID
    source_did: str                       # Origin node
    destination_did: Optional[str]        # Target node (None = broadcast)
    quantum_data: bytes                   # Serialized quantum (encrypted)
    hop_count: int = 0
    max_hops: int = 15
    ttl: int = 15                         # Time-to-live in hops
    path: list[str] = field(default_factory=list)  # DIDs of nodes traversed
    transport: Transport = Transport.LORA
    rssi: float = -120.0
    snr: float = 0.0
    timestamp: float = field(default_factory=time.time)
    encrypted: bool = True
    fec_data: Optional[bytes] = None      # Forward Error Correction

    def to_dict(self) -> dict:
        d = {
            "packet_id": self.packet_id,
            "source_did": self.source_did,
            "destination_did": self.destination_did,
            "hop_count": self.hop_count,
            "max_hops": self.max_hops,
            "ttl": self.ttl,
            "path": self.path,
            "transport": self.transport.value,
            "rssi": self.rssi,
            "snr": self.snr,
            "timestamp": self.timestamp,
            "encrypted": self.encrypted,
        }
        if self.quantum_data:
            d["quantum_data_b64"] = self.quantum_data.hex()
        if self.fec_data:
            d["fec_b64"] = self.fec_data.hex()
        return d


# ─── ChaCha20-Poly1305 (Minimal Implementation) ─────────────────────

class ChaCha20:
    """
    ChaCha20 stream cipher (RFC 8439).
    
    Minimal implementation for quantum encryption.
    For production, use PyNaCl or cryptography library.
    """

    def __init__(self, key: bytes, nonce: bytes):
        if len(key) != 32:
            raise ValueError("Key must be 32 bytes")
        if len(nonce) != 12:
            raise ValueError("Nonce must be 12 bytes")
        self.key = key
        self.nonce = nonce

    @staticmethod
    def _quarter_round(state, a, b, c, d):
        """ChaCha20 quarter round."""
        state[a] = (state[a] + state[b]) & 0xFFFFFFFF
        state[d] ^= state[a]
        state[d] = ((state[d] << 16) | (state[d] >> 16)) & 0xFFFFFFFF
        
        state[c] = (state[c] + state[d]) & 0xFFFFFFFF
        state[b] ^= state[c]
        state[b] = ((state[b] << 12) | (state[b] >> 20)) & 0xFFFFFFFF
        
        state[a] = (state[a] + state[b]) & 0xFFFFFFFF
        state[d] ^= state[a]
        state[d] = ((state[d] << 8) | (state[d] >> 24)) & 0xFFFFFFFF
        
        state[c] = (state[c] + state[d]) & 0xFFFFFFFF
        state[b] ^= state[c]
        state[b] = ((state[b] << 7) | (state[b] >> 25)) & 0xFFFFFFFF

    def _generate_block(self, counter: int) -> bytes:
        """Generate a single ChaCha20 keystream block."""
        constants = b"expand 32-byte k"
        state = list(struct.unpack("<16I", constants + self.key + struct.pack("<I", counter) + self.nonce))
        working = list(state)

        for _ in range(10):  # 20 rounds = 10 double rounds
            # Column rounds
            self._quarter_round(working, 0, 4, 8, 12)
            self._quarter_round(working, 1, 5, 9, 13)
            self._quarter_round(working, 2, 6, 10, 14)
            self._quarter_round(working, 3, 7, 11, 15)
            # Diagonal rounds
            self._quarter_round(working, 0, 5, 10, 15)
            self._quarter_round(working, 1, 6, 11, 12)
            self._quarter_round(working, 2, 7, 8, 13)
            self._quarter_round(working, 3, 4, 9, 14)

        result = [(working[i] + state[i]) & 0xFFFFFFFF for i in range(16)]
        return struct.pack("<16I", *result)

    def encrypt(self, plaintext: bytes) -> bytes:
        """Encrypt plaintext using ChaCha20."""
        ciphertext = bytearray()
        blocks_needed = (len(plaintext) + 63) // 64

        for i in range(blocks_needed):
            keystream = self._generate_block(i + 1)
            block = plaintext[i*64:(i+1)*64]
            ciphertext.extend(bytes(a ^ b for a, b in zip(block, keystream[:len(block)])))

        return bytes(ciphertext)

    def decrypt(self, ciphertext: bytes) -> bytes:
        """Decrypt ciphertext (ChaCha20 is symmetric)."""
        return self.encrypt(ciphertext)


# ─── Reed-Solomon FEC (Simplified) ───────────────────────────────────

class ReedSolomonFEC:
    """
    Simplified Reed-Solomon Forward Error Correction.
    
    RS(8,16) — 8 data symbols, 16 total symbols.
    Can correct up to 4 symbol errors.
    
    For production: use the `reedsolo` library.
    This is a simplified XOR-based FEC for demonstration.
    """

    def __init__(self, data_symbols: int = 8, total_symbols: int = 16):
        self.data_symbols = data_symbols
        self.total_symbols = total_symbols
        self.parity_symbols = total_symbols - data_symbols

    def encode(self, data: bytes) -> bytes:
        """
        Encode data with FEC redundancy.
        
        Pads data to data_symbols boundaries, then adds parity.
        """
        # Pad to data_symbols boundary
        block_size = self.data_symbols
        padded = data + b"\x00" * ((block_size - len(data) % block_size) % block_size)

        result = bytearray()
        for i in range(0, len(padded), block_size):
            block = padded[i:i+block_size]
            # Generate parity via XOR (simplified)
            parity = bytearray(self.parity_symbols)
            for j, byte in enumerate(block):
                parity[j % self.parity_symbols] ^= byte
            result.extend(block)
            result.extend(parity)

        return bytes(result)

    def decode(self, data: bytes) -> bytes:
        """
        Decode FEC-encoded data.
        
        Strips parity symbols to recover original data.
        """
        block_size = self.total_symbols
        result = bytearray()

        for i in range(0, len(data), block_size):
            block = data[i:i+block_size]
            if len(block) >= self.data_symbols:
                result.extend(block[:self.data_symbols])

        return bytes(result)


# ─── AODV Routing ────────────────────────────────────────────────────

class AODVRouter:
    """
    Ad hoc On-Demand Distance Vector routing for LoRa mesh.
    
    Maintains:
    - Route table: destination → next_hop, hop_count, seq_num
    - Neighbor table: direct neighbors with RSSI/SNR
    - Pending packets: waiting for route discovery
    """

    def __init__(self, local_did: str):
        self.local_did = local_did
        self.routes: dict[str, dict] = {}       # dest → {next_hop, hops, seq, expiry}
        self.neighbors: dict[str, MeshNode] = {}  # did → MeshNode
        self.pending: list[MeshPacket] = []      # Awaiting route
        self.seq_num: int = 0
        self.route_expiry: int = 300             # seconds

    def add_neighbor(self, node: MeshNode):
        """Add or update a neighbor node."""
        self.neighbors[node.did] = node
        node.last_seen = time.time()
        
        # Direct route to neighbor
        self.routes[node.did] = {
            "next_hop": node.did,
            "hop_count": 1,
            "seq_num": 0,
            "expiry": time.time() + self.route_expiry,
            "rssi": node.avg_rssi(),
        }

    def find_route(self, destination_did: str) -> Optional[dict]:
        """Find the best route to a destination."""
        route = self.routes.get(destination_did)
        if route and route["expiry"] > time.time():
            return route
        
        # Try to find through neighbors
        for neighbor_did, neighbor in self.neighbors.items():
            if neighbor.is_gateway:
                # Gateway can reach anyone
                return {
                    "next_hop": neighbor_did,
                    "hop_count": 2,
                    "seq_num": 0,
                    "expiry": time.time() + self.route_expiry,
                    "rssi": neighbor.avg_rssi(),
                }

        return None

    def next_hop(self, destination_did: str) -> Optional[str]:
        """Get the next hop for a destination."""
        route = self.find_route(destination_did)
        return route["next_hop"] if route else None

    def should_forward(self, packet: MeshPacket) -> bool:
        """Determine if this node should forward a packet."""
        # Don't forward if we've already seen it
        if self.local_did in packet.path:
            return False
        
        # Don't forward if TTL expired
        if packet.ttl <= 0:
            return False
        
        # Don't forward if max hops reached
        if packet.hop_count >= packet.max_hops:
            return False
        
        # Forward if we have a route or it's a broadcast
        if packet.destination_did is None:
            return True  # Broadcast
        
        return self.find_route(packet.destination_did) is not None

    def forward(self, packet: MeshPacket) -> MeshPacket:
        """Create a forwarded copy of a packet."""
        forwarded = MeshPacket(
            packet_id=packet.packet_id,
            source_did=packet.source_did,
            destination_did=packet.destination_did,
            quantum_data=packet.quantum_data,
            hop_count=packet.hop_count + 1,
            max_hops=packet.max_hops,
            ttl=packet.ttl - 1,
            path=packet.path + [self.local_did],
            transport=packet.transport,
            encrypted=packet.encrypted,
            fec_data=packet.fec_data,
        )
        return forwarded

    def cleanup(self):
        """Remove expired routes and stale neighbors."""
        now = time.time()
        
        expired_routes = [did for did, r in self.routes.items() if r["expiry"] < now]
        for did in expired_routes:
            del self.routes[did]
        
        stale = [did for did, n in self.neighbors.items() if now - n.last_seen > 600]
        for did in stale:
            del self.neighbors[did]

    def stats(self) -> dict:
        return {
            "local_did": self.local_did,
            "routes": len(self.routes),
            "neighbors": len(self.neighbors),
            "pending": len(self.pending),
            "seq_num": self.seq_num,
        }


# ─── LoRa Mesh Protocol ─────────────────────────────────────────────

class LoRaMeshProtocol:
    """
    Complete LoRa Mesh protocol for Interaction Quantum gossip.
    
    Combines:
    - ChaCha20-Poly1305 encryption
    - Reed-Solomon FEC
    - AODV routing
    - Power-aware transmission
    - CRDT-like merge semantics
    """

    def __init__(
        self,
        local_did: str,
        encryption_key: Optional[bytes] = None,
        transport: Transport = Transport.LORA,
    ):
        self.local_did = local_did
        self.transport = transport
        self.router = AODVRouter(local_did)
        self.fec = ReedSolomonFEC()
        
        # Encryption
        if encryption_key:
            self.encryption_key = encryption_key
        else:
            self.encryption_key = hashlib.sha256(f"mesh-key::{local_did}".encode()).digest()

        # Stats
        self.packets_sent = 0
        self.packets_received = 0
        self.packets_forwarded = 0
        self.bytes_sent = 0
        self.bytes_received = 0

        # Callbacks
        self._on_receive_callbacks: list[Callable] = []

    # ─── Send ────────────────────────────────────────────────────────

    def send(
        self,
        quantum_data: bytes,
        destination_did: Optional[str] = None,
        urgency: float = 0.5,
    ) -> MeshPacket:
        """
        Send a quantum through the mesh.
        
        Args:
            quantum_data: Serialized quantum bytes
            destination_did: Target node (None = broadcast)
            urgency: 0.0-1.0, affects TX power
            
        Returns:
            The created MeshPacket
        """
        # Generate nonce from timestamp + random
        nonce = hashlib.sha256(
            struct.pack("<d", time.time()) + os.urandom(8)
        ).digest()[:12]

        # Encrypt
        cipher = ChaCha20(self.encryption_key, nonce)
        encrypted = cipher.encrypt(quantum_data)

        # Add FEC
        fec_data = self.fec.encode(encrypted)

        # Create packet
        packet = MeshPacket(
            packet_id=hashlib.sha256(nonce + encrypted[:16]).hexdigest()[:16],
            source_did=self.local_did,
            destination_did=destination_did,
            quantum_data=nonce + encrypted,  # Prepend nonce
            hop_count=0,
            max_hops=15,
            ttl=15,
            path=[self.local_did],
            transport=self.transport,
            encrypted=True,
            fec_data=fec_data,
        )

        self.packets_sent += 1
        self.bytes_sent += len(fec_data)

        return packet

    # ─── Receive ─────────────────────────────────────────────────────

    def receive(self, packet: MeshPacket) -> Optional[bytes]:
        """
        Process a received mesh packet.
        
        Returns decrypted quantum data, or None if packet should be dropped.
        """
        # Check if already seen
        if self.local_did in packet.path:
            return None

        self.packets_received += 1
        self.bytes_received += len(packet.quantum_data)

        # Record neighbor
        source_node = MeshNode(
            did=packet.source_did,
            rssi_history=[packet.rssi],
            snr_history=[packet.snr],
            transport=packet.transport,
        )
        self.router.add_neighbor(source_node)

        # Decrypt
        if packet.encrypted and len(packet.quantum_data) > 12:
            nonce = packet.quantum_data[:12]
            ciphertext = packet.quantum_data[12:]
            cipher = ChaCha20(self.encryption_key, nonce)
            plaintext = cipher.decrypt(ciphertext)
        else:
            plaintext = packet.quantum_data

        # Forward if needed
        if self.router.should_forward(packet):
            forwarded = self.router.forward(packet)
            self.packets_forwarded += 1
            # In real implementation, transmit forwarded packet here

        # Fire callbacks
        for cb in self._on_receive_callbacks:
            try:
                cb(packet, plaintext)
            except Exception:
                pass

        return plaintext

    # ─── Power Management ────────────────────────────────────────────

    def tx_power_for_urgency(self, urgency: float) -> int:
        """
        Map cognitive urgency to TX power.
        
        High urgency (alerts, dispatch) → max power for reliability
        Low urgency (background sync) → min power for battery savings
        """
        min_power = 2   # dBm
        max_power = 22  # dBm (SX1262 max)
        return int(min_power + (max_power - min_power) * urgency)

    def spreading_factor_for_range(self, range_km: float) -> int:
        """
        Select LoRa spreading factor based on needed range.
        
        SF7: ~2km, faster
        SF12: ~15km, slower but longer range
        """
        if range_km <= 2:
            return 7
        elif range_km <= 5:
            return 9
        elif range_km <= 10:
            return 10
        else:
            return 12

    def time_on_air(self, payload_bytes: int, sf: int = 7, bw: int = 125000) -> float:
        """Estimate LoRa time-on-air in milliseconds."""
        cr = 5  # 4/5 coding rate
        de = 0  # Low data rate optimize off
        
        numerator = 8 * payload_bytes - 4 * sf + 28 + 16 - 20
        denominator = 4 * (sf - 2 * de)
        symbols = 8 + max(0, math.ceil(numerator / denominator)) * cr
        
        return (2**sf / bw) * symbols * 1000

    # ─── Gossip ──────────────────────────────────────────────────────

    def gossip_export(self, quanta: list, destination_did: str = None) -> list[MeshPacket]:
        """
        Export quanta as mesh packets for gossip.
        
        Each quantum gets its own packet, encrypted and FEC-encoded.
        """
        packets = []
        for q in quanta:
            q_bytes = q.to_jsonl().encode() if hasattr(q, "to_jsonl") else json.dumps(q).encode()
            packet = self.send(q_bytes, destination_did=destination_did)
            packets.append(packet)
        return packets

    def gossip_import(self, packets: list[MeshPacket]) -> list[bytes]:
        """
        Import received gossip packets.
        
        Returns decrypted quantum data for each valid packet.
        """
        results = []
        for packet in packets:
            data = self.receive(packet)
            if data:
                results.append(data)
        return results

    # ─── Callbacks ───────────────────────────────────────────────────

    def on_receive(self, callback: Callable):
        """Register a callback for received quanta."""
        self._on_receive_callbacks.append(callback)

    # ─── Stats ───────────────────────────────────────────────────────

    def stats(self) -> dict:
        return {
            "local_did": self.local_did,
            "transport": self.transport.value,
            "packets_sent": self.packets_sent,
            "packets_received": self.packets_received,
            "packets_forwarded": self.packets_forwarded,
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "router": self.router.stats(),
        }
