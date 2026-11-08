import { randomInt } from "node:crypto";

// Unambiguous characters only (no 0/O, 1/I). 31^8 combinations, so references are not guessable.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let code = "";
  for (let index = 0; index < 8; index += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return `LE-${code}`;
}

export const REFERENCE_PATTERN = /^LE-[A-HJ-NP-Z2-9]{8}$/;
