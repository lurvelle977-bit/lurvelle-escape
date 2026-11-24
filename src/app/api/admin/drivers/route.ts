import { NextRequest } from "next/server";
import { deleteImage, uploadImage } from "@/server/cloudinary";
import { requireAdmin } from "@/server/auth/session";
import { db, withTransaction } from "@/server/db/pool";
import { AppError } from "@/server/http/errors";
import { handle, ok } from "@/server/http/respond";
import { getVehicle, insertDriver, listDrivers } from "@/server/repositories/resource.repository";
import { driverSchema } from "@/server/validation/admin";
import { readResourceInput } from "@/server/validation/upload";

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  return ok(await listDrivers(db));
});

export const POST = handle(async (request: NextRequest) => {
  await requireAdmin(request);
  const { fields, image } = await readResourceInput(request, "image", "Profile picture");
  const input = driverSchema.parse(fields);
  if (input.vehicleId && !(await getVehicle(db, input.vehicleId))) {
    throw new AppError("VALIDATION_FAILED", "Please check the highlighted fields.", { vehicleId: ["That vehicle no longer exists"] });
  }
  const stored = image ? await uploadImage(image, "resources/drivers") : null;
  try {
    return ok(await withTransaction((client) => insertDriver(client, input, stored)), 201);
  } catch (error) {
    await deleteImage(stored?.publicId);
    throw error;
  }
});
