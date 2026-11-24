import type { Queryable } from "../db/pool";
import { ACTIVE_STATUSES } from "../domain/status";
import type { VehicleCategory } from "@/lib/vehicleCategories";
import type { StoredImage } from "../cloudinary";

export type VehicleRecord = { id: string; name: string; category: VehicleCategory; plate: string; passengerCapacity: number; isActive: boolean; imageUrl: string | null };
export type DriverRecord = { id: string; name: string; phone: string; email: string | null; isActive: boolean; imageUrl: string | null; vehicleId: string | null; vehicleName: string | null };

// Cloudinary pictures use their secure_url directly; rows from before the Cloudinary move still stream from our own endpoint
const imageUrl = (r: Record<string, unknown>) => (r.secure_url as string | null) ?? (r.image_legacy ? `/api/admin/images/${r.image_id}` : null);

const VEHICLE_SELECT = "SELECT v.*, i.secure_url, i.data IS NOT NULL AS image_legacy FROM vehicles v LEFT JOIN resource_images i ON i.id = v.image_id";
const DRIVER_SELECT =
  "SELECT d.*, v.name AS vehicle_name, i.secure_url, i.data IS NOT NULL AS image_legacy FROM drivers d LEFT JOIN vehicles v ON v.id = d.vehicle_id LEFT JOIN resource_images i ON i.id = d.image_id";

const vehicle = (r: Record<string, unknown>): VehicleRecord => ({
  id: r.id as string,
  name: r.name as string,
  category: r.category as VehicleCategory,
  plate: r.plate as string,
  passengerCapacity: r.passenger_capacity as number,
  isActive: r.is_active as boolean,
  imageUrl: imageUrl(r),
});

const driver = (r: Record<string, unknown>): DriverRecord => ({
  id: r.id as string,
  name: r.name as string,
  phone: r.phone as string,
  email: r.email as string | null,
  isActive: r.is_active as boolean,
  imageUrl: imageUrl(r),
  vehicleId: (r.vehicle_id as string | null) ?? null,
  vehicleName: (r.vehicle_name as string | null) ?? null,
});

export async function listVehicles(client: Queryable): Promise<VehicleRecord[]> {
  return (await client.query(`${VEHICLE_SELECT} ORDER BY v.is_active DESC, v.name`)).rows.map(vehicle);
}

export async function listDrivers(client: Queryable): Promise<DriverRecord[]> {
  return (await client.query(`${DRIVER_SELECT} ORDER BY d.is_active DESC, d.name`)).rows.map(driver);
}

async function insertImage(client: Queryable, image: StoredImage | null): Promise<string | null> {
  if (!image) return null;
  const { rows } = await client.query("INSERT INTO resource_images (secure_url, public_id) VALUES ($1, $2) RETURNING id", [image.secureUrl, image.publicId]);
  return rows[0].id as string;
}

// Legacy (pre-Cloudinary) pictures are still streamed from the database; admin-only
export async function getImage(client: Queryable, id: string) {
  const { rows } = await client.query("SELECT content_type, data FROM resource_images WHERE id = $1 AND data IS NOT NULL", [id]);
  return rows[0] ? { contentType: rows[0].content_type as string, data: rows[0].data as Buffer } : null;
}

// The image is already in Cloudinary when these run. Callers wrap them in a transaction and delete the
// Cloudinary asset themselves if the transaction fails.
export async function insertVehicle(client: Queryable, v: { name: string; category: VehicleCategory; plate: string; passengerCapacity: number }, image: StoredImage | null) {
  const imageId = await insertImage(client, image);
  const { rows } = await client.query(
    "INSERT INTO vehicles (name, category, plate, passenger_capacity, image_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [v.name, v.category, v.plate.toUpperCase(), v.passengerCapacity, imageId],
  );
  return (await getVehicle(client, rows[0].id))!;
}

export async function insertDriver(client: Queryable, d: { name: string; phone: string; email?: string; vehicleId?: string }, image: StoredImage | null) {
  const imageId = await insertImage(client, image);
  const { rows } = await client.query(
    "INSERT INTO drivers (name, phone, email, vehicle_id, image_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [d.name, d.phone, d.email ?? null, d.vehicleId ?? null, imageId],
  );
  return (await getDriver(client, rows[0].id))!;
}

type ResourceTable = "vehicles" | "drivers";

// Points the row at the new image and removes the old image row. Returns the old Cloudinary public_id to delete
// AFTER the transaction commits, or undefined when the row does not exist.
async function replaceImage(client: Queryable, table: ResourceTable, id: string, image: StoredImage): Promise<{ oldPublicId: string | null } | undefined> {
  const current = await client.query(`SELECT image_id FROM ${table} WHERE id = $1 FOR UPDATE`, [id]);
  if (!current.rows[0]) return undefined;
  const newImageId = await insertImage(client, image);
  await client.query(`UPDATE ${table} SET image_id = $2 WHERE id = $1`, [id, newImageId]);
  const old = current.rows[0].image_id as string | null;
  const removed = old ? await client.query("DELETE FROM resource_images WHERE id = $1 RETURNING public_id", [old]) : null;
  return { oldPublicId: (removed?.rows[0]?.public_id as string | null) ?? null };
}

async function deleteRow(client: Queryable, table: ResourceTable, id: string): Promise<{ oldPublicId: string | null } | undefined> {
  const { rows } = await client.query(`DELETE FROM ${table} WHERE id = $1 RETURNING image_id`, [id]);
  if (!rows[0]) return undefined;
  const removed = rows[0].image_id ? await client.query("DELETE FROM resource_images WHERE id = $1 RETURNING public_id", [rows[0].image_id]) : null;
  return { oldPublicId: (removed?.rows[0]?.public_id as string | null) ?? null };
}

export const replaceVehicleImage = (client: Queryable, id: string, image: StoredImage) => replaceImage(client, "vehicles", id, image);
export const replaceDriverImage = (client: Queryable, id: string, image: StoredImage) => replaceImage(client, "drivers", id, image);
export const deleteVehicle = (client: Queryable, id: string) => deleteRow(client, "vehicles", id);
export const deleteDriver = (client: Queryable, id: string) => deleteRow(client, "drivers", id);

export async function getVehicle(client: Queryable, id: string): Promise<VehicleRecord | null> {
  const { rows } = await client.query(`${VEHICLE_SELECT} WHERE v.id = $1`, [id]);
  return rows[0] ? vehicle(rows[0]) : null;
}

export async function getDriver(client: Queryable, id: string): Promise<DriverRecord | null> {
  const { rows } = await client.query(`${DRIVER_SELECT} WHERE d.id = $1`, [id]);
  return rows[0] ? driver(rows[0]) : null;
}

// Active vehicles with enough seats that hold no other live booking on that date
// When the booking asked for a vehicle category, only vehicles of that category are returned
export async function availableVehicles(client: Queryable, date: string, passengers: number, excludeBookingId: string, category: VehicleCategory | null = null) {
  const { rows } = await client.query(
    `${VEHICLE_SELECT}
     WHERE v.is_active AND v.passenger_capacity >= $2 AND ($5::text IS NULL OR v.category = $5)
       AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = v.id AND b.travel_date = $1 AND b.id <> $3 AND b.deleted_at IS NULL AND b.status = ANY($4))
     ORDER BY v.passenger_capacity, v.name`,
    [date, passengers, excludeBookingId, ACTIVE_STATUSES, category],
  );
  return rows.map(vehicle);
}

export async function availableDrivers(client: Queryable, date: string, excludeBookingId: string) {
  const { rows } = await client.query(
    `SELECT d.* FROM drivers d
     WHERE d.is_active
       AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.driver_id = d.id AND b.travel_date = $1 AND b.id <> $2 AND b.deleted_at IS NULL AND b.status = ANY($3))
     ORDER BY d.name`,
    [date, excludeBookingId, ACTIVE_STATUSES],
  );
  return rows.map(driver);
}
