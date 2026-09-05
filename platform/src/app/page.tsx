import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8ed]">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-[#7c3aed]">
          Agent-X · exo.help_assembly
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Agent Browser — Interface
        </h1>
        <p className="mt-3 text-sm text-[#999]">
          Help Assembly and ESA are 3D-Rendering surfaces on the Agent Browser.
          Inside ESA, you <strong className="text-[#ccc]">Select Card</strong>{" "}
          (Parts, Service, Green Shield, Daily To-Dos). Ava007 Dashboard stays
          with Ava007.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/agent-browser/interface/ui-kit"
            className="block rounded-xl border border-[#ff4d5e]/40 bg-[#12121a] px-5 py-4 hover:border-[#8b5cf6]"
          >
            <p className="font-medium">Ava007 UI Kit</p>
            <p className="text-xs text-[#777]">
              unified Bento + prompt-widget skill · chat workspace demo ·{" "}
              /agent-browser/interface/ui-kit
            </p>
          </Link>
          <Link
            href="/agent-browser/interface/3d-rendering/esa"
            className="block rounded-xl border border-[#7c3aed]/40 bg-[#12121a] px-5 py-4 hover:border-[#7c3aed]"
          >
            <p className="font-medium">ESA Exoskeleton</p>
            <p className="text-xs text-[#777]">
              Select Card · parts · service · green shield ·{" "}
              /agent-browser/interface/3d-rendering/esa
            </p>
          </Link>
          <Link
            href="/agent-browser/interface/3d-rendering/helpassembly"
            className="block rounded-xl border border-[#1e1e2e] bg-[#12121a] px-5 py-4 hover:border-[#00d4ff]"
          >
            <p className="font-medium">Help Assembly</p>
            <p className="text-xs text-[#777]">/agent-browser/interface/3d-rendering/helpassembly</p>
          </Link>
        </div>
        <p className="mt-10 text-[11px] text-[#444]">
          Mail: ava007@agentmail.to → bmccray02@gmail.com
        </p>
      </main>
    </div>
  );
}
