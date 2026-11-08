import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { handle, ok, readJson } from "@/server/http/respond";
import { recordPaymentReceived, sendPaymentInstructions } from "@/server/services/payment.service";
import { paymentActionSchema } from "@/server/validation/payment";

// Admin: send payment instructions, or record a manually verified payment
export const POST = handle(async (request: NextRequest, ctx: RouteContext<"/api/bookings/[id]/payment">) => {
  const admin = await requireAdmin(request);
  const { id } = await ctx.params;
  const input = paymentActionSchema.parse(await readJson(request));
  const booking =
    input.action === "SEND_INSTRUCTIONS"
      ? await sendPaymentInstructions(id, input.instructions, admin.id)
      : await recordPaymentReceived(id, input, admin.id);
  return ok({ reference: booking.reference, status: booking.status, paymentStatus: booking.paymentStatus });
});
