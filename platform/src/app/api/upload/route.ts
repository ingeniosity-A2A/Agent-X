import { NextRequest, NextResponse } from "next/server";
import type { A2UINode, IngestResult } from "@/components/a2ui/types";

/**
 * Input ingestion — image/file → job + A2UI JobCard payload.
 * Stores in-memory for local/dev; production would use object storage + DB.
 * Does not expose a general dashboard — returns a single renderable card.
 */

type JobRecord = {
  id: string;
  status: string;
  imageUrl: string | null;
  assigned: string | null;
  quote: number | null;
  createdAt: string;
  service: string | null;
  item: string | null;
  filename: string | null;
  size: number | null;
  mime: string | null;
};

const jobs = new Map<string, JobRecord>();

function jobId(): string {
  return `J${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function toA2UI(job: JobRecord): A2UINode {
  return {
    component: "JobCard",
    data: {
      id: job.id,
      status: job.status,
      imageUrl: job.imageUrl,
      assigned: job.assigned,
      quote: job.quote,
      createdAt: job.createdAt,
      service: job.service,
      item: job.item,
    },
  };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const job = jobs.get(id);
    if (!job) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job, a2ui: toA2UI(job) });
  }
  const list = Array.from(jobs.values()).slice(-20).reverse();
  return NextResponse.json({
    ok: true,
    jobs: list,
    a2ui: {
      component: "Stack",
      children: list.map(toA2UI),
    } satisfies A2UINode,
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let imageUrl: string | null = null;
    let filename: string | null = null;
    let size: number | null = null;
    let mime: string | null = null;
    let item: string | null = null;
    let service: string | null = "Standard Assembly";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") ?? form.get("image");
      item = (form.get("item") as string) || null;
      service = (form.get("service") as string) || service;

      if (file && typeof file !== "string" && "arrayBuffer" in file) {
        const buf = Buffer.from(await file.arrayBuffer());
        const type = file.type || "application/octet-stream";
        filename = file.name || "upload.bin";
        size = buf.length;
        mime = type;

        if (buf.length > 4 * 1024 * 1024) {
          return NextResponse.json(
            { ok: false, error: "File too large (max 4MB in this surface)" } satisfies IngestResult,
            { status: 413 }
          );
        }
        imageUrl = `data:${type};base64,${buf.toString("base64")}`;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      imageUrl = body.imageUrl ?? body.image_url ?? null;
      item = body.item ?? null;
      service = body.service ?? service;
      filename = body.filename ?? null;
    }

    if (!imageUrl && !item) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide file (multipart) or imageUrl/item JSON",
        } satisfies IngestResult,
        { status: 400 }
      );
    }

    const id = jobId();
    const job: JobRecord = {
      id,
      status: "pending",
      imageUrl,
      assigned: null,
      quote: null,
      createdAt: new Date().toISOString(),
      service,
      item: item || filename || "Ingested item",
      filename,
      size,
      mime,
    };
    jobs.set(id, job);

    const result: IngestResult = {
      ok: true,
      jobId: id,
      imageUrl: imageUrl ?? undefined,
      a2ui: toA2UI(job),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return NextResponse.json({ ok: false, error: message } satisfies IngestResult, {
      status: 500,
    });
  }
}
