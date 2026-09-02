"""Tashi DAG — substrate lineage and gossip for Interaction Quanta.

Tashi owns substrate lineage/consensus mechanics only. Cognitive state,
reasoning, and other model-internal state belong to Cybernetic-Ava007 and are
not required by this DAG.
"""

import os
import time
from typing import Optional, Callable


class TashiVertex:
    """A single substrate InteractionQuantum vertex."""

    def __init__(self, quantum):
        self.quantum = quantum
        self.quantum_id = quantum.quantum_id
        self.parents = list(quantum.parent_quanta)
        self.children: list[str] = []
        self.depth = 0
        self.arrival_time = time.time()
        self.gossip_count = 0

    def to_dict(self) -> dict:
        return {
            "quantum_id": self.quantum_id,
            "parents": self.parents,
            "children": self.children,
            "depth": self.depth,
            "arrival_time": self.arrival_time,
            "gossip_count": self.gossip_count,
        }


class TashiDAG:
    """Leaderless substrate DAG for InteractionQuantum lineage and gossip."""

    def __init__(self, storage_path: Optional[str] = None):
        self.vertices: dict[str, TashiVertex] = {}
        self.tips: set[str] = set()
        self.roots: set[str] = set()
        self.storage_path = storage_path
        self._on_add_callbacks: list[Callable] = []
        if storage_path and os.path.exists(storage_path):
            self._load()

    def add(self, quantum) -> bool:
        qid = quantum.quantum_id
        if qid in self.vertices:
            return False

        vertex = TashiVertex(quantum)
        if not quantum.parent_quanta:
            vertex.depth = 0
            self.roots.add(qid)
        else:
            max_parent_depth = -1
            for parent_id in quantum.parent_quanta:
                if parent_id in self.vertices:
                    parent = self.vertices[parent_id]
                    parent.children.append(qid)
                    max_parent_depth = max(max_parent_depth, parent.depth)
                    self.tips.discard(parent_id)
            vertex.depth = max_parent_depth + 1

        self.vertices[qid] = vertex
        self.tips.add(qid)

        for cb in self._on_add_callbacks:
            try:
                cb(quantum, vertex)
            except Exception:
                pass

        if self.storage_path:
            self._save()
        return True

    def get(self, quantum_id: str) -> Optional:
        vertex = self.vertices.get(quantum_id)
        return vertex.quantum if vertex else None

    def get_vertex(self, quantum_id: str) -> Optional[TashiVertex]:
        return self.vertices.get(quantum_id)

    def get_lineage(self, quantum_id: str, max_depth: int = 100) -> list:
        visited = set()
        lineage = []

        def _walk(qid, depth):
            if qid in visited or depth > max_depth or qid not in self.vertices:
                return
            visited.add(qid)
            vertex = self.vertices[qid]
            for parent_id in vertex.parents:
                _walk(parent_id, depth + 1)
            lineage.append(vertex.quantum)

        _walk(quantum_id, 0)
        return lineage

    def get_children(self, quantum_id: str) -> list:
        vertex = self.vertices.get(quantum_id)
        if not vertex:
            return []
        return [self.vertices[cid].quantum for cid in vertex.children if cid in self.vertices]

    def get_tips(self) -> list:
        return [self.vertices[tid].quantum for tid in self.tips if tid in self.vertices]

    def get_roots(self) -> list:
        return [self.vertices[rid].quantum for rid in self.roots if rid in self.vertices]

    def depth(self) -> int:
        if not self.vertices:
            return 0
        return max(v.depth for v in self.vertices.values())

    def size(self) -> int:
        return len(self.vertices)

    def on_add(self, callback: Callable):
        self._on_add_callbacks.append(callback)

    def gossip_export(self, since_timestamp: float = 0) -> list[dict]:
        to_gossip = []
        for vertex in self.vertices.values():
            if vertex.arrival_time > since_timestamp:
                to_gossip.append(vertex.quantum.to_dict())
                vertex.gossip_count += 1
        return to_gossip

    def gossip_import(self, quanta_data: list[dict]) -> int:
        from .quantum import InteractionQuantum

        added = 0
        for q_dict in quanta_data:
            quantum = InteractionQuantum.from_dict(q_dict)
            if self.add(quantum):
                added += 1
        return added

    def merge(self, other: "TashiDAG") -> int:
        added = 0
        for qid, vertex in other.vertices.items():
            if qid not in self.vertices:
                self.add(vertex.quantum)
                added += 1
        return added

    # Legacy method retained as a non-cognitive compatibility query. The
    # argument is matched only against opaque substrate references.
    def query_by_intent(self, intent: str) -> list:
        results = []
        for vertex in self.vertices.values():
            payload = vertex.quantum.payload or {}
            if payload.get("intent_id") == intent or payload.get("capability") == intent:
                results.append(vertex.quantum)
        return results

    def query_by_source(self, source_did: str) -> list:
        return [
            vertex.quantum
            for vertex in self.vertices.values()
            if vertex.quantum.source_did == source_did
        ]

    def query_by_timerange(self, start: str, end: str) -> list:
        return [
            vertex.quantum
            for vertex in self.vertices.values()
            if start <= vertex.quantum.timestamp <= end
        ]

    def _save(self):
        if not self.storage_path:
            return
        os.makedirs(os.path.dirname(self.storage_path) or ".", exist_ok=True)
        with open(self.storage_path, "w") as f:
            for vertex in self.vertices.values():
                f.write(vertex.quantum.to_jsonl() + "\n")

    def _load(self):
        from .quantum import InteractionQuantum

        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        with open(self.storage_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        self.add(InteractionQuantum.from_jsonl(line))
                    except Exception:
                        continue

    def stats(self) -> dict:
        capabilities = {}
        sources = {}
        for vertex in self.vertices.values():
            payload = vertex.quantum.payload or {}
            capability = payload.get("capability")
            if capability:
                capabilities[capability] = capabilities.get(capability, 0) + 1
            source = vertex.quantum.source_did
            sources[source] = sources.get(source, 0) + 1

        return {
            "vertices": len(self.vertices),
            "tips": len(self.tips),
            "roots": len(self.roots),
            "depth": self.depth(),
            "capabilities": capabilities,
            "sources": sources,
        }

    def __repr__(self) -> str:
        return f"TashiDAG(vertices={len(self.vertices)}, tips={len(self.tips)}, depth={self.depth()})"
