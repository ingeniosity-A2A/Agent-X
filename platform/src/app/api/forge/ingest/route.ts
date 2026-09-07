import { NextResponse } from "next/server";
import { cleanupStage, errJson, forgeEngine, repoRoot, stageUpload, MAX_UPLOAD_BYTES } from "@/lib/forge/engine";

/**
 * POST /api/forge/ingest — F0 Raw Upload.
 * multipart: file (≤32MB per the Standard), optional source/mime.
 * Write-once, sha256-addressed; identical bytes dedupe to the same F0.
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
  if (file.size > MAX_UPLOAD_BYTES) {
    return errJson(`upload exceeds documented ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB cap`, 413);
  }
  const source = typeof form.get("source") === "string" ? (form.get("source") as string).slice(0, 120) : "upload";

  const stage = await stageUpload(file);
  try {
    const result = await forgeEngine(root, [
      "ingest",
      "--path",
      stage.filePath,
      "--name",
      stage.name,
      "--source",
      source,
      "--mime",
      file.type || "application/octet-stream",
    ]);
    return NextResponse.json({ ...result, service: "forge-org" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`F0 ingest failed: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await cleanupStage(stage.dir);
  }
}
