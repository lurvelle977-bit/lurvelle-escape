import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/pool";
import { notFound } from "@/server/http/errors";
import { handle, ok, readJson } from "@/server/http/respond";
import { findBooking } from "@/server/repositories/booking.repository";
import { listQuotations } from "@/server/repositories/workflow.repository";
import { createQuotation } from "@/server/services/quotation.service";
import { createQuotationSchema } from "@/server/validation/quotation";

// Admin: every quotation version for the booking
export const GET = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/quotation">) => {
  await requireAdmin(request);
  const { id } = await ctx.params;
  const booking = await findBooking(db, id);
  if (!booking) throw notFound();
  return ok(await listQuotations(db, booking.id));
});

// Admin: create or revise the quotation and send it to the customer
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/quotation">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const input = createQuotationSchema.parse(await readJson(request));
  const { booking, quotation } = await createQuotation(id, input, admin.id);
  return ok({ reference: booking.reference, status: booking.status, quotation }, 201);
});
