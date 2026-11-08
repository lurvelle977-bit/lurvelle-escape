import type { Queryable } from "../db/pool";
import type { BookingStatus } from "../domain/status";

export type BookingRecord = {
  id: string;
  reference: string;
  bookingType: "TOUR_PACKAGE" | "VEHICLE_RIDE";
  destinationType: "CATALOG" | "CUSTOM";
  destinationId: string | null;
  destinationName: string | null;
  customDestination: string | null;
  travelDate: string;
  pickupLocation: string;
  passengers: number;
  notes: string | null;
  status: BookingStatus;
  quotedAmount: number | null;
  currency: string;
  paymentStatus: "NOT_REQUESTED" | "PENDING" | "RECEIVED";
  vehicleId: string | null;
  vehicleName: string | null;
  vehiclePlate: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  cancelReason: string | null;
  customer: { id: string; name: string; email: string; whatsapp: string };
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  reference: string;
  booking_type: BookingRecord["bookingType"];
  destination_type: BookingRecord["destinationType"];
  destination_id: string | null;
  destination_name: string | null;
  custom_destination: string | null;
  travel_date: string;
  pickup_location: string;
  passengers: number;
  notes: string | null;
  status: BookingStatus;
  quoted_amount: string | null;
  currency: string;
  payment_status: BookingRecord["paymentStatus"];
  vehicle_id: string | null;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  cancel_reason: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  created_at: Date;
  updated_at: Date;
};

const SELECT = `
  SELECT b.*, to_char(b.travel_date, 'YYYY-MM-DD') AS travel_date,
         c.name AS customer_name, c.email AS customer_email, c.whatsapp AS customer_whatsapp,
         d.name AS destination_name, v.name AS vehicle_name, v.plate AS vehicle_plate,
         dr.name AS driver_name, dr.phone AS driver_phone
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  LEFT JOIN destinations d ON d.id = b.destination_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  LEFT JOIN drivers dr ON dr.id = b.driver_id`;

function toRecord(row: Row): BookingRecord {
  return {
    id: row.id,
    reference: row.reference,
    bookingType: row.booking_type,
    destinationType: row.destination_type,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
    customDestination: row.custom_destination,
    travelDate: row.travel_date,
    pickupLocation: row.pickup_location,
    passengers: row.passengers,
    notes: row.notes,
    status: row.status,
    quotedAmount: row.quoted_amount === null ? null : Number(row.quoted_amount),
    currency: row.currency,
    paymentStatus: row.payment_status,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    vehiclePlate: row.vehicle_plate,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    cancelReason: row.cancel_reason,
    customer: { id: row.customer_id, name: row.customer_name, email: row.customer_email, whatsapp: row.customer_whatsapp },
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Finds a booking by uuid or by its public reference. Pass lock=true inside a transaction to serialise changes.
export async function findBooking(client: Queryable, idOrReference: string, lock = false): Promise<BookingRecord | null> {
  const column = UUID.test(idOrReference) ? "b.id" : "b.reference";
  // FOR UPDATE OF b locks only the booking row, not the joined lookups
  const { rows } = await client.query<Row>(`${SELECT} WHERE ${column} = $1 ${lock ? "FOR UPDATE OF b" : ""}`, [idOrReference]);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findByIdempotencyKey(client: Queryable, key: string): Promise<BookingRecord | null> {
  const { rows } = await client.query<Row>(`${SELECT} WHERE b.idempotency_key = $1`, [key]);
  return rows[0] ? toRecord(rows[0]) : null;
}

export type ListFilters = { q?: string; status?: BookingStatus; type?: BookingRecord["bookingType"]; page: number; pageSize: number };

export async function listBookings(client: Queryable, filters: ListFilters) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (filters.status) where.push(`b.status = $${values.push(filters.status)}`);
  if (filters.type) where.push(`b.booking_type = $${values.push(filters.type)}`);
  if (filters.q) {
    // Reference, customer name or email; LIKE wildcards in user input are escaped
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    const index = values.push(pattern);
    where.push(`(b.reference ILIKE $${index} OR c.name ILIKE $${index} OR c.email ILIKE $${index})`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = Number(
    (await client.query<{ count: string }>(`SELECT count(*) FROM bookings b JOIN customers c ON c.id = b.customer_id ${clause}`, values)).rows[0].count,
  );
  const limit = values.push(filters.pageSize);
  const offset = values.push((filters.page - 1) * filters.pageSize);
  const { rows } = await client.query<Row>(`${SELECT} ${clause} ORDER BY b.created_at DESC LIMIT $${limit} OFFSET $${offset}`, values);
  return { items: rows.map(toRecord), total, page: filters.page, pageSize: filters.pageSize };
}

export async function upsertCustomer(client: Queryable, input: { name: string; email: string; whatsapp: string }): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO customers (name, email, whatsapp) VALUES ($1, $2, $3)
     ON CONFLICT ((lower(email))) DO UPDATE SET name = EXCLUDED.name, whatsapp = EXCLUDED.whatsapp
     RETURNING id`,
    [input.name, input.email, input.whatsapp],
  );
  return rows[0].id;
}

export async function upsertDestination(
  client: Queryable,
  input: { slug: string; name: string; description: string; basePrice: number },
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO destinations (slug, name, description, base_price) VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, base_price = EXCLUDED.base_price
     RETURNING id`,
    [input.slug, input.name, input.description, input.basePrice],
  );
  return rows[0].id;
}

export async function activeDestinationId(client: Queryable, slug: string): Promise<{ id: string; active: boolean } | null> {
  const { rows } = await client.query<{ id: string; is_active: boolean }>("SELECT id, is_active FROM destinations WHERE slug = $1", [slug]);
  return rows[0] ? { id: rows[0].id, active: rows[0].is_active } : null;
}

export async function insertBooking(
  client: Queryable,
  input: {
    reference: string;
    bookingType: string;
    destinationType: string;
    destinationId: string | null;
    customDestination: string | null;
    travelDate: string;
    pickupLocation: string;
    passengers: number;
    notes: string | null;
    customerId: string;
    idempotencyKey: string | null;
  },
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO bookings (reference, booking_type, destination_type, destination_id, custom_destination, travel_date,
                           pickup_location, passengers, notes, customer_id, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [
      input.reference,
      input.bookingType,
      input.destinationType,
      input.destinationId,
      input.customDestination,
      input.travelDate,
      input.pickupLocation,
      input.passengers,
      input.notes,
      input.customerId,
      input.idempotencyKey,
    ],
  );
  return rows[0].id;
}

export async function setStatus(client: Queryable, id: string, status: BookingStatus, extra: { cancelReason?: string | null } = {}) {
  await client.query("UPDATE bookings SET status = $2, cancel_reason = COALESCE($3, cancel_reason) WHERE id = $1", [
    id,
    status,
    extra.cancelReason ?? null,
  ]);
}

export async function updateDetails(
  client: Queryable,
  id: string,
  changes: { pickupLocation?: string; passengers?: number; notes?: string | null; travelDate?: string },
) {
  await client.query(
    `UPDATE bookings SET
       pickup_location = COALESCE($2, pickup_location),
       passengers      = COALESCE($3, passengers),
       notes           = CASE WHEN $4::boolean THEN $5 ELSE notes END,
       travel_date     = COALESCE($6, travel_date)
     WHERE id = $1`,
    [id, changes.pickupLocation ?? null, changes.passengers ?? null, changes.notes !== undefined, changes.notes ?? null, changes.travelDate ?? null],
  );
}

export async function setAssignment(client: Queryable, id: string, vehicleId: string | null, driverId: string | null) {
  await client.query("UPDATE bookings SET vehicle_id = $2, driver_id = $3 WHERE id = $1", [id, vehicleId, driverId]);
}

export async function setQuote(client: Queryable, id: string, amount: number, currency: string) {
  await client.query("UPDATE bookings SET quoted_amount = $2, currency = $3 WHERE id = $1", [id, amount, currency]);
}

export async function setPaymentStatus(client: Queryable, id: string, status: BookingRecord["paymentStatus"]) {
  await client.query("UPDATE bookings SET payment_status = $2 WHERE id = $1", [id, status]);
}
