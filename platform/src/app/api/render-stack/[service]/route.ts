import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * GET/POST /api/render-stack/[service] — the RocksDB stacking engine API.
 *
 * Doctrine (owner, 2026-09-07): ESA and Help Assembly are services in the
 * Agent-X repo; each houses its own RocksDB database filled with its
 * respective content:
 *
 *   esa           → modules/esa/data/rocksdb           (job: esa-service)
 *   helpassembly  → modules/helpassembly/data/rocksdb  (job: helpassembly-service)
 *
 * The storage engine is real RocksDB (rocksdict bundle) driven through
 * scripts/rocks_stack.py: job#frame#depth keys, layers/meta column
 * families, atomic WriteBatch restacks, bounded prefix-scan render
 * hand-off (byte-sorted, bottom → top).
 */

const SERVICES = {
  esa: { job: "esa-service", db: "modules/esa/data/rocksdb" },
  helpassembly: { job: "helpassembly-service", db: "modules/helpassembly/data/rocksdb" },
} as const;

type ServiceKey = keyof typeof SERVICES;

const FRAME_DEFAULT = "f0001";
const MAX_PATH_LEN = 256;

function isService(x: string): x is ServiceKey {
  return Object.prototype.hasOwnProperty.call(SERVICES, x);
}

function safeRel(p: string): boolean {
  return (
    typeof p === "string" &&
    p.length > 0 &&
    p.length <= MAX_PATH_LEN &&
    !p.startsWith("/") &&
    !p.includes("\\") &&
    !p.split("/").includes("..") &&
    !p.includes("\0") &&
    !p.includes("#")
  );
}

async function repoRoot(): Promise<string> {
  const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function rocks(root: string, args: string[]): Promise<Record<string, unknown>> {
  const py = process.env.ROCKS_PY || "python3";
  const script = path.join(root, "scripts", "rocks_stack.py");
  const { stdout } = await exec(py, [script, ...args], {
    cwd: root,
    timeout: 20_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(stdout) as Record<string, unknown>;
}

async function fullState(root: string, cfg: { job: string; db: string }, job: string, frame: string) {
  const order = (await rocks(root, ["order", "--db", cfg.db, "--job", job, "--frame", frame])) as {
    render_order?: Array<{ key: string; depth: number; path: string }>;
    stream?: string;
  };
  const meta = (await rocks(root, ["meta-list", "--db", cfg.db, "--job", job])) as {
    assets?: Array<{ name: string; path: string; kind: string }>;
  };
  return {
    ok: true,
    job,
    frame,
    render_order: order.render_order ?? [],
    stream: order.stream ?? "",
    assets: meta.assets ?? [],
  };
}

export async function GET(req: Request, ctx: { params: Promise<{ service: string }> }) {
  const { service } = await ctx.params;
  if (!isService(service)) {
    return NextResponse.json({ ok: false, error: "unknown service (esa | helpassembly)" }, { status: 404 });
  }
  const url = new URL(req.url);
  const cfg = SERVICES[service];
  const job = url.searchParams.get("job") || cfg.job;
  const frame = url.searchParams.get("frame") || FRAME_DEFAULT;
  if (!safeRel(job) || !safeRel(frame)) {
    return NextResponse.json({ ok: false, error: "invalid job/frame" }, { status: 400 });
  }

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return NextResponse.json({ ok: false, error: "no git checkout reachable" }, { status: 404 });
  }

  try {
    const state = await fullState(root, cfg, job, frame);
    return NextResponse.json({ ...state, service, db: cfg.db });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: `rocksdb stack engine failed: ${msg.slice(0, 300)}` },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ service: string }> }) {
  const { service } = await ctx.params;
  if (!isService(service)) {
    return NextResponse.json({ ok: false, error: "unknown service (esa | helpassembly)" }, { status: 404 });
  }
  const cfg = SERVICES[service];

  let body: {
    op?: string;
    job?: string;
    frame?: string;
    layers?: unknown;
    path?: unknown;
    name?: unknown;
    kind?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const job = typeof body.job === "string" && body.job ? body.job : cfg.job;
  const frame = typeof body.frame === "string" && body.frame ? body.frame : FRAME_DEFAULT;
  if (!safeRel(job) || !safeRel(frame)) {
    return NextResponse.json({ ok: false, error: "invalid job/frame" }, { status: 400 });
  }

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return NextResponse.json({ ok: false, error: "no git checkout reachable" }, { status: 404 });
  }

  try {
    if (body.op === "stack") {
      const layers = body.layers;
      if (
        !Array.isArray(layers) ||
        layers.length === 0 ||
        layers.length > 64 ||
        !layers.every((x) => typeof x === "string" && safeRel(x))
      ) {
        return NextResponse.json({ ok: false, error: "layers must be 1..64 repo-relative path strings" }, { status: 400 });
      }
      await rocks(root, ["stack", "--db", cfg.db, "--job", job, "--frame", frame, "--layers", JSON.stringify(layers)]);
    } else if (body.op === "add") {
      if (typeof body.path !== "string" || !safeRel(body.path)) {
        return NextResponse.json({ ok: false, error: "path must be a repo-relative string" }, { status: 400 });
      }
      await rocks(root, ["add", "--db", cfg.db, "--job", job, "--frame", frame, "--path", body.path]);
    } else if (body.op === "meta-put") {
      if (
        typeof body.name !== "string" ||
        !body.name ||
        !safeRel(body.name) ||
        typeof body.path !== "string" ||
        !safeRel(body.path)
      ) {
        return NextResponse.json({ ok: false, error: "name and path must be safe strings" }, { status: 400 });
      }
      const kind = typeof body.kind === "string" && safeRel(body.kind) ? body.kind : "asset";
      await rocks(root, [
        "meta-put",
        "--db",
        cfg.db,
        "--job",
        job,
        "--name",
        body.name,
        "--path",
        body.path,
        "--kind",
        kind,
      ]);
    } else {
      return NextResponse.json({ ok: false, error: "op must be stack | add | meta-put" }, { status: 400 });
    }

    const state = await fullState(root, cfg, job, frame);
    return NextResponse.json({ ...state, service, db: cfg.db });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: `rocksdb stack engine failed: ${msg.slice(0, 300)}` },
      { status: 500 },
    );
  }
}
