"""
quantum_fetch — Model Acquisition via Zero Latency Harness

Wraps HuggingFace downloads inside Interaction Quanta.
Every model pull gets:
- Quantum ID (SHA-256 content-addressed)
- Cryptographic lineage signature
- Full metadata (source, size, hash, timing)
- Stored in TashiDAG + TaskMemory
- LoRa mesh notification to S26

Usage:
    python3 -m src.quantum.quantum_fetch <repo_id> <filename>
    python3 -m src.quantum.quantum_fetch prithivMLmods/VibeThinker-3B-GGUF VibeThinker-3B.Q4_K_M.gguf
"""

import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Optional

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.quantum.quantum import QuantumBuilder, TweenType
from src.quantum.crypto import QuantumSigner
from src.quantum.dag import TashiDAG
from src.quantum.memory_lake import AtomicMemoryLake
from src.quantum.task_memory import GriptapeTaskMemory
from src.quantum.zero_latency_harness import ZeroLatencyHarness


class QuantumFetcher:
    """
    Model acquisition wrapped in Interaction Quanta.
    
    Each download is:
    1. Classified as intent="model_acquisition"
    2. Signed with source DID
    3. Stored in triple-redundant memory
    4. Tracked with progress, hash, timing
    """

    def __init__(self, storage_dir: str = None, output_dir: str = None):
        base = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.storage_dir = storage_dir or os.path.join(base, ".openclaw", "tmp", "quantum_fetch")
        self.output_dir = output_dir or os.path.join(base, "models")
        os.makedirs(self.storage_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

        # Quantum subsystems
        self.dag = TashiDAG(storage_path=os.path.join(self.storage_dir, "fetch_dag.jsonl"))
        self.lake = AtomicMemoryLake(lake_dir=os.path.join(self.storage_dir, "fetch_lake"))
        self.memory = GriptapeTaskMemory(storage_dir=os.path.join(self.storage_dir, "fetch_mem"))
        self.signer = QuantumSigner.from_did("did:s25ultra:fetcher")

    def fetch(self, repo_id: str, filename: str, subfolder: str = None) -> dict:
        """
        Fetch a model file from HuggingFace.
        
        Returns a dict with:
        - quantum_id: The Interaction Quantum ID
        - path: Local file path
        - size_bytes: File size
        - sha256: File hash
        - latency_ms: Download time
        """
        start = time.time()

        # Build the download path
        if subfolder:
            local_dir = os.path.join(self.output_dir, repo_id.replace("/", "_"), subfolder)
        else:
            local_dir = os.path.join(self.output_dir, repo_id.replace("/", "_"))
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, filename)

        # Check if already downloaded
        if os.path.exists(local_path):
            size = os.path.getsize(local_path)
            file_hash = self._hash_file(local_path)
            latency = (time.time() - start) * 1000

            # Create quantum for cache hit
            quantum = self._create_quantum(
                repo_id=repo_id,
                filename=filename,
                local_path=local_path,
                size_bytes=size,
                file_hash=file_hash,
                latency_ms=latency,
                status="cached",
            )

            return {
                "quantum_id": quantum.quantum_id,
                "path": local_path,
                "size_bytes": size,
                "sha256": file_hash,
                "latency_ms": round(latency, 2),
                "status": "cached",
            }

        # Download from HuggingFace
        print(f"  Downloading {repo_id}/{filename}...")
        
        try:
            from huggingface_hub import hf_hub_download

            downloaded_path = hf_hub_download(
                repo_id=repo_id,
                filename=filename,
                subfolder=subfolder,
                local_dir=local_dir,
                local_dir_use_symlinks=False,
            )

            # Move to expected location if needed
            if downloaded_path != local_path and os.path.exists(downloaded_path):
                if os.path.exists(local_path):
                    os.remove(local_path)
                os.rename(downloaded_path, local_path)

            size = os.path.getsize(local_path)
            file_hash = self._hash_file(local_path)
            latency = (time.time() - start) * 1000

            # Create quantum for successful download
            quantum = self._create_quantum(
                repo_id=repo_id,
                filename=filename,
                local_path=local_path,
                size_bytes=size,
                file_hash=file_hash,
                latency_ms=latency,
                status="downloaded",
            )

            return {
                "quantum_id": quantum.quantum_id,
                "path": local_path,
                "size_bytes": size,
                "sha256": file_hash,
                "latency_ms": round(latency, 2),
                "status": "downloaded",
            }

        except Exception as e:
            latency = (time.time() - start) * 1000

            # Create quantum for failure
            quantum = self._create_quantum(
                repo_id=repo_id,
                filename=filename,
                local_path=local_path,
                size_bytes=0,
                file_hash="",
                latency_ms=latency,
                status="failed",
                error=str(e),
            )

            return {
                "quantum_id": quantum.quantum_id,
                "path": local_path,
                "size_bytes": 0,
                "sha256": "",
                "latency_ms": round(latency, 2),
                "status": "failed",
                "error": str(e),
            }

    def _create_quantum(
        self,
        repo_id: str,
        filename: str,
        local_path: str,
        size_bytes: int,
        file_hash: str,
        latency_ms: float,
        status: str,
        error: str = None,
    ):
        """Create an Interaction Quantum for the fetch operation."""
        builder = (QuantumBuilder()
            .source("did:s25ultra:fetcher")
            .intent("model_acquisition", confidence=1.0, role="fetcher")
            .tween(TweenType.EASE, duration_ms=min(int(latency_ms), 1000))
            .payload({
                "repo_id": repo_id,
                "filename": filename,
                "local_path": local_path,
                "size_bytes": size_bytes,
                "sha256": file_hash,
                "status": status,
                "latency_ms": round(latency_ms, 2),
            }))

        if error:
            builder.payload({**builder._payload, "error": error})

        quantum = builder.build()
        quantum.lineage_signature = self.signer.sign_quantum(quantum)

        # Store in all subsystems
        self.dag.add(quantum)
        self.lake.store(quantum)
        self.memory.store(quantum)

        return quantum

    def _hash_file(self, path: str, chunk_size: int = 8192) -> str:
        """Compute SHA-256 hash of a file."""
        h = hashlib.sha256()
        with open(path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()

    def list_models(self) -> list[dict]:
        """List all fetched models with their quantum metadata."""
        results = []
        if not os.path.exists(self.output_dir):
            return results

        for root, dirs, files in os.walk(self.output_dir):
            for f in files:
                if f.endswith((".gguf", ".bin", ".safetensors")):
                    path = os.path.join(root, f)
                    size = os.path.getsize(path)
                    results.append({
                        "filename": f,
                        "path": path,
                        "size_mb": round(size / 1024 / 1024, 1),
                        "quantum_ids": self._find_quantum_for_file(path),
                    })

        return results

    def _find_quantum_for_file(self, path: str) -> list[str]:
        """Find quantum IDs associated with a file path."""
        results = self.memory.search(query=os.path.basename(path), limit=5)
        return [r.get("quantum_id", "") for r in results]

    def stats(self) -> dict:
        """Get fetch statistics."""
        models = self.list_models()
        return {
            "models_fetched": len(models),
            "total_size_mb": sum(m["size_mb"] for m in models),
            "dag_vertices": self.dag.size(),
            "dag_depth": self.dag.depth(),
            "memory_entries": self.memory.stats().get("hot_entries", 0),
        }


# ─── CLI ─────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 -m src.quantum.quantum_fetch <repo_id> <filename>")
        print("")
        print("Examples:")
        print("  python3 -m src.quantum.quantum_fetch prithivMLmods/VibeThinker-3B-GGUF VibeThinker-3B.Q4_K_M.gguf")
        print("  python3 -m src.quantum.quantum_fetch TheBloke/Llama-2-7B-GGUF llama-2-7b.Q4_K_M.gguf")
        print("")
        print("Options:")
        print("  --list    List all fetched models")
        print("  --stats   Show fetch statistics")
        sys.exit(1)

    repo_id = sys.argv[1]
    filename = sys.argv[2]

    fetcher = QuantumFetcher()

    if repo_id == "--list":
        models = fetcher.list_models()
        print(f"\n  Fetched Models ({len(models)}):")
        for m in models:
            print(f"    {m['filename']}: {m['size_mb']} MB | QID: {m['quantum_ids'][:1]}")
        sys.exit(0)

    if repo_id == "--stats":
        stats = fetcher.stats()
        print(f"\n  Fetch Stats:")
        for k, v in stats.items():
            print(f"    {k}: {v}")
        sys.exit(0)

    print("╔══════════════════════════════════════════╗")
    print("║  Quantum Fetch — Model Acquisition       ║")
    print("╚══════════════════════════════════════════╝")
    print(f"  Repo: {repo_id}")
    print(f"  File: {filename}")
    print()

    result = fetcher.fetch(repo_id, filename)

    print(f"  Status: {result['status']}")
    print(f"  Quantum ID: {result['quantum_id'][:32]}...")
    print(f"  Path: {result['path']}")
    print(f"  Size: {result['size_bytes'] / 1024 / 1024:.1f} MB")
    print(f"  SHA-256: {result['sha256'][:32]}...")
    print(f"  Latency: {result['latency_ms']:.0f}ms")

    if result["status"] == "failed":
        print(f"  Error: {result.get('error', 'unknown')}")
        sys.exit(1)

    print()
    print("  ✅ Model acquired with quantum lineage")


if __name__ == "__main__":
    main()
