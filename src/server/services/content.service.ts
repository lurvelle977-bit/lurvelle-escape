import { revalidateTag, unstable_cache } from "next/cache";
import type { Experience, Tour } from "@/content/tours";
import type { Tier } from "@/content/tiers";
import { deleteImage, uploadImage, type ImageFolder, type StoredImage } from "../cloudinary";
import { db, withTransaction } from "../db/pool";
import { conflict, notFound } from "../http/errors";
import * as repo from "../repositories/content.repository";
import type { DestinationInput, ExperienceInput, TierInput } from "../validation/content";
import type { ImageUpload } from "../validation/upload";

// ---------- Public reads (cached, invalidated by the admin mutations below) ----------
// Pages that call these are served from the cache; `revalidate` is only a safety net for edits made outside the admin.

const CACHE_SECONDS = 3600;

export const getHomeExperiences = unstable_cache(
  async (): Promise<Experience[]> =>
    (await repo.listExperiences(db, { onlyActive: true })).map((e) => ({
      id: e.id,
      name: e.title,
      blurb: e.description,
      cost: e.price,
      durationHours: e.durationHours,
      image: e.imageUrl,
      featured: e.isFeatured,
    })),
  ["public-experiences"],
  { tags: ["experiences"], revalidate: CACHE_SECONDS },
);

export const getPublicDestinations = unstable_cache(
  async (): Promise<{ tours: Tour[]; defaultId: string | null }> => {
    const rows = await repo.listDestinations(db, { onlyActive: true });
    const tours = rows.map<Tour>((d) => ({
      id: d.slug,
      name: d.name,
      mapLabel: d.mapLabel,
      durationHours: d.durationHours,
      cost: d.price,
      image: d.imageUrl,
      blurb: d.description,
      region: d.region,
      lon: d.lon,
      lat: d.lat,
      labelSide: d.labelSide,
      mobileLabel: { dx: d.mobileLabelDx, dy: d.mobileLabelDy },
    }));
    // The page opens on the first featured destination
    return { tours, defaultId: rows.find((d) => d.isFeatured)?.slug ?? tours[0]?.id ?? null };
  },
  ["public-destinations"],
  { tags: ["destinations"], revalidate: CACHE_SECONDS },
);

const formatTierPrice = (price: number) => `€${Number.isInteger(price) ? price : price.toFixed(2)}`;

export const getHomeTiers = unstable_cache(
  async (): Promise<Tier[]> =>
    (await repo.listTiers(db, { onlyActive: true })).map((t) => ({
      eyebrow: t.eyebrow,
      name: t.name,
      tag: t.tagline,
      price: formatTierPrice(t.price),
      highlighted: t.isHighlighted,
      features: t.features,
    })),
  ["public-tiers"],
  { tags: ["tiers"], revalidate: CACHE_SECONDS },
);

// Expire immediately so the admin sees their change on the next page load
const expire = (...tags: ("experiences" | "destinations" | "tiers")[]) => tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));

// ---------- Cloudinary helpers ----------

// Uploads first, then runs the database work; if that fails the fresh upload is removed again
async function withUpload<T>(image: ImageUpload | null, folder: ImageFolder, run: (stored: StoredImage | null) => Promise<T>): Promise<T> {
  const stored = image ? await uploadImage(image, folder) : null;
  try {
    return await run(stored);
  } catch (error) {
    await deleteImage(stored?.publicId);
    throw error;
  }
}

// Called only after the database change committed. Seeded rows share images, so keep any image still in use.
async function releaseImage(publicId: string | null | undefined) {
  if (publicId && !(await repo.isImageInUse(db, publicId))) await deleteImage(publicId);
}

const foreignKey = (error: unknown) => (error as { code?: string }).code === "23503";

// ---------- Experiences ----------

export async function createExperience(input: ExperienceInput, image: ImageUpload | null) {
  const record = await withUpload(image, "public/images/experiences", (stored) => withTransaction((client) => repo.insertExperience(client, input, stored)));
  expire("experiences");
  return record;
}

export async function editExperience(id: string, input: ExperienceInput, image: ImageUpload | null) {
  // A missing row throws inside withUpload so a freshly uploaded picture is cleaned up
  const result = await withUpload(image, "public/images/experiences", async (stored) => {
    const updated = await withTransaction((client) => repo.updateExperience(client, id, input, stored));
    if (!updated) throw notFound("Experience");
    return updated;
  });
  expire("experiences");
  await releaseImage(result.oldPublicId);
  return result.record;
}

export async function toggleExperience(id: string, isActive: boolean) {
  const record = await repo.setExperienceActive(db, id, isActive);
  if (!record) throw notFound("Experience");
  expire("experiences");
  return record;
}

export async function removeExperience(id: string) {
  const result = await withTransaction((client) => repo.deleteExperience(client, id));
  if (!result) throw notFound("Experience");
  expire("experiences");
  await releaseImage(result.oldPublicId);
}

// ---------- Destinations ----------

const slugify = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "destination";

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let n = 1; n < 50; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await repo.slugExists(db, slug))) return slug;
  }
  throw conflict("Could not generate a unique id for that name. Try a different name.");
}

export async function createDestination(input: DestinationInput, image: ImageUpload | null) {
  const slug = await uniqueSlug(input.name);
  const record = await withUpload(image, "public/images/destinations", (stored) =>
    withTransaction((client) => repo.insertDestination(client, slug, { ...input, mapLabel: input.mapLabel || input.name.toUpperCase().slice(0, 30) }, stored)),
  );
  expire("destinations");
  return record;
}

export async function editDestination(id: string, input: DestinationInput, image: ImageUpload | null) {
  const result = await withUpload(image, "public/images/destinations", async (stored) => {
    const updated = await withTransaction((client) => repo.updateDestination(client, id, { ...input, mapLabel: input.mapLabel || input.name.toUpperCase().slice(0, 30) }, stored));
    if (!updated) throw notFound("Destination");
    return updated;
  });
  expire("destinations");
  await releaseImage(result.oldPublicId);
  return result.record;
}

export async function toggleDestination(id: string, isActive: boolean) {
  const record = await repo.setDestinationActive(db, id, isActive);
  if (!record) throw notFound("Destination");
  expire("destinations");
  return record;
}

export async function removeDestination(id: string) {
  let result;
  try {
    result = await withTransaction((client) => repo.deleteDestination(client, id));
  } catch (error) {
    if (foreignKey(error)) throw conflict("Bookings reference this destination, so it cannot be deleted. Deactivate it instead.");
    throw error;
  }
  if (!result) throw notFound("Destination");
  expire("destinations");
  await releaseImage(result.oldPublicId);
}

// ---------- Pricing tiers ----------

export async function createTier(input: TierInput) {
  const record = await repo.insertTier(db, input);
  expire("tiers");
  return record;
}

export async function editTier(id: string, input: TierInput) {
  const record = await repo.updateTier(db, id, input);
  if (!record) throw notFound("Tier");
  expire("tiers");
  return record;
}

export async function toggleTier(id: string, isActive: boolean) {
  const record = await repo.setTierActive(db, id, isActive);
  if (!record) throw notFound("Tier");
  expire("tiers");
  return record;
}

export async function removeTier(id: string) {
  if (!(await repo.deleteTier(db, id))) throw notFound("Tier");
  expire("tiers");
}
