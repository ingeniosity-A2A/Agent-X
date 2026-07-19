"""
Atomic Memory Lake — JSONL Substrate

All quanta are stored as newline-separated JSON objects.
This is the universal substrate — portable, verifiable,
deletable by the user.

Properties:
- Append-only write log
- Content-addressable reads (by quantum_id)
- Temporal range queries
- Intent/source filtering
- User-controlled deletion (GDPR-compliant)
"""

import json
import os
import shutil
import time
from typing import Optional, Iterator
from collections import defaultdict


class AtomicMemoryLake:
    """
    JSONL-based storage for Interaction Quanta.
    
    Each quantum is one line in a .jsonl file. Files are organized
    by date for efficient archival and garbage collection.
    
    Directory structure:
        lake/
        ├── 2026-06-09.jsonl    # Daily quanta log
        ├── 2026-06-10.jsonl
        ├── index.jsonl         # ID → file:line offset index
        └── metadata.json       # Lake metadata
    """

    def __init__(self, lake_dir: str):
        self.lake_dir = lake_dir
        self.index_path = os.path.join(lake_dir, "index.jsonl")
        self.meta_path = os.path.join(lake_dir, "metadata.json")
        self._index: dict[str, dict] = {}  # quantum_id → {file, offset}
        self._current_date: str = ""
        self._current_file = None
        self._line_count = 0

        os.makedirs(lake_dir, exist_ok=True)
        self._load_index()
        self._load_metadata()

    def store(self, quantum) -> str:
        """
        Store a quantum in the lake.
        
        Returns the quantum_id.
        """
        qid = quantum.quantum_id
        timestamp = quantum.timestamp[:10]  # YYYY-MM-DD

        # Open new file if date changed
        if timestamp != self._current_date:
            self._rotate_file(timestamp)

        # Write the quantum
        line = quantum.to_jsonl()
        offset = self._current_file.tell()
        self._current_file.write(line + "\n")
        self._current_file.flush()

        # Update index
        self._index[qid] = {
            "file": f"{timestamp}.jsonl",
            "offset": offset,
            "length": len(line),
            "timestamp": quantum.timestamp,
            "source_did": quantum.source_did,
        }
        self._line_count += 1

        # Periodic index flush
        if self._line_count % 100 == 0:
            self._flush_index()

        return qid

    def retrieve(self, quantum_id: str) -> Optional[dict]:
        """
        Retrieve a quantum by its ID.
        
        Returns the quantum dict or None if not found.
        """
        entry = self._index.get(quantum_id)
        if not entry:
            return None

        file_path = os.path.join(self.lake_dir, entry["file"])
        if not os.path.exists(file_path):
            return None

        with open(file_path) as f:
            f.seek(entry["offset"])
            line = f.read(entry["length"])
            return json.loads(line)

    def stream(self, date: str = None) -> Iterator[dict]:
        """
        Stream quanta from the lake.
        
        If date is provided, stream only that day's quanta.
        Otherwise, stream all quanta in chronological order.
        """
        if date:
            files = [f"{date}.jsonl"]
        else:
            files = sorted(f for f in os.listdir(self.lake_dir) if f.endswith(".jsonl") and f != "index.jsonl")

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
        """Find quanta by cognitive intent."""
        results = []
        for q in self.stream():
            cog = q.get("cognitive_state", {})
            if cog.get("intent") == intent:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    def query_source(self, source_did: str, limit: int = 100) -> list[dict]:
        """Find quanta by source DID."""
        results = []
        for q in self.stream():
            if q.get("source_did") == source_did:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    def query_timerange(self, start: str, end: str, limit: int = 1000) -> list[dict]:
        """Find quanta within a timestamp range."""
        results = []
        for q in self.stream():
            ts = q.get("timestamp", "")
            if start <= ts <= end:
                results.append(q)
                if len(results) >= limit:
                    break
        return results

    # ─── Deletion (GDPR) ────────────────────────────────────────────

    def delete(self, quantum_id: str) -> bool:
        """
        Delete a quantum from the lake.
        
        This rewrites the affected file without the deleted quantum.
        Returns True if the quantum was found and deleted.
        """
        entry = self._index.pop(quantum_id, None)
        if not entry:
            return False

        file_path = os.path.join(self.lake_dir, entry["file"])
        if not os.path.exists(file_path):
            return False

        # Rewrite file without the deleted quantum
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
        """Delete all quanta from a source DID. Returns count deleted."""
        to_delete = [qid for qid, entry in self._index.items() if entry.get("source_did") == source_did]
        for qid in to_delete:
            self.delete(qid)
        return len(to_delete)

    # ─── Stats ───────────────────────────────────────────────────────

    def stats(self) -> dict:
        """Get lake statistics."""
        dates = set()
        intents = defaultdict(int)
        sources = defaultdict(int)
        total_bytes = 0

        for entry in self._index.values():
            dates.add(entry["file"].replace(".jsonl", ""))
            sources[entry.get("source_did", "unknown")] += 1

        for q in self.stream():
            cog = q.get("cognitive_state", {})
            intents[cog.get("intent", "unknown")] += 1

        return {
            "total_quanta": len(self._index),
            "dates": sorted(dates),
            "intents": dict(intents),
            "sources": dict(sources),
            "lake_dir": self.lake_dir,
        }

    # ─── Internal ────────────────────────────────────────────────────

    def _rotate_file(self, date: str):
        """Rotate to a new daily file."""
        if self._current_file:
            self._current_file.close()
        self._current_date = date
        file_path = os.path.join(self.lake_dir, f"{date}.jsonl")
        self._current_file = open(file_path, "a")

    def _load_index(self):
        """Load the quantum index from disk."""
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
        """Flush the index to disk."""
        with open(self.index_path, "w") as f:
            for qid, entry in self._index.items():
                entry["quantum_id"] = qid
                f.write(json.dumps(entry) + "\n")

    def _load_metadata(self):
        """Load lake metadata."""
        if os.path.exists(self.meta_path):
            with open(self.meta_path) as f:
                self._metadata = json.load(f)
        else:
            self._metadata = {"created": time.time(), "version": "2.0"}

    def close(self):
        """Close the lake and flush all pending writes."""
        if self._current_file:
            self._current_file.close()
            self._current_file = None
        self._flush_index()

    def __del__(self):
        self.close()

    def __repr__(self) -> str:
        return f"AtomicMemoryLake(quanta={len(self._index)}, dir={self.lake_dir})"
