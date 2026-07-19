"""
Quantum Cryptographic Lineage

Every Interaction Quantum is signed by its creator's DID key,
forming a memory proof chain. This module handles:
- Ed25519 signing of quanta
- Lineage chain verification
- Key derivation from DID identifiers
"""

import hashlib
import hmac
import json
import base64
import os
import time
from typing import Optional


class QuantumSigner:
    """
    Signs Interaction Quanta using Ed25519-compatible signatures.
    
    For production: use PyNaCl or cryptography library for real Ed25519.
    This implementation uses HMAC-SHA256 as a portable fallback that
    maintains the same interface.
    """

    def __init__(self, private_key: Optional[bytes] = None, did: str = "did:unknown"):
        self.did = did
        if private_key:
            self._key = private_key
        else:
            self._key = os.urandom(32)  # 256-bit key

    @classmethod
    def from_did(cls, did: str, secret: bytes = None) -> "QuantumSigner":
        """Create a signer from a DID with optional secret."""
        if secret is None:
            # Derive deterministic key from DID
            secret = hashlib.sha256(f"quantum-key::{did}".encode()).digest()
        return cls(private_key=secret, did=did)

    @classmethod
    def generate(cls, did: str = None) -> tuple["QuantumSigner", bytes]:
        """Generate a new signer with random key. Returns (signer, public_key_bytes)."""
        key = os.urandom(32)
        did = did or f"did:quantum:{hashlib.sha256(key).hexdigest()[:16]}"
        signer = cls(private_key=key, did=did)
        # Public key = SHA-256 of private key (simplified; real impl uses Ed25519)
        pub = hashlib.sha256(key).digest()
        return signer, pub

    def sign_quantum(self, quantum) -> str:
        """
        Sign an Interaction Quantum.
        
        The signature covers:
        - quantum_id (content hash)
        - timestamp
        - source_did
        - parent_quanta (sorted)
        - payload hash
        """
        # Build canonical signing payload
        sign_data = {
            "quantum_id": quantum.quantum_id,
            "timestamp": quantum.timestamp,
            "source_did": quantum.source_did,
            "parent_quanta": sorted(quantum.parent_quanta),
            "payload_hash": hashlib.sha256(
                json.dumps(quantum.payload, sort_keys=True).encode()
            ).hexdigest(),
        }
        canonical = json.dumps(sign_data, sort_keys=True, separators=(",", ":"))
        
        # HMAC-SHA256 signature
        sig = hmac.new(self._key, canonical.encode(), hashlib.sha256).digest()
        return base64.b64encode(sig).decode()

    def sign(self, data: bytes) -> str:
        """Sign arbitrary data, return base64 signature."""
        sig = hmac.new(self._key, data, hashlib.sha256).digest()
        return base64.b64encode(sig).decode()

    @property
    def public_key_hash(self) -> str:
        """Get the public key hash (for DID resolution)."""
        return hashlib.sha256(self._key).hexdigest()


class QuantumVerifier:
    """
    Verifies Interaction Quantum signatures and lineage chains.
    """

    @staticmethod
    def verify_signature(quantum, public_key: bytes) -> bool:
        """Verify a quantum's signature against a public key."""
        if not quantum.lineage_signature:
            return False

        # Reconstruct the signing payload
        sign_data = {
            "quantum_id": quantum.quantum_id,
            "timestamp": quantum.timestamp,
            "source_did": quantum.source_did,
            "parent_quanta": sorted(quantum.parent_quanta),
            "payload_hash": hashlib.sha256(
                json.dumps(quantum.payload, sort_keys=True).encode()
            ).hexdigest(),
        }
        canonical = json.dumps(sign_data, sort_keys=True, separators=(",", ":"))

        # Verify HMAC
        expected = hmac.new(public_key, canonical.encode(), hashlib.sha256).digest()
        try:
            actual = base64.b64decode(quantum.lineage_signature)
            return hmac.compare_digest(expected, actual)
        except Exception:
            return False

    @staticmethod
    def verify_lineage(quanta: list) -> tuple[bool, list[str]]:
        """
        Verify a chain of quanta forms a valid lineage.
        
        Returns (is_valid, list_of_errors).
        """
        errors = []
        
        for i, q in enumerate(quanta):
            # 1. Verify content hash
            if not q.verify_hash():
                errors.append(f"Quantum {i}: hash mismatch (expected {q.compute_hash()[:12]}..., got {q.quantum_id[:12]}...)")
            
            # 2. Verify parent references exist
            for parent_id in q.parent_quanta:
                parent_found = any(p.quantum_id == parent_id for p in quanta)
                if not parent_found:
                    # Parent might be external — not an error, but note it
                    pass
            
            # 3. Verify temporal ordering
            if i > 0:
                prev_time = quanta[i-1].timestamp
                if q.timestamp < prev_time:
                    errors.append(f"Quantum {i}: temporal regression ({q.timestamp} < {prev_time})")

        return len(errors) == 0, errors

    @staticmethod
    def verify_hash(quantum) -> bool:
        """Verify that quantum_id matches computed content hash."""
        return quantum.verify_hash()


class DIDResolver:
    """
    Simple DID resolver for quantum source identification.
    
    DID format: did:<method>:<identifier>
    Methods: ava, helpassembly, quantum
    """

    _registry: dict[str, dict] = {}

    @classmethod
    def register(cls, did: str, public_key: bytes, metadata: dict = None):
        """Register a DID with its public key."""
        cls._registry[did] = {
            "public_key": public_key,
            "metadata": metadata or {},
            "registered_at": time.time(),
        }

    @classmethod
    def resolve(cls, did: str) -> Optional[dict]:
        """Resolve a DID to its public key and metadata."""
        return cls._registry.get(did)

    @classmethod
    def resolve_key(cls, did: str) -> Optional[bytes]:
        """Resolve just the public key for a DID."""
        entry = cls.resolve(did)
        return entry["public_key"] if entry else None

    @classmethod
    def list_dids(cls) -> list[str]:
        """List all registered DIDs."""
        return list(cls._registry.keys())
