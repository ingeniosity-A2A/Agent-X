# Help Assembly — RocksDB housing

Help Assembly is a SERVICE in the Agent-X repo. This directory houses its
database: `rocksdb/` — real RocksDB (rocksdict bundle), layers + meta
column families, content = Help Assembly service assets (console, docs
pipeline, build/deploy docs, topology).

- Schema: `job#frame#depth` keys → path references; `scripts/rocks_stack.py`
- Seed / reset: `python3 scripts/seed_rocksdb.py`
- Internals (SST/MANIFEST/WAL) are gitignored — regenerable from the seed.
