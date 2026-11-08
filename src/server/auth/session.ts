import { cookies } from "next/headers";
import { db } from "../db/pool";
import { AppError } from "../http/errors";
import { env } from "../env";
import { signPayload, verifyPayload } from "./tokens";

export const SESSION_COOKIE = "le_admin";
const SESSION_SECONDS = 60 * 60 * 12;

export type AdminUser = { id: string; email: string; name: string };

type SessionPayload = { sub: string; exp: number };

export async function startSession(adminId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  (await cookies()).set(SESSION_COOKIE, signPayload({ sub: adminId, exp } satisfies SessionPayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Resolves the signed-in admin from the cookie, re-checking the database so deactivated accounts lose access at once
export async function getAdmin(): Promise<AdminUser | null> {
  const payload = verifyPayload<SessionPayload>((await cookies()).get(SESSION_COOKIE)?.value);
  if (!payload || payload.exp < Date.now() / 1000) return null;
  const { rows } = await db.query<AdminUser>("SELECT id, email, name FROM admin_users WHERE id = $1 AND is_active", [payload.sub]);
  return rows[0] ?? null;
}

// Guard for admin API routes. State-changing requests must also come from our own origin (CSRF defence in depth).
export async function requireAdmin(request: Request): Promise<AdminUser> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin && origin !== env.siteUrl) {
      throw new AppError("FORBIDDEN", "Cross-origin request blocked.");
    }
  }
  const admin = await getAdmin();
  if (!admin) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  return admin;
}
