import type { Metadata } from "next";
import { BackendsPanel } from "@/components/ai/backends-panel";
import { listBackendStatuses } from "@/lib/backends/registry";

export const metadata: Metadata = {
  title: "Environment Variables — Agent Browser / Interface",
  description:
    "Model backend environment for the A2A execution surface: Hugging Face Hub substrate and Mercury2 cortex tier. Secrets stay server-side; the panel shows masked keys only.",
};

/**
 * Agent Browser · Interface · Environment Variables — mounts the
 * ai-elements environment-variables component over the backend
 * capability adapters (src/lib/backends/*). Adapters follow the
 * Cybernetic-Ava007 constellation contracts (mercury2.rs, HF master
 * skill); Agent-X executes, Ava007 cognizes.
 */
export default function EnvironmentVariablesPage() {
  const initial = listBackendStatuses();
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          Agent Browser · Interface
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Environment Variables
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Model backends wired to this execution surface. A backend reports{" "}
          <span className="font-medium">configured</span> when its key is
          present in the server environment — probe it to verify the
          credential end-to-end. Keys are masked server-side; the full secret
          never crosses the A2A boundary.
        </p>
      </header>
      <BackendsPanel initial={initial} />
    </main>
  );
}
