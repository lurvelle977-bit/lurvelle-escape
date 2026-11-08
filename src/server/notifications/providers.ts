import { env } from "../env";

// Low-level senders. Each returns an honest outcome: SENT only when the provider accepted the message.

export type SendResult =
  | { status: "SENT"; providerId: string | null }
  | { status: "SKIPPED"; reason: string }
  | { status: "FAILED"; error: string };

const TIMEOUT_MS = 8000;

export async function sendEmail(input: { to: string[]; subject: string; html: string; text: string }): Promise<SendResult> {
  const { apiKey, from } = env.email;
  if (!apiKey || !from) return { status: "SKIPPED", reason: "Email is not configured (RESEND_API_KEY / EMAIL_FROM)" };
  if (input.to.length === 0) return { status: "SKIPPED", reason: "No recipient" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) return { status: "FAILED", error: `Resend ${response.status}: ${body.message ?? "request rejected"}` };
    return { status: "SENT", providerId: body.id ?? null };
  } catch (error) {
    return { status: "FAILED", error: error instanceof Error ? error.message : "Email request failed" };
  }
}

type WhatsAppTemplate = "NEW_BOOKING" | "QUOTATION" | "PAYMENT" | "CONFIRMED";

// Business-initiated WhatsApp messages must use a pre-approved template. Parameters are positional ({{1}}, {{2}}, ...).
export async function sendWhatsAppTemplate(input: { to: string; template: WhatsAppTemplate; params: string[] }): Promise<SendResult> {
  const { token, phoneNumberId, language } = env.whatsapp;
  const templateName = env.whatsapp.template(input.template);
  if (!token || !phoneNumberId) return { status: "SKIPPED", reason: "WhatsApp is not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)" };
  if (!templateName) return { status: "SKIPPED", reason: `No approved template set for ${input.template}` };
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          // Template parameters may not contain newlines or tabs
          components: [{ type: "body", parameters: input.params.map((value) => ({ type: "text", text: value.replace(/\s+/g, " ").slice(0, 1000) })) }],
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
    if (!response.ok) return { status: "FAILED", error: `WhatsApp ${response.status}: ${body.error?.message ?? "request rejected"}` };
    return { status: "SENT", providerId: body.messages?.[0]?.id ?? null };
  } catch (error) {
    return { status: "FAILED", error: error instanceof Error ? error.message : "WhatsApp request failed" };
  }
}
