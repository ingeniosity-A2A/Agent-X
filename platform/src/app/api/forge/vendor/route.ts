import { NextResponse } from "next/server";
import { cleanupStage, errJson, forgeEngine, repoRoot, stageUpload, MAX_UPLOAD_BYTES } from "@/lib/forge/engine";

/**
 * POST /api/forge/vendor — Hugging Face vendor boundary (OUTSIDE F0→F3).
 * multipart: file + optional repo/filename. The artifact detector classifies
 * (safetensors / gguf / onnx / tokenizer-config / weight-archive / unknown→
 * quarantine); the vault stores METADATA ONLY — bytes are discarded here.
 */
export async function POST(req: Request) {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errJson("expected multipart/form-data with a file field", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return errJson("missing file field", 400);
  // Vendor metadata extraction reads headers only, but we still accept up to
  // the documented cap in this environment; multi-GB artifacts belong to the
  // real HF/content-addressed store (Standard §6).
  if (file.size > MAX_UPLOAD_BYTES) {
    return errJson(`vendor probe exceeds documented ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB cap — register via HF store instead`, 413);
  }
  const repo = typeof form.get("repo") === "string" ? (form.get("repo") as string).slice(0, 200) : undefined;

  const stage = await stageUpload(file);
  try {
    const result = await forgeEngine(root, [
      "vendor",
      "--path",
      stage.filePath,
      "--repo",
      repo || "(direct upload)",
      "--filename",
      stage.name,
    ]);
    return NextResponse.json(
      { ...result, service: "forge-org", bytes_retained: 0, note: "vendor bytes never enter the vault (Standard §6)" },
      { status: result.ok ? 200 : 400 },
    );
  } catch (e) {
    return errJson(`vendor detection failed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await cleanupStage(stage.dir);
  }
}
