import { NextRequest } from "next/server";
import { verifyPassword } from "@/server/auth/password";
import { startSession } from "@/server/auth/session";
import { db } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { clientIp, rateLimit } from "@/server/http/rateLimit";
import { handle, ok, readJson } from "@/server/http/respond";
import { loginSchema } from "@/server/validation/admin";

// Checked when the email is unknown so response time does not reveal which emails have accounts
const DUMMY_HASH = `scrypt$16384$${"0".repeat(32)}$${"0".repeat(128)}`;

export const POST = handle(async (request: NextRequest) => {
  rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000);
  const { email, password } = loginSchema.parse(await readJson(request));
  const { rows } = await db.query<{ id: string; password_hash: string; name: string }>(
    "SELECT id, password_hash, name FROM admin_users WHERE lower(email) = $1 AND is_active",
    [email],
  );
  const admin = rows[0];
  const valid = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !valid) throw new AppError("UNAUTHENTICATED", "Incorrect email or password.");
  await startSession(admin.id);
  return ok({ name: admin.name });
});
