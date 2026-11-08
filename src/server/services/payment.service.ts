import { db, withTransaction } from "../db/pool";
import { AppError, invalidState } from "../http/errors";
import { notifyConfirmed, notifyPaymentInstructions } from "../notifications/notification.service";
import * as bookings from "../repositories/booking.repository";
import * as workflow from "../repositories/workflow.repository";
import { lockBooking, transition } from "./booking.service";

const cents = (amount: number) => Math.round(amount * 100);

// Admin sends payment instructions for the accepted quotation. Booking moves to PAYMENT_PENDING.
export async function sendPaymentInstructions(idOrReference: string, instructions: string, adminId: string) {
  const { id, amount } = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (!["QUOTE_ACCEPTED", "PAYMENT_PENDING"].includes(booking.status)) {
      throw invalidState("Payment instructions can only be sent after the customer accepted the quotation.");
    }
    const quotation = await workflow.acceptedQuotation(client, booking.id);
    if (!quotation) throw invalidState("No accepted quotation found for this booking.");

    const actor = { type: "ADMIN", id: adminId } as const;
    // Re-sending replaces the earlier (still unpaid) instructions
    await workflow.cancelOpenPayments(client, booking.id);
    await workflow.insertPendingPayment(client, {
      bookingId: booking.id,
      quotationId: quotation.id,
      amount: quotation.totalAmount,
      currency: quotation.currency,
      instructions,
      adminId,
    });
    await bookings.setPaymentStatus(client, booking.id, "PENDING");
    const metadata = { amount: quotation.totalAmount, currency: quotation.currency };
    if (booking.status === "QUOTE_ACCEPTED") {
      await transition(client, booking, "PAYMENT_PENDING", actor, { type: "PAYMENT_INSTRUCTIONS_SENT", message: "Payment instructions sent", metadata });
    } else {
      await workflow.addEvent(client, { bookingId: booking.id, type: "PAYMENT_INSTRUCTIONS_SENT", actor, message: "Payment instructions re-sent", metadata });
    }
    return { id: booking.id, amount: quotation.totalAmount };
  });
  const booking = (await bookings.findBooking(db, id))!;
  notifyPaymentInstructions(booking, amount, instructions);
  return booking;
}

type Received = {
  method: string;
  amount: number;
  paymentReference: string | null;
  receivedAt?: string;
  notes: string | null;
};

// Admin records a payment they have verified. This never confirms the booking: that is a separate step.
export async function recordPaymentReceived(idOrReference: string, input: Received, adminId: string) {
  const id = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (booking.status !== "PAYMENT_PENDING") throw invalidState("No payment is awaited for this booking.");
    const pending = await workflow.pendingPayment(client, booking.id);
    if (!pending) throw invalidState("No payment is awaited for this booking.");
    if (cents(input.amount) !== cents(pending.expectedAmount)) {
      throw new AppError("VALIDATION_FAILED", `The amount received must equal the quoted total (${pending.expectedAmount.toFixed(2)}).`, {
        amount: [`Expected ${pending.expectedAmount.toFixed(2)}`],
      });
    }
    await workflow.markPaymentReceived(client, {
      id: pending.id,
      method: input.method,
      amount: input.amount,
      reference: input.paymentReference,
      receivedAt: input.receivedAt ?? null,
      notes: input.notes,
      adminId,
    });
    await bookings.setPaymentStatus(client, booking.id, "RECEIVED");
    await transition(client, booking, "PAYMENT_RECEIVED", { type: "ADMIN", id: adminId }, {
      type: "PAYMENT_RECEIVED",
      message: `Payment of ${input.amount.toFixed(2)} received by ${input.method} and verified`,
      metadata: { method: input.method, reference: input.paymentReference },
    });
    return booking.id;
  });
  return (await bookings.findBooking(db, id))!;
}

// Admin confirms a paid booking. Needs a vehicle and driver; the booking then becomes SCHEDULED.
export async function confirmBooking(idOrReference: string, adminId: string) {
  const id = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (booking.status !== "PAYMENT_RECEIVED" || booking.paymentStatus !== "RECEIVED") {
      throw invalidState("A booking can only be confirmed after its payment was received and verified.");
    }
    if (!booking.vehicleId || !booking.driverId) {
      throw invalidState("Assign a vehicle and a driver before confirming the booking.");
    }
    const actor = { type: "ADMIN", id: adminId } as const;
    await transition(client, booking, "CONFIRMED", actor, { type: "BOOKING_CONFIRMED", message: "Booking confirmed" });
    await transition(client, booking, "SCHEDULED", { type: "SYSTEM" }, { type: "BOOKING_SCHEDULED", message: "Trip scheduled" });
    return booking.id;
  });
  const booking = (await bookings.findBooking(db, id))!;
  notifyConfirmed(booking);
  return booking;
}
