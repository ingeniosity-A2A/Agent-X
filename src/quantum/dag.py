"""
Tashi DAG — Leaderless Consensus for Interaction Quanta

Every Interaction Quantum is a vertex in a Directed Acyclic Graph.
The gossip protocol ensures eventual consistency across offline nodes.
Each quantum is cryptographically signed by its creator's DID.

Properties:
- Append-only: quanta are never deleted, only superseded
- Conflict-free: CRDT-like merge semantics
- Offline-first: quanta queue locally, gossip on reconnect
- Verifiable: full lineage chain is cryptographically auditable
"""

import json
import os
import time
from collections import defaultdict
from typing import Optional, Callable


class TashiVertex:
    """A single vertex in the Tashi DAG."""

    def __init__(self, quantum):
        self.quantum = quantum
        self.quantum_id = quantum.quantum_id
        self.parents = list(quantum.parent_quanta)
        self.children: list[str] = []
        self.depth = 0
        self.arrival_time = time.time()
        self.gossip_count = 0  # How many times this vertex has been gossiped

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
    """
    Tashi DAG — Leaderless consensus via quantum gossip.
    
    The DAG maintains:
    - Vertices: map of quantum_id → TashiVertex
    - Tips: set of leaf vertices (no children yet)
    - Roots: set of genesis vertices (no parents)
    - Depth map: quantum_id → depth from root
    """

    def __init__(self, storage_path: Optional[str] = None):
        self.vertices: dict[str, TashiVertex] = {}
        self.tips: set[str] = set()     # Leaf nodes
        self.roots: set[str] = set()    # Genesis nodes
        self.storage_path = storage_path
        self._on_add_callbacks: list[Callable] = []

        # Load persisted state
        if storage_path and os.path.exists(storage_path):
            self._load()

    def add(self, quantum) -> bool:
        """
        Add a quantum to the DAG.
        
        Returns True if the quantum was added (new), False if already exists.
        """
        qid = quantum.quantum_id

        if qid in self.vertices:
            return False  # Already exists

        vertex = TashiVertex(quantum)

        # Compute depth
        if not quantum.parent_quanta:
            # Genesis vertex
            vertex.depth = 0
            self.roots.add(qid)
        else:
            max_parent_depth = -1
            for parent_id in quantum.parent_quanta:
                if parent_id in self.vertices:
                    parent = self.vertices[parent_id]
                    parent.children.append(qid)
                    max_parent_depth = max(max_parent_depth, parent.depth)
                    # Parent is no longer a tip
                    self.tips.discard(parent_id)
            vertex.depth = max_parent_depth + 1

        self.vertices[qid] = vertex
        self.tips.add(qid)

        # Fire callbacks
        for cb in self._on_add_callbacks:
            try:
                cb(quantum, vertex)
            except Exception:
                pass

        # Persist
        if self.storage_path:
            self._save()

        return True

    def get(self, quantum_id: str) -> Optional:
        """Get a quantum by ID."""
        vertex = self.vertices.get(quantum_id)
        return vertex.quantum if vertex else None

    def get_vertex(self, quantum_id: str) -> Optional[TashiVertex]:
        """Get a vertex by ID."""
        return self.vertices.get(quantum_id)

    def get_lineage(self, quantum_id: str, max_depth: int = 100) -> list:
        """
        Get the lineage chain from a quantum back to its roots.
        Returns quanta in chronological order (oldest first).
        """
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
        """Get immediate children of a quantum."""
        vertex = self.vertices.get(quantum_id)
        if not vertex:
            return []
        return [self.vertices[cid].quantum for cid in vertex.children if cid in self.vertices]

    def get_tips(self) -> list:
        """Get all tip (leaf) quanta."""
        return [self.vertices[tid].quantum for tid in self.tips if tid in self.vertices]

    def get_roots(self) -> list:
        """Get all root (genesis) quanta."""
        return [self.vertices[rid].quantum for rid in self.roots if rid in self.vertices]

    def depth(self) -> int:
        """Get the maximum depth of the DAG."""
        if not self.vertices:
            return 0
        return max(v.depth for v in self.vertices.values())

    def size(self) -> int:
        """Get the number of vertices in the DAG."""
        return len(self.vertices)

    def on_add(self, callback: Callable):
        """Register a callback for when a quantum is added."""
        self._on_add_callbacks.append(callback)

    # ─── Gossip Protocol ─────────────────────────────────────────────

    def gossip_export(self, since_timestamp: float = 0) -> list[dict]:
        """
        Export quanta for gossip to another node.
        Returns quanta newer than since_timestamp.
        """
        to_gossip = []
        for vertex in self.vertices.values():
            if vertex.arrival_time > since_timestamp:
                to_gossip.append(vertex.quantum.to_dict())
                vertex.gossip_count += 1
        return to_gossip

    def gossip_import(self, quanta_data: list[dict]) -> int:
        """
        Import quanta from a gossip message.
        Returns the number of new quanta added.
        """
        from .quantum import InteractionQuantum

        added = 0
        for q_dict in quanta_data:
            quantum = InteractionQuantum.from_dict(q_dict)
            if self.add(quantum):
                added += 1
        return added

    def merge(self, other: "TashiDAG") -> int:
        """
        Merge another TashiDAG into this one.
        Returns the number of new quanta added.
        """
        added = 0
        for qid, vertex in other.vertices.items():
            if qid not in self.vertices:
                self.add(vertex.quantum)
                added += 1
        return added

    # ─── Query ───────────────────────────────────────────────────────

    def query_by_intent(self, intent: str) -> list:
        """Find all quanta with a specific cognitive intent."""
        results = []
        for vertex in self.vertices.values():
            q = vertex.quantum
            if q.cognitive_state and q.cognitive_state.intent == intent:
                results.append(q)
        return results

    def query_by_source(self, source_did: str) -> list:
        """Find all quanta from a specific source DID."""
        results = []
        for vertex in self.vertices.values():
            if vertex.quantum.source_did == source_did:
                results.append(vertex.quantum)
        return results

    def query_by_timerange(self, start: str, end: str) -> list:
        """Find all quanta within a timestamp range (ISO-8601)."""
        results = []
        for vertex in self.vertices.values():
            if start <= vertex.quantum.timestamp <= end:
                results.append(vertex.quantum)
        return results

    # ─── Persistence ─────────────────────────────────────────────────

    def _save(self):
        """Persist the DAG to JSONL file."""
        if not self.storage_path:
            return
        os.makedirs(os.path.dirname(self.storage_path) or ".", exist_ok=True)
        with open(self.storage_path, "w") as f:
            for vertex in self.vertices.values():
                f.write(vertex.quantum.to_jsonl() + "\n")

    def _load(self):
        """Load the DAG from JSONL file."""
        from .quantum import InteractionQuantum
        if not self.storage_path or not os.path.exists(self.storage_path):
            return
        with open(self.storage_path) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        quantum = InteractionQuantum.from_jsonl(line)
                        self.add(quantum)
                    except Exception:
                        continue

    # ─── Stats ───────────────────────────────────────────────────────

    def stats(self) -> dict:
        """Get DAG statistics."""
        intents = defaultdict(int)
        sources = defaultdict(int)
        for vertex in self.vertices.values():
            q = vertex.quantum
            if q.cognitive_state:
                intents[q.cognitive_state.intent] += 1
            sources[q.source_did] += 1

        return {
            "vertices": len(self.vertices),
            "tips": len(self.tips),
            "roots": len(self.roots),
            "depth": self.depth(),
            "intents": dict(intents),
            "sources": dict(sources),
        }

    def __repr__(self) -> str:
        return f"TashiDAG(vertices={len(self.vertices)}, tips={len(self.tips)}, depth={self.depth()})"
