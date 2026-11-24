import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { deleteImage, uploadImage } from "@/server/cloudinary";
import { withTransaction } from "@/server/db/pool";
import { AppError, conflict, notFound } from "@/server/http/errors";
import { handle, ok } from "@/server/http/respond";
import { deleteVehicle, replaceVehicleImage } from "@/server/repositories/resource.repository";
import { uuid } from "@/server/validation/common";
import { readResourceInput } from "@/server/validation/upload";

type Context = { params: Promise<{ id: string }> };

// Replaces the vehicle's picture. The old Cloudinary image is deleted only after the new one is saved.
export const PATCH = handle(async (request: NextRequest, { params }: Context) => {
  await requireAdmin(request);
  const id = uuid.parse((await params).id);
  const { image } = await readResourceInput(request, "image", "Vehicle picture");
  if (!image) throw new AppError("VALIDATION_FAILED", "Please check the highlighted fields.", { image: ["Choose a picture to upload"] });
  const stored = await uploadImage(image, "resources/vehicles");
  try {
    const result = await withTransaction((client) => replaceVehicleImage(client, id, stored));
    if (!result) throw notFound("Vehicle");
    await deleteImage(result.oldPublicId);
    return ok({ id });
  } catch (error) {
    await deleteImage(stored.publicId);
    throw error;
  }
});

// Permanently deletes the vehicle and, once that has committed, its Cloudinary picture
export const DELETE = handle(async (request: NextRequest, { params }: Context) => {
  await requireAdmin(request);
  const id = uuid.parse((await params).id);
  let result;
  try {
    result = await withTransaction((client) => deleteVehicle(client, id));
  } catch (error) {
    if ((error as { code?: string }).code === "23503") throw conflict("This vehicle is used by bookings and cannot be deleted. Mark it inactive instead.");
    throw error;
  }
  if (!result) throw notFound("Vehicle");
  await deleteImage(result.oldPublicId);
  return ok({ id });
});
