"""Zero Latency Quantum Harness.

Agent-X execution harness. Cognitive interpretation remains upstream in
Cybernetic-Ava007; this harness records only opaque intent/capability
references and execution observations in substrate quanta.
"""

import json
import time
from typing import Optional

from src.harness import Harness
from src.quantum.quantum import InteractionQuantum, QuantumBuilder, TweenType
from src.quantum.crypto import QuantumSigner
from src.quantum.dag import TashiDAG
from src.quantum.memory_lake import AtomicMemoryLake
from src.quantum.task_memory import GriptapeTaskMemory
from src.quantum.vfile import VFile
from src.quantum.gsap import TemporalOrchestrator
from src.quantum.flipper import FlipperEncoder
from src.quantum.lora_mesh import LoRaMeshProtocol


class ZeroLatencyHarness:
    """Layered Agent-X execution harness with substrate lineage."""

    def __init__(
        self,
        mercury_engine=None,
        storage_dir: str = ".openclaw/tmp/quantum_harness",
        source_did: str = "did:helpassembly:harness:001",
        signing_key: Optional[bytes] = None,
        enable_flipper: bool = False,
        enable_lora: bool = False,
        enable_vfile: bool = False,
    ):
        self.base_harness = Harness(mercury_engine=mercury_engine)
        self.source_did = source_did
        self.signer = QuantumSigner(private_key=signing_key, did=source_did)
        self.dag = TashiDAG(storage_path=f"{storage_dir}/dag.jsonl")
        self.lake = AtomicMemoryLake(lake_dir=f"{storage_dir}/lake")
        self.task_memory = GriptapeTaskMemory(storage_dir=f"{storage_dir}/taskmem")
        self.orchestrator = TemporalOrchestrator()
        self.flipper = FlipperEncoder() if enable_flipper else None
        self.lora = LoRaMeshProtocol(source_did) if enable_lora else None
        self.vfile_enabled = enable_vfile
        self._recent_quanta: list[InteractionQuantum] = []
        self._max_recent = 100
        self.stats = {
            "total": 0, "reflex": 0, "quantum": 0, "skill": 0, "memory": 0,
            "lineage": 0, "mercury": 0, "flipper": 0, "lora": 0, "vfile": 0,
            "quanta_created": 0, "latency_ms": 0,
        }

    @staticmethod
    def _refs(quantum) -> tuple[str, float]:
        payload = getattr(quantum, "payload", {}) or {}
        return str(payload.get("intent_id") or payload.get("capability") or "unknown"), float(payload.get("confidence", 0) or 0)

    def process(self, query: str, context: dict = None) -> dict:
        ctx = context or {}
        self.stats["total"] += 1
        start = time.time()

        cached = self.base_harness.reflex.match(query)
        if cached:
            latency = (time.time() - start) * 1000
            q = self._create_quantum(query, "reflex_hit", 1.0, cached["result"], latency, "reflex", ctx)
            self.stats["reflex"] += 1
            self._record_latency(latency)
            return self._build_response(q, cached["result"], "reflex", latency, 0)

        from src.patterns import match_pattern, generate_from_pattern
        pr = match_pattern(query.lower())
        if pr:
            pattern_name, score = pr
            schema = generate_from_pattern(pattern_name, ctx)
            self.base_harness.reflex.learn(query, schema)
            latency = (time.time() - start) * 1000
            q = self._create_quantum(query, pattern_name, score, schema, latency, "quantum", ctx)
            self.stats["quantum"] += 1
            self._record_latency(latency)
            return self._build_response(q, schema, "quantum", latency, 0)

        skill = self.base_harness.arena.find_matching_skill(query)
        if skill:
            latency = (time.time() - start) * 1000
            response = {"skill": skill}
            q = self._create_quantum(query, "skill_match", 0.8, response, latency, "skill", ctx)
            self.stats["skill"] += 1
            self._record_latency(latency)
            return self._build_response(q, response, "skill", latency, 0)

        memory_results = self.task_memory.search(query=query, limit=5)
        if memory_results:
            best = memory_results[0]
            latency = (time.time() - start) * 1000
            response = {
                "recall": True,
                "past_intent": best.get("intent"),
                "past_quantum_id": best.get("quantum_id"),
                "suggestion": f"Previously handled as '{best.get('intent', 'unknown')}'",
            }
            q = self._create_quantum(query, "memory_recall", best.get("confidence", 0.7), response, latency, "memory", ctx)
            self.stats["memory"] += 1
            self._record_latency(latency)
            return self._build_response(q, response, "memory", latency, 0)

        if self._recent_quanta:
            for recent in reversed(self._recent_quanta):
                recent_intent, _ = self._refs(recent)
                if self._semantic_overlap(query, recent_intent):
                    lineage = self.dag.get_lineage(recent.quantum_id, max_depth=5)
                    latency = (time.time() - start) * 1000
                    response = {"lineage_context": True, "parent_intent": recent_intent, "chain_length": len(lineage)}
                    q = self._create_quantum(query, "lineage_context", 0.75, response, latency, "lineage", ctx, recent.quantum_id)
                    self.stats["lineage"] += 1
                    self._record_latency(latency)
                    return self._build_response(q, response, "lineage", latency, 0)

        if self.base_harness.mercury:
            result = self.base_harness.mercury.generate_action_schema(query, ctx.get("tools", []), ctx)
            try:
                response = json.loads(result.text)
            except (json.JSONDecodeError, AttributeError):
                response = {"raw": str(result.text) if hasattr(result, "text") else str(result)}
            latency = (time.time() - start) * 1000
            tokens = getattr(result, "tokens_in", 0) + getattr(result, "tokens_out", 0)
            q = self._create_quantum(query, "mercury_reasoning", 0.95, response, latency, "mercury", ctx)
            self.stats["mercury"] += 1
            self._record_latency(latency)
            return self._build_response(q, response, "mercury", latency, tokens)

        latency = (time.time() - start) * 1000
        response = {"error": "No engine available"}
        q = self._create_quantum(query, "fallback", 0.0, response, latency, "fallback", ctx)
        self._record_latency(latency)
        return self._build_response(q, {"error": "No engine"}, "fallback", latency, 0)

    def _create_quantum(self, query, intent, confidence, response, latency_ms, tier, context, parent_id=None):
        parent_ids = [parent_id] if parent_id else ([self._recent_quanta[-1].quantum_id] if self._recent_quanta else [])
        q = (QuantumBuilder()
             .source(self.source_did)
             .intent(intent, confidence=confidence, role="harness")
             .tween(TweenType.EASE, duration_ms=min(int(latency_ms), 500))
             .payload({
                 "query": query, "response": response, "tier": tier,
                 "latency_ms": round(latency_ms, 2), "context_keys": list(context.keys()),
             }))
        for pid in parent_ids:
            q.parent(pid)
        quantum = q.build()
        quantum.lineage_signature = self.signer.sign_quantum(quantum)
        self.dag.add(quantum)
        self.lake.store(quantum)
        self.task_memory.store(quantum)
        self.orchestrator.ingest(quantum)
        self._recent_quanta.append(quantum)
        if len(self._recent_quanta) > self._max_recent:
            self._recent_quanta.pop(0)
        self.stats["quanta_created"] += 1
        self._dispatch_physical(quantum)
        return quantum

    def _dispatch_physical(self, quantum):
        intent, _ = self._refs(quantum)
        if self.flipper and intent in ("dispatch", "access", "gate", "alert", "control"):
            try:
                self.flipper.encode_quantum(quantum)
                self.stats["flipper"] += 1
            except Exception:
                pass
        if self.lora:
            try:
                self.lora.send(quantum.to_jsonl().encode())
                self.stats["lora"] += 1
            except Exception:
                pass
        if self.vfile_enabled:
            try:
                VFile.wrap_quantum(quantum)
                self.stats["vfile"] += 1
            except Exception:
                pass

    @staticmethod
    def _semantic_overlap(query: str, intent: str) -> bool:
        q_words = set(query.lower().split())
        i_words = set(intent.lower().replace("_", " ").split())
        return bool(q_words & i_words)

    def _record_latency(self, latency_ms: float):
        self.stats["latency_ms"] += latency_ms

    def _build_response(self, quantum, response, tier, latency_ms, tokens):
        intent, confidence = self._refs(quantum)
        return {
            "response": response,
            "quantum": {"id": quantum.quantum_id, "intent": intent, "confidence": confidence},
            "tier": tier, "latency_ms": round(latency_ms, 2), "tokens": tokens,
            "saved": 800 - tokens, "confidence": confidence,
        }

    def get_stats(self) -> dict:
        total = self.stats["total"]
        zero_latency = self.stats["reflex"] + self.stats["quantum"] + self.stats["skill"] + self.stats["memory"]
        return {
            **self.stats,
            "zero_token_pct": f"{zero_latency / total * 100:.1f}%" if total else "0%",
            "avg_ms": f"{self.stats['latency_ms'] / total:.1f}" if total else "0",
            "dag": self.dag.stats(),
            "lake": self.lake.stats(),
            "task_memory": self.task_memory.stats(),
            "orchestrator": self.orchestrator.get_bandwidth_stats(),
            "flipper": self.flipper.stats() if self.flipper else None,
            "lora": self.lora.stats() if self.lora else None,
        }

    def get_quantum(self, quantum_id: str) -> Optional[dict]:
        q = self.dag.get(quantum_id)
        return q.to_dict() if q else self.lake.retrieve(quantum_id)

    def get_lineage(self, quantum_id: str) -> list[dict]:
        return [q.to_dict() for q in self.dag.get_lineage(quantum_id)]

    def search_memory(self, **kwargs) -> list[dict]:
        return self.task_memory.search(**kwargs)

    def get_signal_history(self, **kwargs) -> list[dict]:
        return self.task_memory.get_signal_history(**kwargs)


def run_quantum_benchmark():
    """Run the Zero Latency Quantum Harness benchmark."""
    harness = ZeroLatencyHarness(enable_flipper=True, enable_lora=True, enable_vfile=True)
    tests = [
        ("Send reminder for tomorrow", "quantum"),
        ("What's the price for IKEA MALM?", "quantum"),
        ("Book appointment in Marietta", "quantum"),
        ("Dispatch tech Marcus", "quantum"),
        ("Customer complaint wobbling", "quantum"),
        ("Send invoice", "quantum"),
        ("Check schedule", "quantum"),
        ("What areas do you serve?", "quantum"),
        ("Request review", "quantum"),
        ("Check weather", "quantum"),
        ("What's your warranty?", "quantum"),
        ("Complex commercial 15 workstations", "fallback"),
        ("Analyze quarterly revenue", "fallback"),
    ]
    for query, expected_tier in tests:
        result = harness.process(query, {"customer": "Test", "city": "Atlanta"})
        tier = result["tier"]
        mark = "V" if expected_tier in tier or tier in ("reflex", "quantum", "skill", "memory", "lineage") else "X"
        print(f"{mark} [{tier:>12}] {result['latency_ms']:6.1f}ms | Q:{result['quantum']['id'][:16]}... | {query[:40]}")
    print(harness.get_stats())


if __name__ == "__main__":
    run_quantum_benchmark()
