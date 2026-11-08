// Normalises a phone number to E.164 (+<country code><number>). Returns null when it cannot be valid.
// A country code is required so WhatsApp can route the message.
export function normalizePhone(input: string): string | null {
  let value = input.trim().replace(/[\s().-]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  return /^\+[1-9]\d{7,14}$/.test(value) ? value : null;
}
