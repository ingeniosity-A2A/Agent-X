"""
Griptape TaskMemory — Off-Chain Dark Matter Buffer

Holds the "dark matter" — high-fidelity RF logs, raw sensor streams,
and real-time signal data that would bloat the LLM's active context.

Architecture:
- TaskMemory buffers signal metadata temporally
- Agents query it via semantic search
- Nodes share only Interaction Quanta (Atomic JSON)
- Local hardware reconstructs signal state deterministically

Storage tiers:
1. Hot: In-memory ring buffer (last N quanta, real-time access)
2. Warm: JSONL files (daily rotation, indexed)
3. Cold: Compressed archives (weekly/monthly, for audit)
"""

import gzip
import hashlib
import json
import os
import shutil
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional, Iterator, Callable
from enum import Enum


class StorageTier(str, Enum):
    HOT = "hot"       # In-memory ring buffer
    WARM = "warm"     # JSONL files
    COLD = "cold"     # Compressed archives


@dataclass
class MemoryEntry:
    """A single entry in the TaskMemory buffer."""
    quantum_id: str
    timestamp: str
    source_did: str
    intent: str
    confidence: float
    payload_hash: str                         # Hash of original payload
    signal_snapshot: dict = field(default_factory=dict)  # RF/signal state at capture
    rf_logs: list[dict] = field(default_factory=list)    # Raw RF measurements
    sensor_data: dict = field(default_factory=dict)      # Accelerometer, GPS, etc.
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = {
            "quantum_id": self.quantum_id,
            "timestamp": self.timestamp,
            "source_did": self.source_did,
            "intent": self.intent,
            "confidence": self.confidence,
            "payload_hash": self.payload_hash,
        }
        if self.signal_snapshot:
            d["signal_snapshot"] = self.signal_snapshot
        if self.rf_logs:
            d["rf_logs"] = self.rf_logs
        if self.sensor_data:
            d["sensor_data"] = self.sensor_data
        if self.metadata:
            d["metadata"] = self.metadata
        return d

    @classmethod
    def from_quantum(cls, quantum) -> "MemoryEntry":
        """Create a MemoryEntry from an Interaction Quantum."""
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        cog = q.get("cognitive_state", {})
        sig = q.get("signal_metadata", {})
        
        return cls(
            quantum_id=q.get("quantum_id", ""),
            timestamp=q.get("timestamp", ""),
            source_did=q.get("source_did", ""),
            intent=cog.get("intent", "unknown"),
            confidence=cog.get("confidence", 0),
            payload_hash=hashlib.sha256(
                json.dumps(q.get("payload", {}), sort_keys=True).encode()
            ).hexdigest(),
            signal_snapshot=sig.get("rf_physical", {}),
            rf_logs=[sig.get("temporal_index", {})],
            sensor_data=sig.get("tslat", {}),
        )


class GriptapeTaskMemory:
    """
    Griptape TaskMemory — dark matter buffer for Interaction Quanta.
    
    Three-tier storage:
    - Hot: deque ring buffer for real-time access (last 1000 entries)
    - Warm: JSONL files with daily rotation and index
    - Cold: gzip-compressed weekly archives
    
    Agents query via:
    - Semantic search (intent + confidence filtering)
    - Temporal range queries
    - Source DID filtering
    - Signal strength correlation
    """

    def __init__(
        self,
        storage_dir: str,
        hot_size: int = 1000,
        warm_days: int = 30,
        cold_weeks: int = 12,
    ):
        self.storage_dir = storage_dir
        self.hot_size = hot_size
        self.warm_days = warm_days
        self.cold_weeks = cold_weeks

        # Hot tier: in-memory ring buffer
        self._hot: deque[MemoryEntry] = deque(maxlen=hot_size)
        
        # Index: quantum_id → storage location
        self._index: dict[str, dict] = {}
        
        # Callbacks for real-time processing
        self._on_store_callbacks: list[Callable] = []

        # Ensure directories exist
        self._warm_dir = os.path.join(storage_dir, "warm")
        self._cold_dir = os.path.join(storage_dir, "cold")
        os.makedirs(self._warm_dir, exist_ok=True)
        os.makedirs(self._cold_dir, exist_ok=True)

        # Load existing index
        self._load_index()

    # ─── Store ───────────────────────────────────────────────────────

    def store(self, quantum) -> str:
        """
        Store an Interaction Quantum in the TaskMemory buffer.
        
        Always goes to hot tier first. Warm/cold rotation is automatic.
        Returns the quantum_id.
        """
        entry = MemoryEntry.from_quantum(quantum)
        qid = entry.quantum_id

        # Hot tier (in-memory)
        self._hot.append(entry)
        self._index[qid] = {
            "tier": StorageTier.HOT.value,
            "timestamp": entry.timestamp,
            "intent": entry.intent,
        }

        # Warm tier (append to daily JSONL)
        self._write_warm(entry)

        # Fire callbacks
        for cb in self._on_store_callbacks:
            try:
                cb(entry)
            except Exception:
                pass

        return qid

    def store_batch(self, quanta: list) -> int:
        """Store multiple quanta efficiently."""
        count = 0
        for q in quanta:
            self.store(q)
            count += 1
        return count

    # ─── Retrieve ────────────────────────────────────────────────────

    def get(self, quantum_id: str) -> Optional[dict]:
        """
        Retrieve a memory entry by quantum_id.
        
        Checks hot tier first, then warm, then cold.
        """
        # Hot tier
        for entry in self._hot:
            if entry.quantum_id == quantum_id:
                return entry.to_dict()

        # Warm tier
        location = self._index.get(quantum_id)
        if location and location["tier"] == StorageTier.WARM.value:
            return self._read_warm_entry(quantum_id, location.get("file"))

        # Cold tier
        if location and location["tier"] == StorageTier.COLD.value:
            return self._read_cold_entry(quantum_id, location.get("file"))

        return None

    # ─── Semantic Search ─────────────────────────────────────────────

    def search(
        self,
        query: str = None,
        intent: str = None,
        source_did: str = None,
        min_confidence: float = 0.0,
        start_time: str = None,
        end_time: str = None,
        min_rssi: float = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Semantic search across the TaskMemory buffer.
        
        Supports filtering by:
        - query: text match on intent/payload
        - intent: exact intent match
        - source_did: exact source match
        - min_confidence: confidence threshold
        - start_time/end_time: temporal range
        - min_rssi: signal strength threshold
        """
        results = []

        # Search hot tier first (fastest)
        for entry in reversed(self._hot):
            if self._matches(entry, query, intent, source_did, min_confidence, min_rssi):
                results.append(entry.to_dict())
                if len(results) >= limit:
                    return results

        # Search warm tier if needed
        if len(results) < limit:
            warm_results = self._search_warm(
                query=query,
                intent=intent,
                source_did=source_did,
                min_confidence=min_confidence,
                start_time=start_time,
                end_time=end_time,
                min_rssi=min_rssi,
                limit=limit - len(results),
            )
            results.extend(warm_results)

        return results

    def _matches(
        self,
        entry: MemoryEntry,
        query: str = None,
        intent: str = None,
        source_did: str = None,
        min_confidence: float = 0.0,
        min_rssi: float = None,
    ) -> bool:
        """Check if an entry matches search criteria."""
        if intent and entry.intent != intent:
            return False
        if source_did and entry.source_did != source_did:
            return False
        if entry.confidence < min_confidence:
            return False
        if min_rssi is not None:
            rssi = entry.signal_snapshot.get("rssi_dbm", -120)
            if rssi < min_rssi:
                return False
        if query:
            lower_q = query.lower()
            if (lower_q not in entry.intent.lower() and
                lower_q not in entry.source_did.lower() and
                lower_q not in json.dumps(entry.metadata).lower()):
                return False
        return True

    # ─── Signal Correlation ──────────────────────────────────────────

    def get_signal_history(
        self,
        source_did: str = None,
        duration_minutes: int = 60,
    ) -> list[dict]:
        """
        Get signal strength history for correlation analysis.
        
        Returns entries with RSSI, SNR, and AoA data, useful for:
        - Tracking device movement
        - Identifying signal dead zones
        - Optimizing mesh relay placement
        """
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=duration_minutes)).isoformat()
        
        results = []
        for entry in self._hot:
            if entry.timestamp < cutoff:
                continue
            if source_did and entry.source_did != source_did:
                continue
            
            sig = entry.signal_snapshot
            ti = entry.rf_logs[0] if entry.rf_logs else {}
            
            results.append({
                "timestamp": entry.timestamp,
                "source_did": entry.source_did,
                "rssi_dbm": ti.get("rssi_dbm", sig.get("rssi_dbm", -120)),
                "snr_db": ti.get("snr_db", 0),
                "angle_of_arrival": ti.get("angle_of_arrival_deg", 0),
                "intent": entry.intent,
            })

        return results

    def get_rf_stats(self) -> dict:
        """Get aggregate RF statistics from the buffer."""
        rssi_values = []
        snr_values = []
        intents = {}
        sources = set()

        for entry in self._hot:
            rssi = entry.signal_snapshot.get("rssi_dbm")
            if rssi is not None:
                rssi_values.append(rssi)
            ti = entry.rf_logs[0] if entry.rf_logs else {}
            snr = ti.get("snr_db")
            if snr is not None:
                snr_values.append(snr)
            intents[entry.intent] = intents.get(entry.intent, 0) + 1
            sources.add(entry.source_did)

        return {
            "entries": len(self._hot),
            "avg_rssi": round(sum(rssi_values) / len(rssi_values), 1) if rssi_values else 0,
            "min_rssi": min(rssi_values) if rssi_values else 0,
            "max_rssi": max(rssi_values) if rssi_values else 0,
            "avg_snr": round(sum(snr_values) / len(snr_values), 1) if snr_values else 0,
            "intents": intents,
            "unique_sources": len(sources),
        }

    # ─── Lifecycle ───────────────────────────────────────────────────

    def on_store(self, callback: Callable):
        """Register a callback for real-time entry processing."""
        self._on_store_callbacks.append(callback)

    def rotate(self):
        """
        Manually trigger storage rotation:
        - Hot → Warm (entries older than hot_size)
        - Warm → Cold (entries older than warm_days)
        """
        self._rotate_warm_to_cold()

    def compact(self):
        """Compact warm storage by deduplicating and reindexing."""
        # Read all warm entries
        all_entries = {}
        for filename in sorted(os.listdir(self._warm_dir)):
            if not filename.endswith(".jsonl"):
                continue
            filepath = os.path.join(self._warm_dir, filename)
            with open(filepath) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            qid = entry.get("quantum_id")
                            if qid:
                                all_entries[qid] = entry
                        except json.JSONDecodeError:
                            continue

        # Rewrite deduplicated
        by_date: dict[str, list] = {}
        for entry in all_entries.values():
            date = entry.get("timestamp", "")[:10]
            by_date.setdefault(date, []).append(entry)

        for date, entries in by_date.items():
            filepath = os.path.join(self._warm_dir, f"{date}.jsonl")
            with open(filepath, "w") as f:
                for entry in entries:
                    f.write(json.dumps(entry) + "\n")

    # ─── Warm Tier I/O ───────────────────────────────────────────────

    def _write_warm(self, entry: MemoryEntry):
        """Write an entry to the warm tier (daily JSONL)."""
        date = entry.timestamp[:10]  # YYYY-MM-DD
        filepath = os.path.join(self._warm_dir, f"{date}.jsonl")
        
        with open(filepath, "a") as f:
            f.write(json.dumps(entry.to_dict()) + "\n")

        self._index[entry.quantum_id] = {
            "tier": StorageTier.WARM.value,
            "file": f"{date}.jsonl",
            "timestamp": entry.timestamp,
            "intent": entry.intent,
        }

    def _read_warm_entry(self, quantum_id: str, filename: str = None) -> Optional[dict]:
        """Read a specific entry from warm storage."""
        if filename:
            files = [filename]
        else:
            files = [f for f in os.listdir(self._warm_dir) if f.endswith(".jsonl")]

        for fname in files:
            filepath = os.path.join(self._warm_dir, fname)
            if not os.path.exists(filepath):
                continue
            with open(filepath) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            if entry.get("quantum_id") == quantum_id:
                                return entry
                        except json.JSONDecodeError:
                            continue
        return None

    def _search_warm(self, limit: int = 50, **criteria) -> list[dict]:
        """Search warm storage with filters."""
        results = []
        for filename in sorted(os.listdir(self._warm_dir), reverse=True):
            if not filename.endswith(".jsonl"):
                continue
            filepath = os.path.join(self._warm_dir, filename)
            with open(filepath) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        if self._entry_matches_criteria(entry, criteria):
                            results.append(entry)
                            if len(results) >= limit:
                                return results
                    except json.JSONDecodeError:
                        continue
        return results

    def _entry_matches_criteria(self, entry: dict, criteria: dict) -> bool:
        """Check if an entry dict matches search criteria."""
        if criteria.get("intent") and entry.get("intent") != criteria["intent"]:
            return False
        if criteria.get("source_did") and entry.get("source_did") != criteria["source_did"]:
            return False
        if criteria.get("min_confidence") and entry.get("confidence", 0) < criteria["min_confidence"]:
            return False
        if criteria.get("start_time") and entry.get("timestamp", "") < criteria["start_time"]:
            return False
        if criteria.get("end_time") and entry.get("timestamp", "") > criteria["end_time"]:
            return False
        return True

    # ─── Cold Tier ───────────────────────────────────────────────────

    def _rotate_warm_to_cold(self):
        """Rotate warm entries older than warm_days to cold (compressed)."""
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=self.warm_days)).strftime("%Y-%m-%d")

        for filename in sorted(os.listdir(self._warm_dir)):
            if not filename.endswith(".jsonl"):
                continue
            date = filename.replace(".jsonl", "")
            if date >= cutoff_date:
                continue

            # Compress to cold tier
            warm_path = os.path.join(self._warm_dir, filename)
            cold_path = os.path.join(self._cold_dir, f"{date}.jsonl.gz")

            with open(warm_path, "rb") as f_in:
                with gzip.open(cold_path, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)

            # Update index
            with open(warm_path) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            qid = entry.get("quantum_id")
                            if qid:
                                self._index[qid] = {
                                    "tier": StorageTier.COLD.value,
                                    "file": f"{date}.jsonl.gz",
                                    "timestamp": entry.get("timestamp"),
                                }
                        except json.JSONDecodeError:
                            continue

            # Remove warm file
            os.remove(warm_path)

    def _read_cold_entry(self, quantum_id: str, filename: str) -> Optional[dict]:
        """Read an entry from cold (compressed) storage."""
        filepath = os.path.join(self._cold_dir, filename)
        if not os.path.exists(filepath):
            return None

        with gzip.open(filepath, "rt") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entry = json.loads(line)
                        if entry.get("quantum_id") == quantum_id:
                            return entry
                    except json.JSONDecodeError:
                        continue
        return None

    # ─── Index ───────────────────────────────────────────────────────

    def _load_index(self):
        """Load the memory index from disk."""
        index_path = os.path.join(self.storage_dir, "index.jsonl")
        if os.path.exists(index_path):
            with open(index_path) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            qid = entry.pop("quantum_id")
                            self._index[qid] = entry
                        except (json.JSONDecodeError, KeyError):
                            continue

    def _save_index(self):
        """Persist the memory index to disk."""
        index_path = os.path.join(self.storage_dir, "index.jsonl")
        with open(index_path, "w") as f:
            for qid, entry in self._index.items():
                entry["quantum_id"] = qid
                f.write(json.dumps(entry) + "\n")

    # ─── Stats ───────────────────────────────────────────────────────

    def stats(self) -> dict:
        """Get comprehensive TaskMemory statistics."""
        warm_files = [f for f in os.listdir(self._warm_dir) if f.endswith(".jsonl")]
        cold_files = [f for f in os.listdir(self._cold_dir) if f.endswith(".gz")]

        warm_count = 0
        for f in warm_files:
            with open(os.path.join(self._warm_dir, f)) as fh:
                warm_count += sum(1 for line in fh if line.strip())

        return {
            "hot_entries": len(self._hot),
            "hot_max": self.hot_size,
            "warm_entries": warm_count,
            "warm_files": len(warm_files),
            "cold_files": len(cold_files),
            "total_indexed": len(self._index),
            "storage_dir": self.storage_dir,
        }

    def __repr__(self) -> str:
        return f"GriptapeTaskMemory(hot={len(self._hot)}, indexed={len(self._index)}, dir={self.storage_dir})"
