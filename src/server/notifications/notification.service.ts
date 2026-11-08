import { after } from "next/server";
import { db } from "../db/pool";
import { customerToken } from "../auth/tokens";
import { env } from "../env";
import type { BookingRecord } from "../repositories/booking.repository";
import { logNotification, type QuotationRecord } from "../repositories/workflow.repository";
import { sendEmail, sendWhatsAppTemplate, type SendResult } from "./providers";
import { templates, type BookingFacts, type Email } from "./templates";

// Notifications run after the response is sent and after the database transaction has committed.
// A failure is logged (never thrown), so it can never roll back or duplicate a booking.

function background(job: () => Promise<void>) {
  const safe = () =>
    job().catch((error) => console.error("[notify] job crashed", error));
  try {
    after(safe);
  } catch {
    // Not inside a request (scripts, tests): just run it
    void safe();
  }
}

const customerLink = (b: BookingRecord) => `${env.siteUrl}/booking/${b.reference}?t=${customerToken(b.reference)}`;
const adminLink = (b: BookingRecord) => `${env.siteUrl}/admin/bookings/${b.reference}`;
const money = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

function facts(b: BookingRecord): BookingFacts {
  return {
    reference: b.reference,
    bookingType: b.bookingType,
    destination: b.destinationName ?? b.customDestination ?? "—",
    travelDate: b.travelDate,
    pickupLocation: b.pickupLocation,
    passengers: b.passengers,
    notes: b.notes,
    customerName: b.customer.name,
    customerEmail: b.customer.email,
    customerWhatsapp: b.customer.whatsapp,
  };
}

async function record(b: BookingRecord, channel: "EMAIL" | "WHATSAPP", template: string, recipient: string | null, result: SendResult) {
  try {
    await logNotification(db, {
      bookingId: b.id,
      channel,
      template,
      recipient,
      status: result.status,
      providerId: result.status === "SENT" ? result.providerId : null,
      error: result.status === "FAILED" ? result.error : result.status === "SKIPPED" ? result.reason : null,
    });
  } catch (error) {
    console.error("[notify] could not write notification log", error);
  }
  if (result.status === "FAILED") console.error(`[notify] ${channel} ${template} for ${b.reference} failed: ${result.error}`);
}

async function email(b: BookingRecord, template: string, to: string[], message: Email) {
  await record(b, "EMAIL", template, to.join(", ") || null, await sendEmail({ to, ...message }));
}

async function whatsapp(b: BookingRecord, template: Parameters<typeof sendWhatsAppTemplate>[0]["template"], to: string | undefined, params: string[]) {
  if (!to) {
    await record(b, "WHATSAPP", template, null, { status: "SKIPPED", reason: "No recipient number" });
    return;
  }
  await record(b, "WHATSAPP", template, to, await sendWhatsAppTemplate({ to, template, params }));
}

export function notifyBookingCreated(b: BookingRecord) {
  background(async () => {
    const f = facts(b);
    await email(b, "admin_new_booking", env.email.adminRecipients, templates.adminNewBooking(f, adminLink(b)));
    await email(b, "customer_received", [b.customer.email], templates.customerReceived(f));
    await whatsapp(b, "NEW_BOOKING", env.whatsapp.adminNumber, [b.reference, b.bookingType === "TOUR_PACKAGE" ? "Tour package" : "Vehicle / ride", f.destination, b.travelDate, b.customer.name]);
  });
}

export function notifyAlternative(b: BookingRecord, message: string) {
  background(() => email(b, "customer_alternative", [b.customer.email], templates.alternative(facts(b), message, customerLink(b))));
}

export function notifyQuotation(b: BookingRecord, q: QuotationRecord) {
  background(async () => {
    const total = money(q.totalAmount, q.currency);
    const validUntil = q.validUntil.slice(0, 10);
    await email(b, "customer_quotation", [b.customer.email], templates.quotation(facts(b), { total, included: q.includedServices, notes: q.notes, validUntil }, customerLink(b)));
    await whatsapp(b, "QUOTATION", b.customer.whatsapp, [b.reference, total, customerLink(b)]);
  });
}

export function notifyQuoteResponse(b: BookingRecord, accepted: boolean) {
  background(async () => {
    const f = facts(b);
    if (accepted) {
      await email(b, "admin_quote_accepted", env.email.adminRecipients, templates.quoteAccepted(f, adminLink(b)));
      await email(b, "customer_quote_accepted", [b.customer.email], templates.customerQuoteAccepted(f));
    } else {
      await email(b, "admin_quote_rejected", env.email.adminRecipients, templates.quoteRejected(f, adminLink(b)));
    }
  });
}

export function notifyPaymentInstructions(b: BookingRecord, amount: number, instructions: string) {
  background(async () => {
    const due = money(amount, b.currency);
    await email(b, "customer_payment_instructions", [b.customer.email], templates.paymentInstructions(facts(b), due, instructions));
    await whatsapp(b, "PAYMENT", b.customer.whatsapp, [b.reference, due, instructions]);
  });
}

export function notifyConfirmed(b: BookingRecord) {
  background(async () => {
    const vehicle = b.vehicleName ? `${b.vehicleName} (${b.vehiclePlate})` : null;
    await email(b, "customer_confirmation", [b.customer.email], templates.confirmation(facts(b), { vehicle, driver: b.driverName }));
    await whatsapp(b, "CONFIRMED", b.customer.whatsapp, [b.reference, b.travelDate, b.pickupLocation]);
  });
}

export function notifyCancelled(b: BookingRecord, reason: string | null) {
  background(() => email(b, "customer_cancellation", [b.customer.email], templates.cancellation(facts(b), reason)));
}
