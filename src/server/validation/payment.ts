import { z } from "zod";
import { money, optionalText, text } from "./common";

export const paymentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("SEND_INSTRUCTIONS"),
    instructions: text("Payment instructions", 10, 3000),
  }),
  z.object({
    action: z.literal("RECORD_RECEIVED"),
    method: z.enum(["BANK_TRANSFER", "MBWAY", "CASH", "CARD_TERMINAL", "OTHER"]),
    amount: money("Amount received"),
    paymentReference: optionalText("Payment reference", 120),
    receivedAt: z.iso.datetime({ offset: true }).optional(),
    notes: optionalText("Notes", 1000),
    // The admin must explicitly confirm they checked the funds themselves
    verified: z.literal(true, { error: "Confirm that you verified the payment" }),
  }),
]);
