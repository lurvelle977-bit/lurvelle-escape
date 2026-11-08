import { NextRequest } from "next/server";
import { customerToken } from "@/server/auth/tokens";
import { requireAdmin } from "@/server/auth/session";
import { env } from "@/server/env";
import { clientIp, rateLimit } from "@/server/http/rateLimit";
import { handle, ok, readJson } from "@/server/http/respond";
import * as bookingService from "@/server/services/booking.service";
import { createBookingSchema, listBookingsSchema } from "@/server/validation/booking";

// Public: a customer submits a booking request. It is saved as PENDING and awaits admin review.
export const POST = handle(async (request: NextRequest) => {
  const input = createBookingSchema.parse(await readJson(request));
  // Only well-formed submissions count, so a customer fixing typos is never throttled
  rateLimit(`booking:${clientIp(request)}`, env.bookingRateLimit, 10 * 60 * 1000);
  const booking = await bookingService.createBooking(input);
  return ok(
    {
      reference: booking.reference,
      status: booking.status,
      bookingType: booking.bookingType,
      destination: booking.destinationName ?? booking.customDestination,
      travelDate: booking.travelDate,
      // The customer's private link for following the request and answering the quotation
      trackingPath: `/booking/${booking.reference}?t=${customerToken(booking.reference)}`,
    },
    201,
  );
});

// Admin: paginated list with status / type filters and search by reference, name or email
export const GET = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  const filters = listBookingsSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return ok(await bookingService.listBookings(filters));
});
