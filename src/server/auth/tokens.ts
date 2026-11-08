import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env";

function sign(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Signed value of the form <base64url payload>.<signature>
export function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyPayload<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(signature, sign(body))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

// Customers have no accounts. Each booking has a private link token derived from its reference and the server secret,
// so nothing is stored and one customer's link cannot be used for another booking.
export function customerToken(reference: string): string {
  return sign(`customer:${reference}`);
}

export function isValidCustomerToken(reference: string, token: string | null | undefined): boolean {
  return Boolean(token) && safeEqual(token!, customerToken(reference));
}
