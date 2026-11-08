import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/pool";
import { conflict } from "@/server/http/errors";
import { handle, ok, readJson } from "@/server/http/respond";
import { insertVehicle, listVehicles } from "@/server/repositories/resource.repository";
import { vehicleSchema } from "@/server/validation/admin";

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  return ok(await listVehicles(db));
});

export const POST = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  const input = vehicleSchema.parse(await readJson(request));
  try {
    return ok(await insertVehicle(db, input), 201);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw conflict("A vehicle with that plate already exists.");
    throw error;
  }
});
