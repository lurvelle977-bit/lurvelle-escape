import { z } from "zod";
import { VEHICLE_CATEGORY_KEYS, type VehicleCategory } from "@/lib/vehicleCategories";
import { BOOKING_STATUSES } from "../domain/status";
import { email, isoDate, optionalText, phone, text, todayIso, uuid } from "./common";

const BOOKING_TYPES = ["TOUR_PACKAGE", "VEHICLE_RIDE"] as const;

// The form posts lowercase values ("tour" / "vehicle", "catalog" / "custom"); accept those and the canonical ones.
const bookingType = z
  .string({ error: "Choose a booking type" })
  .transform((value) => value.trim().toUpperCase())
  .transform((value) => (value === "TOUR" ? "TOUR_PACKAGE" : value === "VEHICLE" || value === "RIDE" ? "VEHICLE_RIDE" : value))
  .pipe(z.enum(BOOKING_TYPES, { error: "Choose a booking type" }));

const destinationType = z
  .string({ error: "Choose a destination type" })
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.enum(["CATALOG", "CUSTOM"], { error: "Choose a destination type" }));

const futureDate = isoDate.refine((value) => value >= todayIso(), "Travel date cannot be in the past");

const passengers = z.coerce
  .number({ error: "Enter the number of passengers" })
  .int("Passengers must be a whole number")
  .min(1, "At least 1 passenger")
  .max(60, "For groups above 60 please contact us directly");

export const createBookingSchema = z
  .object({
    bookingType,
    destinationType,
    destination: z.string().trim().max(100).optional().nullable(),
    // Only the category is chosen by the customer; the admin assigns the actual vehicle
    vehicleCategory: z.string().trim().max(40).optional().nullable(),
    customDestination: optionalText("Custom destination", 500),
    travelDate: futureDate,
    pickupLocation: text("Pickup location", 2, 300),
    passengers,
    notes: optionalText("Notes", 2000),
    name: text("Name", 2, 120),
    email,
    whatsapp: phone,
    idempotencyKey: z.string().trim().min(8).max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.destinationType === "CATALOG" && !value.destination) {
      ctx.addIssue({ code: "custom", path: ["destination"], message: "Choose a destination" });
    }
    if (value.destinationType === "CUSTOM" && !value.customDestination) {
      ctx.addIssue({ code: "custom", path: ["customDestination"], message: "Describe your destination" });
    }
    if (value.bookingType === "VEHICLE_RIDE") {
      if (!value.vehicleCategory) {
        ctx.addIssue({ code: "custom", path: ["vehicleCategory"], message: "Choose a vehicle category" });
      } else if (!(VEHICLE_CATEGORY_KEYS as readonly string[]).includes(value.vehicleCategory)) {
        ctx.addIssue({ code: "custom", path: ["vehicleCategory"], message: "Choose a valid vehicle category" });
      }
    }
  })
  // Drop whichever destination field does not apply so nothing inconsistent reaches the database
  .transform((value) => ({
    ...value,
    destination: value.destinationType === "CATALOG" ? value.destination! : null,
    customDestination: value.destinationType === "CUSTOM" ? value.customDestination : null,
    // Tour packages never store a category, even if one was posted
    vehicleCategory: value.bookingType === "VEHICLE_RIDE" ? (value.vehicleCategory as VehicleCategory) : null,
  }));

export type CreateBookingInput = z.output<typeof createBookingSchema>;

// A blank filter control submits "", which means "no filter"
const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const listBookingsSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    status: z.preprocess(blankToUndefined, z.enum(BOOKING_STATUSES).optional()),
    type: z.preprocess(blankToUndefined, z.enum(BOOKING_TYPES).optional()),
    category: z.preprocess(blankToUndefined, z.enum(VEHICLE_CATEGORY_KEYS).optional()),
    assignment: z.preprocess(blankToUndefined, z.enum(["assigned", "unassigned"]).optional()),
    dates: z.preprocess(blankToUndefined, z.enum(["today", "upcoming", "past", "range"]).optional()),
    from: z.preprocess(blankToUndefined, isoDate.optional()),
    to: z.preprocess(blankToUndefined, isoDate.optional()),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, { message: "Start date must not be after end date", path: ["to"] });

// Fields a customer holding their private link may change while the request is still being reviewed
export const customerUpdateSchema = z
  .object({
    token: z.string().min(10).max(200),
    pickupLocation: text("Pickup location", 2, 300).optional(),
    passengers: passengers.optional(),
    notes: optionalText("Notes", 2000).optional(),
  })
  .strict();

// Admins may correct any customer-supplied detail
export const adminUpdateSchema = z
  .object({
    pickupLocation: text("Pickup location", 2, 300).optional(),
    passengers: passengers.optional(),
    notes: optionalText("Notes", 2000).optional(),
    travelDate: isoDate.optional(),
  })
  .strict();

export const statusChangeSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: optionalText("Note", 1000),
});

export const assignmentSchema = z.object({
  vehicleId: uuid.nullable().optional(),
  driverId: uuid.nullable().optional(),
});

export const alternativeSchema = z
  .object({
    message: text("Message", 5, 2000),
    proposedTravelDate: futureDate.optional(),
    proposedVehicleId: uuid.optional(),
    proposedDestination: z.string().trim().max(100).optional(),
  })
  .refine((value) => value.proposedTravelDate || value.proposedVehicleId || value.proposedDestination, {
    message: "Propose a new date, vehicle or destination",
    path: ["message"],
  });
