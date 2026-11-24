import { AppError } from "../http/errors";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageUpload = { contentType: "image/jpeg" | "image/png" | "image/webp"; data: Buffer };

// The file type is decided from the file's own bytes, never from the client-supplied name or MIME type
function sniff(bytes: Buffer): ImageUpload["contentType"] | null {
  if (bytes.length > 12 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

// Returns null when no file was chosen; throws a field-level validation error for a bad file
export async function readImage(file: FormDataEntryValue | null | undefined, field: string, label: string): Promise<ImageUpload | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const fail = (message: string) => new AppError("VALIDATION_FAILED", "Please check the highlighted fields.", { [field]: [message] });
  if (file.size > MAX_IMAGE_BYTES) throw fail(`${label} must be 2 MB or smaller`);
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniff(data);
  if (!contentType) throw fail(`${label} must be a JPEG, PNG or WebP image`);
  return { contentType, data };
}

// Accepts multipart (with an optional image) or plain JSON, so API clients keep working
// keepEmpty: send blank text fields through (edit forms need to be able to clear a value)
export async function readResourceInput(request: Request, imageField: string, imageLabel: string, { keepEmpty = false } = {}) {
  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AppError("VALIDATION_FAILED", "Request body must be valid form data.");
    }
    const fields: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) if (typeof value === "string" && (keepEmpty || value !== "")) fields[key] = value;
    return { fields, image: await readImage(form.get(imageField), imageField, imageLabel) };
  }
  const body = await request.json().catch(() => {
    throw new AppError("VALIDATION_FAILED", "Request body must be valid JSON or form data.");
  });
  return { fields: body as unknown, image: null };
}
