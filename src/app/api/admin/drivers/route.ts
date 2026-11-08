import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/pool";
import { handle, ok, readJson } from "@/server/http/respond";
import { insertDriver, listDrivers } from "@/server/repositories/resource.repository";
import { driverSchema } from "@/server/validation/admin";

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  return ok(await listDrivers(db));
});

export const POST = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  const input = driverSchema.parse(await readJson(request));
  return ok(await insertDriver(db, input), 201);
});
