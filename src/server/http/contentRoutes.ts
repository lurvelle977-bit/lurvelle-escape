import { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { requireAdmin } from "../auth/session";
import { activeSchema } from "../validation/content";
import { uuid } from "../validation/common";
import { readResourceInput, type ImageUpload } from "../validation/upload";
import { handle, ok } from "./respond";

type Context = { params: Promise<{ id: string }> };

type Config<Input, Record> = {
  schema: ZodType<Input, unknown>;
  // Label for validation messages; omit for sections without a picture
  imageLabel?: string;
  list: () => Promise<Record[]>;
  create: (input: Input, image: ImageUpload | null) => Promise<Record>;
  edit: (id: string, input: Input, image: ImageUpload | null) => Promise<Record>;
  toggle: (id: string, isActive: boolean) => Promise<Record>;
  remove: (id: string) => Promise<void>;
};

// The admin CRUD endpoints for one content section. Every handler requires an admin session (and, for writes, a same-origin request).
// POST/PATCH accept multipart (form with optional "image" file) or JSON; PATCH also accepts JSON { isActive } to activate/deactivate.
export function contentRoutes<Input, Record>(config: Config<Input, Record>) {
  const read = (request: NextRequest) => readResourceInput(request, "image", config.imageLabel ?? "Picture", { keepEmpty: true });

  return {
    GET: handle(async (request: NextRequest) => {
      await requireAdmin(request);
      return ok(await config.list());
    }),
    POST: handle(async (request: NextRequest) => {
      await requireAdmin(request);
      const { fields, image } = await read(request);
      return ok(await config.create(config.schema.parse(fields), image), 201);
    }),
    PATCH: handle(async (request: NextRequest, { params }: Context) => {
      await requireAdmin(request);
      const id = uuid.parse((await params).id);
      const { fields, image } = await read(request);
      // JSON { isActive } only: quick activate / deactivate from the list
      if (!image && fields && typeof fields === "object" && Object.keys(fields).length === 1 && "isActive" in fields) {
        return ok(await config.toggle(id, activeSchema.parse(fields).isActive));
      }
      return ok(await config.edit(id, config.schema.parse(fields), image));
    }),
    DELETE: handle(async (request: NextRequest, { params }: Context) => {
      await requireAdmin(request);
      await config.remove(uuid.parse((await params).id));
      return ok({ deleted: true });
    }),
  };
}
