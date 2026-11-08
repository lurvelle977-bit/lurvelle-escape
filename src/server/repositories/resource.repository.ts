import type { Queryable } from "../db/pool";
import { ACTIVE_STATUSES } from "../domain/status";

export type VehicleRecord = { id: string; name: string; vehicleClass: string; plate: string; passengerCapacity: number; isActive: boolean };
export type DriverRecord = { id: string; name: string; phone: string; email: string | null; isActive: boolean };

const vehicle = (r: Record<string, unknown>): VehicleRecord => ({
  id: r.id as string,
  name: r.name as string,
  vehicleClass: r.vehicle_class as string,
  plate: r.plate as string,
  passengerCapacity: r.passenger_capacity as number,
  isActive: r.is_active as boolean,
});

const driver = (r: Record<string, unknown>): DriverRecord => ({
  id: r.id as string,
  name: r.name as string,
  phone: r.phone as string,
  email: r.email as string | null,
  isActive: r.is_active as boolean,
});

export async function listVehicles(client: Queryable): Promise<VehicleRecord[]> {
  return (await client.query("SELECT * FROM vehicles ORDER BY is_active DESC, name")).rows.map(vehicle);
}

export async function listDrivers(client: Queryable): Promise<DriverRecord[]> {
  return (await client.query("SELECT * FROM drivers ORDER BY is_active DESC, name")).rows.map(driver);
}

export async function insertVehicle(client: Queryable, v: { name: string; vehicleClass: string; plate: string; passengerCapacity: number }) {
  const { rows } = await client.query(
    "INSERT INTO vehicles (name, vehicle_class, plate, passenger_capacity) VALUES ($1, $2, $3, $4) RETURNING *",
    [v.name, v.vehicleClass, v.plate.toUpperCase(), v.passengerCapacity],
  );
  return vehicle(rows[0]);
}

export async function insertDriver(client: Queryable, d: { name: string; phone: string; email?: string }) {
  const { rows } = await client.query("INSERT INTO drivers (name, phone, email) VALUES ($1, $2, $3) RETURNING *", [d.name, d.phone, d.email ?? null]);
  return driver(rows[0]);
}

export async function getVehicle(client: Queryable, id: string): Promise<VehicleRecord | null> {
  const { rows } = await client.query("SELECT * FROM vehicles WHERE id = $1", [id]);
  return rows[0] ? vehicle(rows[0]) : null;
}

export async function getDriver(client: Queryable, id: string): Promise<DriverRecord | null> {
  const { rows } = await client.query("SELECT * FROM drivers WHERE id = $1", [id]);
  return rows[0] ? driver(rows[0]) : null;
}

// Active vehicles with enough seats that hold no other live booking on that date
export async function availableVehicles(client: Queryable, date: string, passengers: number, excludeBookingId: string) {
  const { rows } = await client.query(
    `SELECT v.* FROM vehicles v
     WHERE v.is_active AND v.passenger_capacity >= $2
       AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id = v.id AND b.travel_date = $1 AND b.id <> $3 AND b.status = ANY($4))
     ORDER BY v.passenger_capacity, v.name`,
    [date, passengers, excludeBookingId, ACTIVE_STATUSES],
  );
  return rows.map(vehicle);
}

export async function availableDrivers(client: Queryable, date: string, excludeBookingId: string) {
  const { rows } = await client.query(
    `SELECT d.* FROM drivers d
     WHERE d.is_active
       AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.driver_id = d.id AND b.travel_date = $1 AND b.id <> $2 AND b.status = ANY($3))
     ORDER BY d.name`,
    [date, excludeBookingId, ACTIVE_STATUSES],
  );
  return rows.map(driver);
}
