import type { Queryable } from "../db/pool";
import type { StoredImage } from "../cloudinary";
import type { DestinationInput, ExperienceInput, TierInput } from "../validation/content";

// Row shapes for the three managed content sections. Numeric columns come back from pg as strings, so they are converted here.
const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));

// ---------- Experiences ----------

export type ExperienceRecord = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  durationHours: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

const experience = (r: Record<string, unknown>): ExperienceRecord => ({
  id: r.id as string,
  title: r.title as string,
  description: r.description as string,
  price: num(r.price),
  durationHours: num(r.duration_hours),
  imageUrl: (r.image_url as string | null) ?? null,
  isFeatured: r.is_featured as boolean,
  isActive: r.is_active as boolean,
  sortOrder: r.sort_order as number,
});

export async function listExperiences(client: Queryable, { onlyActive = false } = {}): Promise<ExperienceRecord[]> {
  const { rows } = await client.query(`SELECT * FROM experiences ${onlyActive ? "WHERE is_active" : ""} ORDER BY sort_order, created_at`);
  return rows.map(experience);
}

export async function insertExperience(client: Queryable, input: ExperienceInput, image: StoredImage | null) {
  const { rows } = await client.query(
    `INSERT INTO experiences (title, description, price, duration_hours, image_url, image_public_id, is_featured, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [input.title, input.description, input.price, input.durationHours, image?.secureUrl ?? null, image?.publicId ?? null, input.isFeatured, input.isActive, input.sortOrder],
  );
  return experience(rows[0]);
}

// `oldPublicId` is the replaced picture; the caller deletes it from Cloudinary only after the transaction commits
export async function updateExperience(client: Queryable, id: string, input: ExperienceInput, image: StoredImage | null) {
  const current = await client.query("SELECT image_public_id FROM experiences WHERE id = $1 FOR UPDATE", [id]);
  if (!current.rows[0]) return undefined;
  const { rows } = await client.query(
    `UPDATE experiences SET title = $2, description = $3, price = $4, duration_hours = $5, is_featured = $6, is_active = $7, sort_order = $8,
       image_url = COALESCE($9, image_url), image_public_id = CASE WHEN $9::text IS NULL THEN image_public_id ELSE $10 END
     WHERE id = $1 RETURNING *`,
    [id, input.title, input.description, input.price, input.durationHours, input.isFeatured, input.isActive, input.sortOrder, image?.secureUrl ?? null, image?.publicId ?? null],
  );
  return { record: experience(rows[0]), oldPublicId: image ? (current.rows[0].image_public_id as string | null) : null };
}

export async function setExperienceActive(client: Queryable, id: string, isActive: boolean) {
  const { rows } = await client.query("UPDATE experiences SET is_active = $2 WHERE id = $1 RETURNING *", [id, isActive]);
  return rows[0] ? experience(rows[0]) : undefined;
}

export async function deleteExperience(client: Queryable, id: string) {
  const { rows } = await client.query("DELETE FROM experiences WHERE id = $1 RETURNING image_public_id", [id]);
  return rows[0] ? { oldPublicId: rows[0].image_public_id as string | null } : undefined;
}

// ---------- Destinations ----------

export type DestinationRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: "Lisbon" | "Coast" | "Centre" | "Alentejo" | "North";
  price: number;
  durationHours: number;
  lat: number;
  lon: number;
  mapLabel: string;
  labelSide: "left" | "right";
  mobileLabelDx: number;
  mobileLabelDy: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

const destination = (r: Record<string, unknown>): DestinationRecord => ({
  id: r.id as string,
  slug: r.slug as string,
  name: r.name as string,
  description: r.description as string,
  region: r.region as DestinationRecord["region"],
  price: Number(r.base_price),
  durationHours: r.duration_hours as number,
  lat: Number(r.lat),
  lon: Number(r.lon),
  mapLabel: r.map_label as string,
  labelSide: r.label_side as "left" | "right",
  mobileLabelDx: r.mobile_label_dx as number,
  mobileLabelDy: r.mobile_label_dy as number,
  imageUrl: (r.image_url as string | null) ?? null,
  isFeatured: r.is_featured as boolean,
  isActive: r.is_active as boolean,
  sortOrder: r.sort_order as number,
});

export async function listDestinations(client: Queryable, { onlyActive = false } = {}): Promise<DestinationRecord[]> {
  const { rows } = await client.query(`SELECT * FROM destinations ${onlyActive ? "WHERE is_active" : ""} ORDER BY sort_order, created_at`);
  return rows.map(destination);
}

export async function slugExists(client: Queryable, slug: string) {
  return (await client.query("SELECT 1 FROM destinations WHERE slug = $1", [slug])).rowCount! > 0;
}

// The slug is the public id (booking links, driving routes) and never changes after creation
export async function insertDestination(client: Queryable, slug: string, input: DestinationInput, image: StoredImage | null) {
  const { rows } = await client.query(
    `INSERT INTO destinations (slug, name, description, kind, base_price, region, map_label, duration_hours, lon, lat, label_side, mobile_label_dx, mobile_label_dy,
       image_url, image_public_id, is_featured, is_active, sort_order)
     VALUES ($1, $2, $3, 'TOUR', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [slug, input.name, input.description, input.price, input.region, input.mapLabel, input.durationHours, input.lon, input.lat, input.labelSide, input.mobileLabelDx, input.mobileLabelDy,
      image?.secureUrl ?? null, image?.publicId ?? null, input.isFeatured, input.isActive, input.sortOrder],
  );
  return destination(rows[0]);
}

export async function updateDestination(client: Queryable, id: string, input: DestinationInput, image: StoredImage | null) {
  const current = await client.query("SELECT image_public_id FROM destinations WHERE id = $1 FOR UPDATE", [id]);
  if (!current.rows[0]) return undefined;
  const { rows } = await client.query(
    `UPDATE destinations SET name = $2, description = $3, base_price = $4, region = $5, map_label = $6, duration_hours = $7, lon = $8, lat = $9,
       label_side = $10, mobile_label_dx = $11, mobile_label_dy = $12, is_featured = $13, is_active = $14, sort_order = $15,
       image_url = COALESCE($16, image_url), image_public_id = CASE WHEN $16::text IS NULL THEN image_public_id ELSE $17 END
     WHERE id = $1 RETURNING *`,
    [id, input.name, input.description, input.price, input.region, input.mapLabel, input.durationHours, input.lon, input.lat, input.labelSide, input.mobileLabelDx, input.mobileLabelDy,
      input.isFeatured, input.isActive, input.sortOrder, image?.secureUrl ?? null, image?.publicId ?? null],
  );
  return { record: destination(rows[0]), oldPublicId: image ? (current.rows[0].image_public_id as string | null) : null };
}

export async function setDestinationActive(client: Queryable, id: string, isActive: boolean) {
  const { rows } = await client.query("UPDATE destinations SET is_active = $2 WHERE id = $1 RETURNING *", [id, isActive]);
  return rows[0] ? destination(rows[0]) : undefined;
}

// Fails with a foreign-key error (23503) when bookings reference the destination; deactivate it instead
export async function deleteDestination(client: Queryable, id: string) {
  const { rows } = await client.query("DELETE FROM destinations WHERE id = $1 RETURNING image_public_id", [id]);
  return rows[0] ? { oldPublicId: rows[0].image_public_id as string | null } : undefined;
}

// The seeded experience and destination of the same name share one Cloudinary image, so it is only
// deleted once no row in either table still points at it
export async function isImageInUse(client: Queryable, publicId: string) {
  const { rows } = await client.query(
    "SELECT (EXISTS (SELECT 1 FROM experiences WHERE image_public_id = $1) OR EXISTS (SELECT 1 FROM destinations WHERE image_public_id = $1)) AS used",
    [publicId],
  );
  return rows[0].used as boolean;
}

// ---------- Pricing tiers ----------

export type TierRecord = {
  id: string;
  eyebrow: string;
  name: string;
  tagline: string;
  price: number;
  features: string[];
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

const tier = (r: Record<string, unknown>): TierRecord => ({
  id: r.id as string,
  eyebrow: r.eyebrow as string,
  name: r.name as string,
  tagline: r.tagline as string,
  price: Number(r.hourly_price),
  features: r.features as string[],
  isHighlighted: r.is_highlighted as boolean,
  isActive: r.is_active as boolean,
  sortOrder: r.sort_order as number,
});

export async function listTiers(client: Queryable, { onlyActive = false } = {}): Promise<TierRecord[]> {
  const { rows } = await client.query(`SELECT * FROM pricing_tiers ${onlyActive ? "WHERE is_active" : ""} ORDER BY sort_order, created_at`);
  return rows.map(tier);
}

export async function insertTier(client: Queryable, input: TierInput) {
  const { rows } = await client.query(
    `INSERT INTO pricing_tiers (eyebrow, name, tagline, hourly_price, features, is_highlighted, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [input.eyebrow, input.name, input.tagline, input.price, input.features, input.isHighlighted, input.isActive, input.sortOrder],
  );
  return tier(rows[0]);
}

export async function updateTier(client: Queryable, id: string, input: TierInput) {
  const { rows } = await client.query(
    `UPDATE pricing_tiers SET eyebrow = $2, name = $3, tagline = $4, hourly_price = $5, features = $6, is_highlighted = $7, is_active = $8, sort_order = $9
     WHERE id = $1 RETURNING *`,
    [id, input.eyebrow, input.name, input.tagline, input.price, input.features, input.isHighlighted, input.isActive, input.sortOrder],
  );
  return rows[0] ? tier(rows[0]) : undefined;
}

export async function setTierActive(client: Queryable, id: string, isActive: boolean) {
  const { rows } = await client.query("UPDATE pricing_tiers SET is_active = $2 WHERE id = $1 RETURNING *", [id, isActive]);
  return rows[0] ? tier(rows[0]) : undefined;
}

export async function deleteTier(client: Queryable, id: string) {
  return ((await client.query("DELETE FROM pricing_tiers WHERE id = $1", [id])).rowCount ?? 0) > 0;
}
