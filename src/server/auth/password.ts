import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Password hashing with Node's built-in scrypt (no extra dependency).
// Stored format: scrypt$<N>$<salt hex>$<hash hex>. Kept free of project imports so scripts can load it directly.

const KEY_LENGTH = 64;
const COST = 16384;

function derive(password: string, salt: Buffer, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: cost }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return `scrypt$${COST}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, cost, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !cost || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"), Number(cost));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
