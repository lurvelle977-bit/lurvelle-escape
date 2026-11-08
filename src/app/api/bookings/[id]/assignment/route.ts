import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { handle, ok, readJson } from "@/server/http/respond";
import * as bookingService from "@/server/services/booking.service";
import { assignmentSchema } from "@/server/validation/booking";

// Admin: vehicles and drivers free on the booking's date with enough seats
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/assignment">) => {
  await requireAdmin(request);
  const { id } = await ctx.params;
  return ok(await bookingService.getAvailability(id));
});

// Admin: assign (or clear) the vehicle and driver; double bookings are rejected with 409
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/assignment">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const input = assignmentSchema.parse(await readJson(request));
  const booking = await bookingService.assignResources(id, input, { type: "ADMIN", id: admin.id });
  return ok({ reference: booking.reference, vehicleId: booking.vehicleId, driverId: booking.driverId });
});
