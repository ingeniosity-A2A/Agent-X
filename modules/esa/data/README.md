# ESA — RocksDB housing

ESA is a SERVICE in the Agent-X repo. This directory houses its database:
`rocksdb/` — real RocksDB (rocksdict bundle), layers + meta column families,
content = ESA service assets (the 3 primary ESA cards: Maintenance Calls, Inventory, Daily To-Do; calendar, green shield,
DuckDB config, console).

- Schema: `job#frame#depth` keys → path references; `scripts/rocks_stack.py`
- Seed / reset: `python3 scripts/seed_rocksdb.py`
- Internals (SST/MANIFEST/WAL) are gitignored — regenerable from the seed.
