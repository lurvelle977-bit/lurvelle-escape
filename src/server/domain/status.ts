// Single source of truth for booking statuses and which transitions are allowed.

export const BOOKING_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "ALTERNATIVE_PROPOSED",
  "QUOTED",
  "QUOTE_ACCEPTED",
  "QUOTE_REJECTED",
  "PAYMENT_PENDING",
  "PAYMENT_RECEIVED",
  "CONFIRMED",
  "SCHEDULED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Every legal move. Dedicated endpoints (quotation, payment, confirm) perform the moves a plain status change may not.
export const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["ALTERNATIVE_PROPOSED", "QUOTED", "CANCELLED"],
  ALTERNATIVE_PROPOSED: ["UNDER_REVIEW", "QUOTED", "CANCELLED"],
  QUOTED: ["QUOTE_ACCEPTED", "QUOTE_REJECTED", "UNDER_REVIEW", "CANCELLED"],
  QUOTE_ACCEPTED: ["PAYMENT_PENDING", "CANCELLED"],
  QUOTE_REJECTED: ["UNDER_REVIEW", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_RECEIVED", "CANCELLED"],
  PAYMENT_RECEIVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

// Moves an admin may request directly through PATCH /status. Everything else needs its own endpoint
// because it carries data (a quotation, a payment record) that must be validated and stored with it.
export const MANUAL_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["CANCELLED"],
  ALTERNATIVE_PROPOSED: ["UNDER_REVIEW", "CANCELLED"],
  QUOTED: ["UNDER_REVIEW", "CANCELLED"],
  QUOTE_ACCEPTED: ["CANCELLED"],
  QUOTE_REJECTED: ["UNDER_REVIEW", "CANCELLED"],
  PAYMENT_PENDING: ["CANCELLED"],
  PAYMENT_RECEIVED: ["CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  SCHEDULED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

// Statuses in which a vehicle/driver is held for the travel date (mirrors the partial unique indexes)
export const ACTIVE_STATUSES: readonly BookingStatus[] = [
  "UNDER_REVIEW",
  "ALTERNATIVE_PROPOSED",
  "QUOTED",
  "QUOTE_ACCEPTED",
  "PAYMENT_PENDING",
  "PAYMENT_RECEIVED",
  "CONFIRMED",
  "SCHEDULED",
];

// Customers may still edit their request until the admin has started quoting
export const CUSTOMER_EDITABLE: readonly BookingStatus[] = ["PENDING", "UNDER_REVIEW"];

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
