import type { Metadata } from "next";
import Ava007ChatPageDemo from "@/components/ui-kit/ava007-chat-page-demo";
import "@/components/ui-kit/ava007-prompt-widget.css";

export const metadata: Metadata = {
  title: "Ava007 UI Kit — Agent Browser / Interface",
  description:
    "Unified Bento + Ava007 prompt-widget skill: chat workspace demo with model flyout, image upload, style assistant and dark/light toggle.",
};

/**
 * Agent Browser · Interface · UI Kit — mounts the Ava007 UI Kit
 * chat-page demo (Nocra spec rebranded to Ava007; brands do not
 * mingle). Generation states are simulated locally and labeled as
 * such — no model backend is wired to this route yet.
 */
export default function UiKitPage() {
  return <Ava007ChatPageDemo />;
}
