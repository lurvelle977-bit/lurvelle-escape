import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { handle, ok } from "@/server/http/respond";
import { confirmBooking } from "@/server/services/payment.service";

// Admin: confirm a paid booking (needs vehicle and driver); it becomes SCHEDULED and the customer is notified
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/confirm">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const booking = await confirmBooking(id, admin.id);
  return ok({ reference: booking.reference, status: booking.status });
});
