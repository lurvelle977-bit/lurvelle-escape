import { z } from "zod";
import { currency, money, optionalText, text } from "./common";

export const createQuotationSchema = z.object({
  amount: money("Amount"),
  additionalCharges: money("Additional charges", { allowZero: true }).default(0),
  currency,
  includedServices: text("Included services", 3, 2000),
  notes: optionalText("Notes", 2000),
  validDays: z.number().int().min(1).max(60).default(7),
});

// The customer only says accept or reject; the amount always comes from the stored quotation
export const respondQuotationSchema = z.object({
  token: z.string().min(10).max(200),
  decision: z.enum(["ACCEPT", "REJECT"]),
});
