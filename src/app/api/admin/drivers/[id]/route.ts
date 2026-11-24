import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { deleteImage, uploadImage } from "@/server/cloudinary";
import { withTransaction } from "@/server/db/pool";
import { AppError, conflict, notFound } from "@/server/http/errors";
import { handle, ok } from "@/server/http/respond";
import { deleteDriver, replaceDriverImage } from "@/server/repositories/resource.repository";
import { uuid } from "@/server/validation/common";
import { readResourceInput } from "@/server/validation/upload";

type Context = { params: Promise<{ id: string }> };

// Replaces the driver's profile picture. The old Cloudinary image is deleted only after the new one is saved.
export const PATCH = handle(async (request: NextRequest, { params }: Context) => {
  await requireAdmin(request);
  const id = uuid.parse((await params).id);
  const { image } = await readResourceInput(request, "image", "Profile picture");
  if (!image) throw new AppError("VALIDATION_FAILED", "Please check the highlighted fields.", { image: ["Choose a picture to upload"] });
  const stored = await uploadImage(image, "resources/drivers");
  try {
    const result = await withTransaction((client) => replaceDriverImage(client, id, stored));
    if (!result) throw notFound("Driver");
    await deleteImage(result.oldPublicId);
    return ok({ id });
  } catch (error) {
    await deleteImage(stored.publicId);
    throw error;
  }
});

// Permanently deletes the driver and, once that has committed, their Cloudinary picture
export const DELETE = handle(async (request: NextRequest, { params }: Context) => {
  await requireAdmin(request);
  const id = uuid.parse((await params).id);
  let result;
  try {
    result = await withTransaction((client) => deleteDriver(client, id));
  } catch (error) {
    if ((error as { code?: string }).code === "23503") throw conflict("This driver is used by bookings and cannot be deleted. Mark them inactive instead.");
    throw error;
  }
  if (!result) throw notFound("Driver");
  await deleteImage(result.oldPublicId);
  return ok({ id });
});
