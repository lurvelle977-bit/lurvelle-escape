import { NextRequest } from "next/server";
import { deleteImage, uploadImage } from "@/server/cloudinary";
import { requireAdmin } from "@/server/auth/session";
import { db, withTransaction } from "@/server/db/pool";
import { conflict } from "@/server/http/errors";
import { handle, ok } from "@/server/http/respond";
import { insertVehicle, listVehicles } from "@/server/repositories/resource.repository";
import { vehicleSchema } from "@/server/validation/admin";
import { readResourceInput } from "@/server/validation/upload";

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  return ok(await listVehicles(db));
});

export const POST = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  const { fields, image } = await readResourceInput(request, "image", "Vehicle picture");
  const input = vehicleSchema.parse(fields);
  const stored = image ? await uploadImage(image, "resources/vehicles") : null;
  try {
    return ok(await withTransaction((client) => insertVehicle(client, input, stored)), 201);
  } catch (error) {
    // The database rejected the vehicle, so the freshly uploaded picture would be orphaned
    await deleteImage(stored?.publicId);
    if ((error as { code?: string }).code === "23505") throw conflict("A vehicle with that plate already exists.");
    throw error;
  }
});
