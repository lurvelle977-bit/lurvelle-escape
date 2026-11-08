import { SITE_NAME } from "@/config/site";
import { escapeHtml } from "../domain/text";

// Reusable email layout. Every dynamic value is HTML-escaped before it is placed in the markup.

export type Email = { subject: string; html: string; text: string };

type Row = [label: string, value: string];

function layout(input: { heading: string; intro: string; rows?: Row[]; cta?: { label: string; url: string }; outro?: string }): string {
  const rows = (input.rows ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#7a6f5d;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1c1a17;font-size:14px;white-space:pre-line">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const cta = input.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(input.cta.url)}" style="background:#b8975a;color:#1c1a17;padding:12px 24px;text-decoration:none;font-weight:600;border-radius:999px;font-size:13px;letter-spacing:1px">${escapeHtml(input.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f2ea;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="letter-spacing:3px;font-size:12px;color:#b8975a;text-transform:uppercase;margin:0 0 16px">${escapeHtml(SITE_NAME)}</p>
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;color:#1c1a17;margin:0 0 12px">${escapeHtml(input.heading)}</h1>
<p style="font-size:14px;line-height:1.7;color:#3a352d;margin:0 0 16px">${escapeHtml(input.intro)}</p>
${rows ? `<table style="border-collapse:collapse;margin:8px 0">${rows}</table>` : ""}${cta}
${input.outro ? `<p style="font-size:13px;line-height:1.7;color:#7a6f5d">${escapeHtml(input.outro)}</p>` : ""}
</div></body></html>`;
}

function plain(input: { intro: string; rows?: Row[]; cta?: { label: string; url: string }; outro?: string }): string {
  return [input.intro, ...(input.rows ?? []).map(([label, value]) => `${label}: ${value}`), input.cta ? `${input.cta.label}: ${input.cta.url}` : "", input.outro ?? ""]
    .filter(Boolean)
    .join("\n");
}

function build(subject: string, heading: string, content: Parameters<typeof plain>[0]): Email {
  return { subject, html: layout({ heading, ...content }), text: plain(content) };
}

export type BookingFacts = {
  reference: string;
  bookingType: string;
  destination: string;
  travelDate: string;
  pickupLocation: string;
  passengers: number;
  notes: string | null;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
};

const typeLabel = (type: string) => (type === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride");

export const templates = {
  adminNewBooking: (b: BookingFacts, adminUrl: string) =>
    build(`New booking request ${b.reference}`, "New booking request", {
      intro: "A new booking request is waiting for review.",
      rows: [
        ["Reference", b.reference],
        ["Type", typeLabel(b.bookingType)],
        ["Destination", b.destination],
        ["Travel date", b.travelDate],
        ["Pickup", b.pickupLocation],
        ["Passengers", String(b.passengers)],
        ["Customer", `${b.customerName}\n${b.customerEmail}\n${b.customerWhatsapp}`],
        ["Notes", b.notes ?? "—"],
      ],
      cta: { label: "Open booking", url: adminUrl },
    }),

  customerReceived: (b: BookingFacts) =>
    build(`We received your request ${b.reference}`, "Request received", {
      intro: `Thank you, ${b.customerName}. Your request is awaiting review — it is not a confirmed booking yet. We will contact you about availability and pricing shortly.`,
      rows: [
        ["Reference", b.reference],
        ["Destination", b.destination],
        ["Travel date", b.travelDate],
        ["Pickup", b.pickupLocation],
        ["Passengers", String(b.passengers)],
      ],
    }),

  alternative: (b: BookingFacts, message: string, link: string) =>
    build(`An alternative for your request ${b.reference}`, "We have a suggestion", {
      intro: `Hello ${b.customerName}, we cannot offer exactly what you asked for, so we would like to suggest an alternative.`,
      rows: [["Our suggestion", message]],
      cta: { label: "View your request", url: link },
      outro: "Reply to this email or message us on WhatsApp and we will prepare your quotation.",
    }),

  quotation: (b: BookingFacts, q: { total: string; included: string; notes: string | null; validUntil: string }, link: string) =>
    build(`Your quotation ${b.reference}`, "Your quotation", {
      intro: `Hello ${b.customerName}, here is the quotation for your trip. Please review it and accept or decline using the button below.`,
      rows: [
        ["Reference", b.reference],
        ["Total", q.total],
        ["Included", q.included],
        ["Notes", q.notes ?? "—"],
        ["Valid until", q.validUntil],
      ],
      cta: { label: "Review quotation", url: link },
    }),

  quoteAccepted: (b: BookingFacts, adminUrl: string) =>
    build(`Quotation accepted ${b.reference}`, "Quotation accepted", {
      intro: `${b.customerName} accepted the quotation. Send payment instructions to continue.`,
      rows: [["Reference", b.reference]],
      cta: { label: "Open booking", url: adminUrl },
    }),

  quoteRejected: (b: BookingFacts, adminUrl: string) =>
    build(`Quotation declined ${b.reference}`, "Quotation declined", {
      intro: `${b.customerName} declined the quotation. The booking was cancelled.`,
      rows: [["Reference", b.reference]],
      cta: { label: "Open booking", url: adminUrl },
    }),

  customerQuoteAccepted: (b: BookingFacts) =>
    build(`Thank you ${b.reference}`, "Quotation accepted", {
      intro: `Thank you, ${b.customerName}. We will send you the payment instructions shortly. Your booking is confirmed only once payment is received.`,
      rows: [["Reference", b.reference]],
    }),

  paymentInstructions: (b: BookingFacts, amount: string, instructions: string) =>
    build(`Payment instructions ${b.reference}`, "Payment instructions", {
      intro: `Hello ${b.customerName}, please complete your payment as described below. Your booking is confirmed once we have received and verified it.`,
      rows: [
        ["Reference", b.reference],
        ["Amount due", amount],
        ["How to pay", instructions],
      ],
      outro: "Please use your booking reference as the payment reference.",
    }),

  confirmation: (b: BookingFacts, extra: { vehicle: string | null; driver: string | null }) =>
    build(`Booking confirmed ${b.reference}`, "Your booking is confirmed", {
      intro: `Hello ${b.customerName}, your payment has been received and your trip is scheduled.`,
      rows: [
        ["Reference", b.reference],
        ["Destination", b.destination],
        ["Travel date", b.travelDate],
        ["Pickup", b.pickupLocation],
        ["Passengers", String(b.passengers)],
        ["Vehicle", extra.vehicle ?? "To be confirmed"],
        ["Driver", extra.driver ?? "To be confirmed"],
      ],
    }),

  cancellation: (b: BookingFacts, reason: string | null) =>
    build(`Booking cancelled ${b.reference}`, "Booking cancelled", {
      intro: `Hello ${b.customerName}, your booking request has been cancelled.`,
      rows: [
        ["Reference", b.reference],
        ["Reason", reason ?? "—"],
      ],
      outro: "If this is unexpected, please reply to this email and we will help.",
    }),
};
