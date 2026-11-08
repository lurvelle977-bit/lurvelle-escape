import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { handle, ok, readJson } from "@/server/http/respond";
import * as bookingService from "@/server/services/booking.service";
import { statusChangeSchema } from "@/server/validation/booking";

// Admin: simple status moves (start review, cancel, complete). Moves that carry data use their own endpoints.
export const PATCH = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/status">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const { status, note } = statusChangeSchema.parse(await readJson(request));
  const booking = await bookingService.changeStatus(id, status, note, { type: "ADMIN", id: admin.id });
  return ok({ reference: booking.reference, status: booking.status });
});
