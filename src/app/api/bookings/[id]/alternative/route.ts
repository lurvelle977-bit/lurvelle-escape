import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { handle, ok, readJson } from "@/server/http/respond";
import * as bookingService from "@/server/services/booking.service";
import { alternativeSchema } from "@/server/validation/booking";

// Admin: suggest another date, vehicle or destination; the customer is notified
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/alternative">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const input = alternativeSchema.parse(await readJson(request));
  const booking = await bookingService.proposeAlternative(id, input, { type: "ADMIN", id: admin.id });
  return ok({ reference: booking.reference, status: booking.status });
});
