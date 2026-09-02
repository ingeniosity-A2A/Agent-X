"""
Griptape TaskMemory — Off-Chain Dark Matter Buffer

Holds high-fidelity RF logs, raw sensor streams, and real-time signal data
that would bloat the active context. TaskMemory is an execution-side buffer;
it stores opaque intent/routing references and physical observations, not
cognitive state or reasoning traces.

Storage tiers:
1. Hot: In-memory ring buffer
2. Warm: JSONL files
3. Cold: Compressed archives
"""

import gzip
import hashlib
import json
import os
import shutil
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional, Callable
from enum import Enum


class StorageTier(str, Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


@dataclass
class MemoryEntry:
    """A single execution-side memory entry."""
    quantum_id: str
    timestamp: str
    source_did: str
    intent: str
    confidence: float
    payload_hash: str
    signal_snapshot: dict = field(default_factory=dict)
    rf_logs: list[dict] = field(default_factory=list)
    sensor_data: dict = field(default_factory=dict)
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
        """Create a MemoryEntry without reading cognitive state."""
        q = quantum.to_dict() if hasattr(quantum, "to_dict") else quantum
        payload = q.get("payload", {}) or {}
        metadata = q.get("metadata", {}) or {}
        sig = q.get("signal_metadata", {}) or {}

        # Intent is an opaque routing/capability reference at this boundary.
        intent = (
            q.get("intent_id")
            or payload.get("intent_id")
            or payload.get("capability")
            or metadata.get("intent_id")
            or "unknown"
        )
        confidence = payload.get("confidence", metadata.get("confidence", 0))

        return cls(
            quantum_id=q.get("quantum_id", ""),
            timestamp=q.get("timestamp", ""),
            source_did=q.get("source_did", ""),
            intent=intent,
            confidence=confidence,
            payload_hash=hashlib.sha256(
                json.dumps(payload, sort_keys=True).encode()
            ).hexdigest(),
            signal_snapshot=sig.get("rf_physical", {}),
            rf_logs=[sig.get("temporal_index", {})] if sig.get("temporal_index") else [],
            sensor_data=sig.get("tslat", {}),
            metadata=metadata,
        )


class GriptapeTaskMemory:
    """Three-tier execution-side buffer for Interaction Quanta."""

    def __init__(self, storage_dir: str, hot_size: int = 1000,
                 warm_days: int = 30, cold_weeks: int = 12):
        self.storage_dir = storage_dir
        self.hot_size = hot_size
        self.warm_days = warm_days
        self.cold_weeks = cold_weeks
        self._hot: deque[MemoryEntry] = deque(maxlen=hot_size)
        self._index: dict[str, dict] = {}
        self._on_store_callbacks: list[Callable] = []
        self._warm_dir = os.path.join(storage_dir, "warm")
        self._cold_dir = os.path.join(storage_dir, "cold")
        os.makedirs(self._warm_dir, exist_ok=True)
        os.makedirs(self._cold_dir, exist_ok=True)
        self._load_index()

    def store(self, quantum) -> str:
        entry = MemoryEntry.from_quantum(quantum)
        qid = entry.quantum_id
        self._hot.append(entry)
        self._index[qid] = {"tier": StorageTier.HOT.value, "timestamp": entry.timestamp, "intent": entry.intent}
        self._write_warm(entry)
        for cb in self._on_store_callbacks:
            try:
                cb(entry)
            except Exception:
                pass
        return qid

    def store_batch(self, quanta: list) -> int:
        count = 0
        for q in quanta:
            self.store(q)
            count += 1
        return count

    def get(self, quantum_id: str) -> Optional[dict]:
        for entry in self._hot:
            if entry.quantum_id == quantum_id:
                return entry.to_dict()
        location = self._index.get(quantum_id)
        if location and location["tier"] == StorageTier.WARM.value:
            return self._read_warm_entry(quantum_id, location.get("file"))
        if location and location["tier"] == StorageTier.COLD.value:
            return self._read_cold_entry(quantum_id, location.get("file"))
        return None

    def search(self, query: str = None, intent: str = None, source_did: str = None,
               min_confidence: float = 0.0, start_time: str = None,
               end_time: str = None, min_rssi: float = None, limit: int = 50) -> list[dict]:
        results = []
        for entry in reversed(self._hot):
            if self._matches(entry, query, intent, source_did, min_confidence, min_rssi):
                results.append(entry.to_dict())
                if len(results) >= limit:
                    return results
        if len(results) < limit:
            results.extend(self._search_warm(query=query, intent=intent, source_did=source_did,
                min_confidence=min_confidence, start_time=start_time, end_time=end_time,
                min_rssi=min_rssi, limit=limit - len(results)))
        return results

    def _matches(self, entry, query=None, intent=None, source_did=None,
                 min_confidence=0.0, min_rssi=None) -> bool:
        if intent and entry.intent != intent:
            return False
        if source_did and entry.source_did != source_did:
            return False
        if entry.confidence < min_confidence:
            return False
        if min_rssi is not None and entry.signal_snapshot.get("rssi_dbm", -120) < min_rssi:
            return False
        if query:
            lower_q = query.lower()
            if (lower_q not in entry.intent.lower() and
                lower_q not in entry.source_did.lower() and
                lower_q not in json.dumps(entry.metadata).lower()):
                return False
        return True

    def get_signal_history(self, source_did: str = None, duration_minutes: int = 60) -> list[dict]:
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=duration_minutes)).isoformat()
        results = []
        for entry in self._hot:
            if entry.timestamp < cutoff or (source_did and entry.source_did != source_did):
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
        rssi_values, snr_values, intents, sources = [], [], {}, set()
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
            "entries": len(self._hot), "avg_rssi": round(sum(rssi_values) / len(rssi_values), 1) if rssi_values else 0,
            "min_rssi": min(rssi_values) if rssi_values else 0, "max_rssi": max(rssi_values) if rssi_values else 0,
            "avg_snr": round(sum(snr_values) / len(snr_values), 1) if snr_values else 0,
            "intents": intents, "unique_sources": len(sources)
        }

    def on_store(self, callback: Callable):
        self._on_store_callbacks.append(callback)

    def rotate(self):
        self._rotate_warm_to_cold()

    def compact(self):
        all_entries = {}
        for filename in sorted(os.listdir(self._warm_dir)):
            if not filename.endswith(".jsonl"):
                continue
            with open(os.path.join(self._warm_dir, filename)) as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if entry.get("quantum_id"):
                            all_entries[entry["quantum_id"]] = entry
                    except (json.JSONDecodeError, AttributeError):
                        continue
        by_date = {}
        for entry in all_entries.values():
            by_date.setdefault(entry.get("timestamp", "")[:10], []).append(entry)
        for date, entries in by_date.items():
            with open(os.path.join(self._warm_dir, f"{date}.jsonl"), "w") as f:
                for entry in entries:
                    f.write(json.dumps(entry) + "\n")

    def _write_warm(self, entry: MemoryEntry):
        date = entry.timestamp[:10]
        filepath = os.path.join(self._warm_dir, f"{date}.jsonl")
        with open(filepath, "a") as f:
            f.write(json.dumps(entry.to_dict()) + "\n")
        self._index[entry.quantum_id] = {"tier": StorageTier.WARM.value, "file": f"{date}.jsonl", "timestamp": entry.timestamp, "intent": entry.intent}

    def _read_warm_entry(self, quantum_id: str, filename: str = None) -> Optional[dict]:
        files = [filename] if filename else [f for f in os.listdir(self._warm_dir) if f.endswith(".jsonl")]
        for fname in files:
            filepath = os.path.join(self._warm_dir, fname)
            if not os.path.exists(filepath):
                continue
            with open(filepath) as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if entry.get("quantum_id") == quantum_id:
                            return entry
                    except json.JSONDecodeError:
                        continue
        return None

    def _search_warm(self, limit=50, **criteria) -> list[dict]:
        results = []
        for filename in sorted(os.listdir(self._warm_dir), reverse=True):
            if not filename.endswith(".jsonl"):
                continue
            with open(os.path.join(self._warm_dir, filename)) as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        if self._entry_matches_criteria(entry, criteria):
                            results.append(entry)
                            if len(results) >= limit:
                                return results
                    except json.JSONDecodeError:
                        continue
        return results

    def _entry_matches_criteria(self, entry: dict, criteria: dict) -> bool:
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
        if criteria.get("min_rssi") is not None and entry.get("signal_snapshot", {}).get("rssi_dbm", -120) < criteria["min_rssi"]:
            return False
        return True

    def _rotate_warm_to_cold(self):
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=self.warm_days)).strftime("%Y-%m-%d")
        for filename in sorted(os.listdir(self._warm_dir)):
            if not filename.endswith(".jsonl") or filename.replace(".jsonl", "") >= cutoff_date:
                continue
            warm_path = os.path.join(self._warm_dir, filename)
            cold_path = os.path.join(self._cold_dir, filename + ".gz")
            with open(warm_path, "rb") as f_in, gzip.open(cold_path, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)
            with open(warm_path) as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        qid = entry.get("quantum_id")
                        if qid:
                            self._index[qid] = {"tier": StorageTier.COLD.value, "file": filename + ".gz", "timestamp": entry.get("timestamp")}
                    except json.JSONDecodeError:
                        continue
            os.remove(warm_path)

    def _read_cold_entry(self, quantum_id: str, filename: str) -> Optional[dict]:
        filepath = os.path.join(self._cold_dir, filename)
        if not os.path.exists(filepath):
            return None
        with gzip.open(filepath, "rt") as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get("quantum_id") == quantum_id:
                        return entry
                except json.JSONDecodeError:
                    continue
        return None

    def _load_index(self):
        index_path = os.path.join(self.storage_dir, "index.jsonl")
        if os.path.exists(index_path):
            with open(index_path) as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        qid = entry.pop("quantum_id")
                        self._index[qid] = entry
                    except (json.JSONDecodeError, KeyError):
                        continue

    def _save_index(self):
        index_path = os.path.join(self.storage_dir, "index.jsonl")
        with open(index_path, "w") as f:
            for qid, entry in self._index.items():
                row = dict(entry)
                row["quantum_id"] = qid
                f.write(json.dumps(row) + "\n")

    def stats(self) -> dict:
        warm_files = [f for f in os.listdir(self._warm_dir) if f.endswith(".jsonl")]
        cold_files = [f for f in os.listdir(self._cold_dir) if f.endswith(".gz")]
        warm_count = sum(sum(1 for line in open(os.path.join(self._warm_dir, f)) if line.strip()) for f in warm_files)
        return {"hot_entries": len(self._hot), "hot_max": self.hot_size, "warm_entries": warm_count,
                "warm_files": len(warm_files), "cold_files": len(cold_files), "total_indexed": len(self._index),
                "storage_dir": self.storage_dir}

    def __repr__(self) -> str:
        return f"GriptapeTaskMemory(hot={len(self._hot)}, indexed={len(self._index)}, dir={self.storage_dir})"
