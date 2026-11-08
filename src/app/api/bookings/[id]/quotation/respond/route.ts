import { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/server/http/rateLimit";
import { handle, ok, readJson } from "@/server/http/respond";
import { respondToQuotation } from "@/server/services/quotation.service";
import { respondQuotationSchema } from "@/server/validation/quotation";

// Customer: accept or decline the quotation using the private booking-link token
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/quotation/respond">) => {
  rateLimit(`quote:${clientIp(request)}`, 20, 10 * 60 * 1000);
  const { id } = await ctx.params;
  const { token, decision } = respondQuotationSchema.parse(await readJson(request));
  const booking = await respondToQuotation(id, token, decision);
  return ok({ reference: booking.reference, status: booking.status });
});
