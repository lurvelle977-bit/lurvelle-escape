import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db/pool";
import { notFound } from "@/server/http/errors";
import { handle } from "@/server/http/respond";
import { getImage } from "@/server/repositories/resource.repository";
import { uuid } from "@/server/validation/common";

// Vehicle and driver pictures. Admin-only because driver photos are personal data.
export const GET = handle(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(request);
  const parsed = uuid.safeParse((await params).id);
  const image = parsed.success ? await getImage(db, parsed.data) : null;
  if (!image) throw notFound("Image");
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Image ids are never reused, so the bytes behind a URL never change
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
});
