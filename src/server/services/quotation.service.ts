import { isValidCustomerToken } from "../auth/tokens";
import { db, withTransaction } from "../db/pool";
import { invalidState, notFound } from "../http/errors";
import { notifyQuotation, notifyQuoteResponse } from "../notifications/notification.service";
import * as bookings from "../repositories/booking.repository";
import * as workflow from "../repositories/workflow.repository";
import { lockBooking, transition } from "./booking.service";

type QuotationInput = {
  amount: number;
  additionalCharges: number;
  currency: string;
  includedServices: string;
  notes: string | null;
  validDays: number;
};

// Admin creates (or revises) the quotation. Revising keeps the old version in history and replaces the live one.
export async function createQuotation(idOrReference: string, input: QuotationInput, adminId: string) {
  const { bookingId, quotation } = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (!["UNDER_REVIEW", "ALTERNATIVE_PROPOSED", "QUOTED"].includes(booking.status)) {
      throw invalidState("A quotation can only be prepared while the booking is under review.");
    }
    await workflow.supersedeLiveQuotation(client, booking.id);
    const created = await workflow.insertQuotation(client, { bookingId: booking.id, adminId, ...input, baseAmount: input.amount });
    await bookings.setQuote(client, booking.id, created.totalAmount, created.currency);

    const actor = { type: "ADMIN", id: adminId } as const;
    const metadata = { version: created.version, total: created.totalAmount, currency: created.currency };
    if (booking.status === "QUOTED") {
      await workflow.addEvent(client, { bookingId: booking.id, type: "QUOTATION_REVISED", actor, message: `Quotation v${created.version} sent`, metadata });
    } else {
      await transition(client, booking, "QUOTED", actor, { type: "QUOTATION_CREATED", message: `Quotation v${created.version} sent`, metadata });
    }
    return { bookingId: booking.id, quotation: created };
  });
  const booking = (await bookings.findBooking(db, bookingId))!;
  notifyQuotation(booking, quotation);
  return { booking, quotation };
}

// Customer accepts or declines using their private link. The amount is never read from the request.
export async function respondToQuotation(reference: string, token: string, decision: "ACCEPT" | "REJECT") {
  if (!isValidCustomerToken(reference, token)) throw notFound();

  const bookingId = await withTransaction(async (client) => {
    const booking = await lockBooking(client, reference);
    if (booking.status !== "QUOTED") throw invalidState("There is no quotation waiting for your answer.");
    const quotation = await workflow.liveQuotation(client, booking.id, true);
    if (!quotation) throw invalidState("There is no quotation waiting for your answer.");
    if (new Date(quotation.validUntil) < new Date()) {
      throw invalidState("This quotation has expired. Please contact us for an updated one.");
    }

    const actor = { type: "CUSTOMER" } as const;
    if (decision === "ACCEPT") {
      await workflow.respondToQuotation(client, quotation.id, "ACCEPTED");
      await transition(client, booking, "QUOTE_ACCEPTED", actor, {
        type: "QUOTATION_ACCEPTED",
        message: "Customer accepted the quotation",
        metadata: { version: quotation.version, total: quotation.totalAmount },
      });
    } else {
      await workflow.respondToQuotation(client, quotation.id, "REJECTED");
      await transition(client, booking, "QUOTE_REJECTED", actor, { type: "QUOTATION_REJECTED", message: "Customer declined the quotation" });
      // A declined quotation closes the booking
      await transition(client, booking, "CANCELLED", { type: "SYSTEM" }, {
        type: "BOOKING_CANCELLED",
        message: "Closed after the quotation was declined",
        cancelReason: "Quotation declined by customer",
      });
    }
    return booking.id;
  });

  const booking = (await bookings.findBooking(db, bookingId))!;
  notifyQuoteResponse(booking, decision === "ACCEPT");
  return booking;
}
