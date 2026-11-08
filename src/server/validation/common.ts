import { z } from "zod";
import { cleanText } from "../domain/text";
import { normalizePhone } from "../domain/phone";

export const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .transform(cleanText)
    .pipe(z.string().min(min, `${label} is required`).max(max, `${label} must be at most ${max} characters`));

export const optionalText = (label: string, max: number) =>
  z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value ? cleanText(value) : ""))
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .transform((value) => value || null);

export const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Enter a valid email address"));

export const phone = z
  .string({ error: "WhatsApp number is required" })
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid number with country code, e.g. +351 912 345 678" });
      return z.NEVER;
    }
    return normalized;
  });

export const uuid = z.uuid("Invalid id");

export const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
  .default("EUR");

// Money is accepted as a number with at most 2 decimals and stored as numeric(12,2)
export const money = (label: string, { allowZero = false } = {}) =>
  z
    .number({ error: `${label} must be a number` })
    .finite()
    .refine((value) => (allowZero ? value >= 0 : value > 0), `${label} must be ${allowZero ? "zero or more" : "greater than zero"}`)
    .max(1_000_000, `${label} is too large`)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, `${label} can have at most 2 decimals`);

// yyyy-mm-dd, a real calendar date
export const isoDate = z
  .string({ error: "Date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "Enter a valid date");

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
