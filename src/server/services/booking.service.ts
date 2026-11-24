import type { PoolClient } from "pg";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { isValidCustomerToken } from "../auth/tokens";
import { db, withTransaction } from "../db/pool";
import { generateReference } from "../domain/reference";
import { ACTIVE_STATUSES, CUSTOMER_EDITABLE, MANUAL_TRANSITIONS, canTransition, type BookingStatus } from "../domain/status";
import { AppError, conflict, invalidState, notFound } from "../http/errors";
import {
  notifyAlternative,
  notifyBookingCreated,
  notifyCancelled,
} from "../notifications/notification.service";
import * as bookings from "../repositories/booking.repository";
import type { BookingRecord } from "../repositories/booking.repository";
import * as resources from "../repositories/resource.repository";
import * as workflow from "../repositories/workflow.repository";
import type { Actor } from "./types";
import type { CreateBookingInput } from "../validation/booking";

// ---------- Shared helpers (used by the quotation and payment services too) ----------

type DbError = { code?: string; constraint?: string };

// Turns the double-booking unique indexes into a friendly 409
export function rethrowDbConflict(error: unknown): never {
  const { code, constraint } = (error ?? {}) as DbError;
  if (code === "23505" && constraint === "bookings_vehicle_day_key") throw conflict("That vehicle is already booked for this date.");
  if (code === "23505" && constraint === "bookings_driver_day_key") throw conflict("That driver is already booked for this date.");
  throw error;
}

// Loads a booking row with a lock so concurrent admin actions on it run one at a time
export async function lockBooking(client: PoolClient, idOrReference: string): Promise<BookingRecord> {
  const booking = await bookings.findBooking(client, idOrReference, true);
  if (!booking) throw notFound();
  return booking;
}

// Every rule a vehicle must satisfy to serve a booking. Used when assigning and when a date or headcount changes,
// so the server never trusts what the admin UI filtered. Date availability is enforced by the unique indexes.
export function assertVehicleFits(vehicle: resources.VehicleRecord | null, booking: BookingRecord, passengers: number): asserts vehicle is resources.VehicleRecord {
  if (!vehicle || !vehicle.isActive) throw new AppError("VALIDATION_FAILED", "Choose an active vehicle.", { vehicleId: ["Unavailable vehicle"] });
  if (booking.vehicleCategory && vehicle.category !== booking.vehicleCategory) {
    throw conflict(
      `${vehicle.name} is a ${VEHICLE_CATEGORIES[vehicle.category]} vehicle, but the customer requested ${VEHICLE_CATEGORIES[booking.vehicleCategory]}.`,
    );
  }
  if (vehicle.passengerCapacity < passengers) throw conflict(`${vehicle.name} seats ${vehicle.passengerCapacity}, but the booking has ${passengers} passengers.`);
}

// The only place a booking's status changes: validates the move, writes it and records it in the history
export async function transition(
  client: PoolClient,
  booking: BookingRecord,
  to: BookingStatus,
  actor: Actor,
  event: { type: string; message?: string | null; metadata?: Record<string, unknown>; cancelReason?: string | null },
): Promise<void> {
  if (!canTransition(booking.status, to)) {
    throw invalidState(`A booking that is ${booking.status.toLowerCase().replace(/_/g, " ")} cannot move to ${to.toLowerCase().replace(/_/g, " ")}.`);
  }
  await bookings.setStatus(client, booking.id, to, { cancelReason: event.cancelReason });
  await workflow.addEvent(client, {
    bookingId: booking.id,
    type: event.type,
    actor,
    fromStatus: booking.status,
    toStatus: to,
    message: event.message,
    metadata: event.metadata,
  });
  booking.status = to;
}

// ---------- Create ----------

export async function createBooking(input: CreateBookingInput): Promise<BookingRecord> {
  if (input.idempotencyKey) {
    const existing = await bookings.findByIdempotencyKey(db, input.idempotencyKey);
    if (existing) return existing;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const id = await withTransaction(async (client) => {
        let destinationId: string | null = null;
        if (input.destinationType === "CATALOG") {
          // The catalog is managed in the admin (Content Management); the form submits the destination's slug
          const row = await bookings.activeDestinationId(client, input.destination ?? "");
          if (!row) throw new AppError("VALIDATION_FAILED", "Please choose a valid destination.", { destination: ["Unknown destination"] });
          if (!row.active) throw new AppError("VALIDATION_FAILED", "That destination is not available right now.", { destination: ["Unavailable"] });
          destinationId = row.id;
        }
        const customerId = await bookings.upsertCustomer(client, { name: input.name, email: input.email, whatsapp: input.whatsapp });
        const bookingId = await bookings.insertBooking(client, {
          reference: generateReference(),
          bookingType: input.bookingType,
          destinationType: input.destinationType,
          destinationId,
          customDestination: input.customDestination,
          travelDate: input.travelDate,
          pickupLocation: input.pickupLocation,
          passengers: input.passengers,
          notes: input.notes,
          vehicleCategory: input.vehicleCategory,
          customerId,
          idempotencyKey: input.idempotencyKey ?? null,
        });
        await workflow.addEvent(client, {
          bookingId,
          type: "BOOKING_CREATED",
          actor: { type: "CUSTOMER" },
          toStatus: "PENDING",
          message: "Booking request submitted",
        });
        return bookingId;
      });
      const booking = (await bookings.findBooking(db, id))!;
      notifyBookingCreated(booking);
      return booking;
    } catch (error) {
      const { code, constraint } = (error ?? {}) as DbError;
      if (code === "23505" && constraint === "bookings_reference_key") continue; // reference collision: retry with a new one
      if (code === "23505" && constraint === "bookings_idempotency_key_key" && input.idempotencyKey) {
        // The same form was submitted twice at once: return the booking the first request created
        const existing = await bookings.findByIdempotencyKey(db, input.idempotencyKey);
        if (existing) return existing;
      }
      throw error;
    }
  }
  throw new Error("Could not generate a unique booking reference");
}

// ---------- Read ----------

export async function listBookings(filters: bookings.ListFilters) {
  return bookings.listBookings(db, filters);
}

export async function getAdminBookingDetail(idOrReference: string) {
  const booking = await bookings.findBooking(db, idOrReference);
  if (!booking) throw notFound();
  const [events, quotations, payments, notifications, vehicles, drivers] = await Promise.all([
    workflow.listEvents(db, booking.id),
    workflow.listQuotations(db, booking.id),
    workflow.listPayments(db, booking.id),
    workflow.listNotifications(db, booking.id),
    resources.availableVehicles(db, booking.travelDate, booking.passengers, booking.id, booking.vehicleCategory),
    resources.availableDrivers(db, booking.travelDate, booking.id),
  ]);
  return { booking, events, quotations, payments, notifications, availability: { vehicles, drivers } };
}

export type CustomerBookingView = Awaited<ReturnType<typeof getCustomerBooking>>;

// What a customer may see with their private link: no other people's data, no internal history
export async function getCustomerBooking(reference: string, token: string | null | undefined) {
  if (!isValidCustomerToken(reference, token)) throw notFound();
  const booking = await bookings.findBooking(db, reference);
  if (!booking) throw notFound();
  const quotation =
    (await workflow.liveQuotation(db, booking.id)) ?? (await workflow.acceptedQuotation(db, booking.id));
  const payments = booking.status === "PAYMENT_PENDING" ? await workflow.listPayments(db, booking.id) : [];
  const assigned = ["CONFIRMED", "SCHEDULED", "COMPLETED"].includes(booking.status);
  return {
    reference: booking.reference,
    status: booking.status,
    bookingType: booking.bookingType,
    destination: booking.destinationName ?? booking.customDestination,
    travelDate: booking.travelDate,
    pickupLocation: booking.pickupLocation,
    passengers: booking.passengers,
    notes: booking.notes,
    customerName: booking.customer.name,
    canEdit: CUSTOMER_EDITABLE.includes(booking.status),
    vehicle: assigned ? booking.vehicleName : null,
    driver: assigned ? booking.driverName : null,
    quotation: quotation
      ? {
          status: quotation.status,
          total: quotation.totalAmount,
          baseAmount: quotation.baseAmount,
          additionalCharges: quotation.additionalCharges,
          currency: quotation.currency,
          includedServices: quotation.includedServices,
          notes: quotation.notes,
          validUntil: quotation.validUntil,
          expired: quotation.status === "SENT" && new Date(quotation.validUntil) < new Date(),
        }
      : null,
    paymentInstructions: payments.find((payment) => payment.status === "PENDING")?.instructions ?? null,
  };
}

// ---------- Updates ----------

type Changes = { pickupLocation?: string; passengers?: number; notes?: string | null; travelDate?: string };

export async function updateBooking(idOrReference: string, changes: Changes, actor: Actor): Promise<BookingRecord> {
  const updated = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (actor.type === "CUSTOMER" && !CUSTOMER_EDITABLE.includes(booking.status)) {
      throw invalidState("This request is already being processed. Please contact us to change it.");
    }
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") throw invalidState("This booking is closed and cannot be edited.");
    // An existing assignment must still fit the changed headcount. A changed date is checked by the double-booking indexes.
    if ((changes.passengers || changes.travelDate) && booking.vehicleId) {
      const vehicle = await resources.getVehicle(client, booking.vehicleId);
      try {
        assertVehicleFits(vehicle, booking, changes.passengers ?? booking.passengers);
      } catch (error) {
        if (error instanceof AppError) throw conflict(`${error.message} Change or clear the vehicle assignment first.`);
        throw error;
      }
    }
    try {
      await bookings.updateDetails(client, booking.id, changes);
    } catch (error) {
      rethrowDbConflict(error);
    }
    await workflow.addEvent(client, {
      bookingId: booking.id,
      type: "BOOKING_UPDATED",
      actor,
      message: `Updated: ${Object.keys(changes).join(", ")}`,
      metadata: changes,
    });
    return booking.id;
  });
  return (await bookings.findBooking(db, updated))!;
}

// Admin status change limited to MANUAL_TRANSITIONS; moves that carry data go through their own endpoints
export async function changeStatus(idOrReference: string, to: BookingStatus, note: string | null, actor: Actor): Promise<BookingRecord> {
  const booking = await withTransaction(async (client) => {
    const current = await lockBooking(client, idOrReference);
    if (!MANUAL_TRANSITIONS[current.status].includes(to)) {
      throw invalidState(
        `Status cannot be changed from ${current.status} to ${to} here. ${
          ["QUOTED", "QUOTE_ACCEPTED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "CONFIRMED", "SCHEDULED"].includes(to)
            ? "Use the quotation, payment or confirm action instead."
            : ""
        }`.trim(),
      );
    }
    if (to === "CANCELLED") await workflow.cancelOpenPayments(client, current.id);
    // A live quotation must not stay acceptable once the booking is reopened or cancelled
    if (to === "CANCELLED" || to === "UNDER_REVIEW") await workflow.supersedeLiveQuotation(client, current.id);
    await transition(client, current, to, actor, {
      type: to === "CANCELLED" ? "BOOKING_CANCELLED" : to === "UNDER_REVIEW" ? "BOOKING_REVIEWED" : "STATUS_CHANGED",
      message: note,
      cancelReason: to === "CANCELLED" ? (note ?? "Cancelled by admin") : null,
    });
    return current.id;
  });
  const result = (await bookings.findBooking(db, booking))!;
  if (to === "CANCELLED") notifyCancelled(result, result.cancelReason);
  return result;
}

// ---------- Availability and assignment ----------

const canAssignResources = (status: BookingStatus) => status !== "PENDING" && ACTIVE_STATUSES.includes(status);

export async function getAvailability(idOrReference: string) {
  const booking = await bookings.findBooking(db, idOrReference);
  if (!booking) throw notFound();
  const [vehicles, drivers] = await Promise.all([
    resources.availableVehicles(db, booking.travelDate, booking.passengers, booking.id, booking.vehicleCategory),
    resources.availableDrivers(db, booking.travelDate, booking.id),
  ]);
  return {
    booking: {
      reference: booking.reference,
      status: booking.status,
      customerName: booking.customer.name,
      travelDate: booking.travelDate,
      passengers: booking.passengers,
      vehicleCategory: booking.vehicleCategory,
      vehicleId: booking.vehicleId,
      driverId: booking.driverId,
      canAssign: canAssignResources(booking.status),
    },
    vehicles,
    drivers,
  };
}

export async function assignResources(
  idOrReference: string,
  input: { vehicleId?: string | null; driverId?: string | null },
  actor: Actor,
): Promise<BookingRecord> {
  const id = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    if (booking.status === "PENDING") throw invalidState("Start the review before assigning a vehicle or driver.");
    if (!canAssignResources(booking.status)) throw invalidState("Vehicles and drivers can only be assigned to open bookings under review.");

    const vehicleId = input.vehicleId === undefined ? booking.vehicleId : input.vehicleId;
    const driverId = input.driverId === undefined ? booking.driverId : input.driverId;

    if (vehicleId) {
      // Active, same category as requested, enough seats; the unique indexes below catch a date clash
      assertVehicleFits(await resources.getVehicle(client, vehicleId), booking, booking.passengers);
    }
    if (driverId) {
      const driver = await resources.getDriver(client, driverId);
      if (!driver || !driver.isActive) throw new AppError("VALIDATION_FAILED", "Choose an active driver.", { driverId: ["Unavailable driver"] });
    }
    try {
      // The partial unique indexes make a double booking impossible even if two admins race
      await bookings.setAssignment(client, booking.id, vehicleId, driverId);
    } catch (error) {
      rethrowDbConflict(error);
    }
    await workflow.addEvent(client, {
      bookingId: booking.id,
      type: "RESOURCES_ASSIGNED",
      actor,
      message: "Vehicle / driver assignment updated",
      metadata: { vehicleId, driverId },
    });
    return booking.id;
  });
  return (await bookings.findBooking(db, id))!;
}

// ---------- Delete ----------

// Soft delete: the booking disappears from the admin list but its quotations, payments, notifications and history stay.
// The audit event is written first, in the same transaction, so a deletion is never unrecorded.
export async function deleteBooking(idOrReference: string, actor: { type: "ADMIN"; id: string }): Promise<{ reference: string }> {
  return withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    await workflow.addEvent(client, {
      bookingId: booking.id,
      type: "BOOKING_DELETED",
      actor,
      fromStatus: booking.status,
      message: `Booking deleted by admin (was ${booking.status.toLowerCase().replace(/_/g, " ")})`,
      metadata: { vehicleId: booking.vehicleId, driverId: booking.driverId },
    });
    await bookings.markDeleted(client, booking.id);
    return { reference: booking.reference };
  });
}

// ---------- Alternatives ----------

export async function proposeAlternative(
  idOrReference: string,
  input: { message: string; proposedTravelDate?: string; proposedVehicleId?: string; proposedDestination?: string },
  actor: { type: "ADMIN"; id: string },
): Promise<BookingRecord> {
  const id = await withTransaction(async (client) => {
    const booking = await lockBooking(client, idOrReference);
    let destinationId: string | undefined;
    if (input.proposedDestination) {
      const row = await bookings.activeDestinationId(client, input.proposedDestination);
      if (!row?.active) throw new AppError("VALIDATION_FAILED", "Unknown destination.", { proposedDestination: ["Unknown destination"] });
      destinationId = row.id;
    }
    if (input.proposedVehicleId && !(await resources.getVehicle(client, input.proposedVehicleId))) {
      throw new AppError("VALIDATION_FAILED", "Unknown vehicle.", { proposedVehicleId: ["Unknown vehicle"] });
    }
    await workflow.addAlternative(client, {
      bookingId: booking.id,
      message: input.message,
      date: input.proposedTravelDate,
      vehicleId: input.proposedVehicleId,
      destinationId,
      adminId: actor.id,
    });
    await transition(client, booking, "ALTERNATIVE_PROPOSED", actor, { type: "ALTERNATIVE_PROPOSED", message: input.message });
    return booking.id;
  });
  const result = (await bookings.findBooking(db, id))!;
  notifyAlternative(result, input.message);
  return result;
}
