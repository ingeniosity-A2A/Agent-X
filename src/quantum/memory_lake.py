"""
Atomic Memory Lake — JSONL Substrate

Stores Interaction Quanta as portable, verifiable JSONL. Cognitive state and
model-internal reasoning are not required by the storage substrate. Routing
queries use opaque intent/capability references carried by the quantum.
"""

import json
import os
import time
from typing import Optional, Iterator
from collections import defaultdict


class AtomicMemoryLake:
    """JSONL storage for Interaction Quanta."""

    def __init__(self, lake_dir: str):
        self.lake_dir = lake_dir
        self.index_path = os.path.join(lake_dir, "index.jsonl")
        self.meta_path = os.path.join(lake_dir, "metadata.json")
        self._index: dict[str, dict] = {}
        self._current_date: str = ""
        self._current_file = None
        self._line_count = 0

        os.makedirs(lake_dir, exist_ok=True)
        self._load_index()
        self._load_metadata()

    def store(self, quantum) -> str:
        qid = quantum.quantum_id
        timestamp = quantum.timestamp[:10]
        if timestamp != self._current_date:
            self._rotate_file(timestamp)

        line = quantum.to_jsonl()
        offset = self._current_file.tell()
        self._current_file.write(line + "\n")
        self._current_file.flush()

        self._index[qid] = {
            "file": f"{timestamp}.jsonl",
            "offset": offset,
            "length": len(line),
            "timestamp": quantum.timestamp,
            "source_did": quantum.source_did,
        }
        self._line_count += 1
        if self._line_count % 100 == 0:
            self._flush_index()
        return qid

    def retrieve(self, quantum_id: str) -> Optional[dict]:
        entry = self._index.get(quantum_id)
        if not entry:
            return None
        file_path = os.path.join(self.lake_dir, entry["file"])
        if not os.path.exists(file_path):
            return None
        with open(file_path) as f:
            f.seek(entry["offset"])
            return json.loads(f.read(entry["length"]))

    def stream(self, date: str = None) -> Iterator[dict]:
        files = [f"{date}.jsonl"] if date else sorted(
            f for f in os.listdir(self.lake_dir)
            if f.endswith(".jsonl") and f != "index.jsonl"
        )
        for filename in files:
            file_path = os.path.join(self.lake_dir, filename)
            if not os.path.exists(file_path):
                continue
            with open(file_path) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            yield json.loads(line)
                        except json.JSONDecodeError:
                            continue

    def query_intent(self, intent: str, limit: int = 100) -> list[dict]:
        """Compatibility query over opaque intent_id/capability references."""
        results = []
        for q in self.stream():
            payload = q.get("payload", {}) or {}
            if q.get("intent_id") == intent or payload.get("intent_id") == intent or payload.get("capability") == intent:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    def query_source(self, source_did: str, limit: int = 100) -> list[dict]:
        results = []
        for q in self.stream():
            if q.get("source_did") == source_did:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    def query_timerange(self, start: str, end: str, limit: int = 1000) -> list[dict]:
        results = []
        for q in self.stream():
            ts = q.get("timestamp", "")
            if start <= ts <= end:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    def delete(self, quantum_id: str) -> bool:
        entry = self._index.pop(quantum_id, None)
        if not entry:
            return False
        file_path = os.path.join(self.lake_dir, entry["file"])
        if not os.path.exists(file_path):
            return False
        temp_path = file_path + ".tmp"
        with open(file_path) as src, open(temp_path, "w") as dst:
            for line in src:
                line = line.strip()
                if not line:
                    continue
                try:
                    q = json.loads(line)
                    if q.get("quantum_id") != quantum_id:
                        dst.write(line + "\n")
                except json.JSONDecodeError:
                    dst.write(line + "\n")
        os.replace(temp_path, file_path)
        self._flush_index()
        return True

    def delete_source(self, source_did: str) -> int:
        to_delete = [qid for qid, entry in self._index.items() if entry.get("source_did") == source_did]
        for qid in to_delete:
            self.delete(qid)
        return len(to_delete)

    def stats(self) -> dict:
        dates = set()
        intent_refs = defaultdict(int)
        capabilities = defaultdict(int)
        sources = defaultdict(int)

        for entry in self._index.values():
            dates.add(entry["file"].replace(".jsonl", ""))
            sources[entry.get("source_did", "unknown")] += 1

        for q in self.stream():
            payload = q.get("payload", {}) or {}
            intent_id = q.get("intent_id") or payload.get("intent_id")
            capability = payload.get("capability")
            if intent_id:
                intent_refs[intent_id] += 1
            if capability:
                capabilities[capability] += 1

        return {
            "total_quanta": len(self._index),
            "dates": sorted(dates),
            "intent_refs": dict(intent_refs),
            "capabilities": dict(capabilities),
            "sources": dict(sources),
            "lake_dir": self.lake_dir,
        }

    def _rotate_file(self, date: str):
        if self._current_file:
            self._current_file.close()
        self._current_date = date
        self._current_file = open(os.path.join(self.lake_dir, f"{date}.jsonl"), "a")

    def _load_index(self):
        if not os.path.exists(self.index_path):
            return
        with open(self.index_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entry = json.loads(line)
                        self._index[entry["quantum_id"]] = entry
                    except (json.JSONDecodeError, KeyError):
                        continue

    def _flush_index(self):
        with open(self.index_path, "w") as f:
            for qid, entry in self._index.items():
                entry["quantum_id"] = qid
                f.write(json.dumps(entry) + "\n")

    def _load_metadata(self):
        if os.path.exists(self.meta_path):
            with open(self.meta_path) as f:
                self._metadata = json.load(f)
        else:
            self._metadata = {"created": time.time(), "version": "2.0"}

    def close(self):
        if self._current_file:
            self._current_file.close()
            self._current_file = None
        self._flush_index()

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass

    def __repr__(self) -> str:
        return f"AtomicMemoryLake(quanta={len(self._index)}, dir={self.lake_dir})"
