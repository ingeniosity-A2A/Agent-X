/**
 * ESA Exoskeleton email identities + AgentMail transport.
 * Ava: ava007@agentmail.to → Manager: bmccray02@gmail.com
 */

export const AVA_EMAIL = process.env.ESA_AVA_EMAIL || "ava007@agentmail.to";
export const MANAGER_EMAIL =
  process.env.ESA_MANAGER_EMAIL || "bmccray02@gmail.com";

export type SendResult = {
  ok: boolean;
  delivered: boolean;
  transport: "agentmail" | "stub";
  from: string;
  to: string;
  subject: string;
  messageId?: string;
  error?: string;
  note?: string;
};

/**
 * Send via AgentMail REST API when AGENTMAIL_API_KEY is set.
 * Inbox id defaults to AVA_EMAIL local part or full address per AgentMail config.
 */
export async function sendViaAgentMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendResult> {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  const from = AVA_EMAIL;
  const inboxId =
    process.env.AGENTMAIL_INBOX_ID ||
    process.env.ESA_AVA_INBOX_ID ||
    AVA_EMAIL;

  if (!apiKey) {
    return {
      ok: true,
      delivered: false,
      transport: "stub",
      from,
      to: opts.to,
      subject: opts.subject,
      note: "AGENTMAIL_API_KEY not set — payload ready, not delivered",
    };
  }

  try {
    const res = await fetch(
      `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        delivered: false,
        transport: "agentmail",
        from,
        to: opts.to,
        subject: opts.subject,
        error:
          data?.message ||
          data?.error ||
          `AgentMail HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      delivered: true,
      transport: "agentmail",
      from,
      to: opts.to,
      subject: opts.subject,
      messageId: data.message_id || data.messageId,
      note: "Delivered via AgentMail",
    };
  } catch (e) {
    return {
      ok: false,
      delivered: false,
      transport: "agentmail",
      from,
      to: opts.to,
      subject: opts.subject,
      error: e instanceof Error ? e.message : "AgentMail request failed",
    };
  }
}
