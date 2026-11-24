import { NextRequest } from "next/server";
import { getAdmin, requireAdmin } from "@/server/auth/session";
import { isValidCustomerToken } from "@/server/auth/tokens";
import { AppError, notFound } from "@/server/http/errors";
import { handle, ok, readJson } from "@/server/http/respond";
import * as bookingService from "@/server/services/booking.service";
import { adminUpdateSchema, customerUpdateSchema } from "@/server/validation/booking";

// Admins get the full record; customers get a private view when they present their booking-link token.
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) => {
  const { id } = await ctx.params;
  if (await getAdmin()) return ok(await bookingService.getAdminBookingDetail(id));
  const token = request.nextUrl.searchParams.get("t");
  if (!token) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  return ok(await bookingService.getCustomerBooking(id, token));
});

// Admins may correct any detail; customers may change pickup, passengers and notes while the request is unprocessed.
export const PATCH = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) => {
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (await getAdmin()) {
    const admin = await requireAdmin(request);
    const changes = adminUpdateSchema.parse(body);
    await bookingService.updateBooking(id, changes, { type: "ADMIN", id: admin.id });
    return ok(await bookingService.getAdminBookingDetail(id));
  }
  const { token, ...changes } = customerUpdateSchema.parse(body);
  if (!isValidCustomerToken(id, token)) throw notFound();
  await bookingService.updateBooking(id, changes, { type: "CUSTOMER" });
  return ok(await bookingService.getCustomerBooking(id, token));
});

// Admin only: soft-delete a booking. The row and its history are kept; it just leaves the admin list.
export const DELETE = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  return ok(await bookingService.deleteBooking(id, { type: "ADMIN", id: admin.id }));
});
