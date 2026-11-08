// Creates (or resets the password of) an admin account.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='a long passphrase' npm run admin:create
import pg from "pg";
import { hashPassword } from "../src/server/auth/password.ts";

const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, DATABASE_URL } = process.env;

if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) {
  console.error("Set DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD.");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? true : undefined });
await client.connect();
try {
  const hash = await hashPassword(ADMIN_PASSWORD);
  await client.query(
    `INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT ((lower(email))) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = true`,
    [ADMIN_EMAIL.trim(), ADMIN_NAME.trim(), hash],
  );
  console.log(`Admin ${ADMIN_EMAIL} is ready.`);
} finally {
  await client.end();
}
