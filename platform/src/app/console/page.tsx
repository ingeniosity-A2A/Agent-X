import { redirect } from "next/navigation";

/** Legacy path — ESA operator surface lives under /consoles/esa-maintenance */
export default function LegacyConsoleRedirect() {
  redirect("/consoles/esa-maintenance");
}
