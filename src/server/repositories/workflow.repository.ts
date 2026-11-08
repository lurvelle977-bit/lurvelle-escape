import type { Queryable } from "../db/pool";

// ---------- Activity history ----------

export type EventInput = {
  bookingId: string;
  type: string;
  actor: { type: "CUSTOMER" | "ADMIN" | "SYSTEM"; id?: string };
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
};

export async function addEvent(client: Queryable, event: EventInput) {
  await client.query(
    `INSERT INTO booking_events (booking_id, event_type, from_status, to_status, actor_type, actor_id, message, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      event.bookingId,
      event.type,
      event.fromStatus ?? null,
      event.toStatus ?? null,
      event.actor.type,
      event.actor.id ?? null,
      event.message ?? null,
      event.metadata ? JSON.stringify(event.metadata) : null,
    ],
  );
}

export type EventRecord = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorType: string;
  actorName: string | null;
  message: string | null;
  createdAt: string;
};

export async function listEvents(client: Queryable, bookingId: string): Promise<EventRecord[]> {
  const { rows } = await client.query(
    `SELECT e.id, e.event_type, e.from_status, e.to_status, e.actor_type, a.name AS actor_name, e.message, e.created_at
     FROM booking_events e LEFT JOIN admin_users a ON a.id = e.actor_id
     WHERE e.booking_id = $1 ORDER BY e.created_at, e.id`,
    [bookingId],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.event_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorType: row.actor_type,
    actorName: row.actor_name,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  }));
}

// ---------- Alternatives ----------

export async function addAlternative(
  client: Queryable,
  input: { bookingId: string; message: string; date?: string; vehicleId?: string; destinationId?: string; adminId: string },
) {
  await client.query(
    `INSERT INTO booking_alternatives (booking_id, message, proposed_travel_date, proposed_vehicle_id, proposed_destination_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [input.bookingId, input.message, input.date ?? null, input.vehicleId ?? null, input.destinationId ?? null, input.adminId],
  );
}

// ---------- Quotations ----------

export type QuotationRecord = {
  id: string;
  bookingId: string;
  version: number;
  baseAmount: number;
  additionalCharges: number;
  totalAmount: number;
  currency: string;
  includedServices: string;
  notes: string | null;
  validUntil: string;
  status: "SENT" | "ACCEPTED" | "REJECTED" | "SUPERSEDED";
  createdAt: string;
  respondedAt: string | null;
};

function toQuotation(row: Record<string, unknown>): QuotationRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    bookingId: r.booking_id as string,
    version: r.version as number,
    baseAmount: Number(r.base_amount),
    additionalCharges: Number(r.additional_charges),
    totalAmount: Number(r.total_amount),
    currency: r.currency as string,
    includedServices: r.included_services as string,
    notes: r.notes as string | null,
    validUntil: (r.valid_until as Date).toISOString(),
    status: r.status as QuotationRecord["status"],
    createdAt: (r.created_at as Date).toISOString(),
    respondedAt: r.responded_at ? (r.responded_at as Date).toISOString() : null,
  };
}

export async function listQuotations(client: Queryable, bookingId: string): Promise<QuotationRecord[]> {
  const { rows } = await client.query("SELECT * FROM booking_quotations WHERE booking_id = $1 ORDER BY version DESC", [bookingId]);
  return rows.map(toQuotation);
}

export async function liveQuotation(client: Queryable, bookingId: string, lock = false): Promise<QuotationRecord | null> {
  const { rows } = await client.query(
    `SELECT * FROM booking_quotations WHERE booking_id = $1 AND status = 'SENT' ${lock ? "FOR UPDATE" : ""}`,
    [bookingId],
  );
  return rows[0] ? toQuotation(rows[0]) : null;
}

export async function acceptedQuotation(client: Queryable, bookingId: string): Promise<QuotationRecord | null> {
  const { rows } = await client.query("SELECT * FROM booking_quotations WHERE booking_id = $1 AND status = 'ACCEPTED'", [bookingId]);
  return rows[0] ? toQuotation(rows[0]) : null;
}

export async function supersedeLiveQuotation(client: Queryable, bookingId: string) {
  await client.query("UPDATE booking_quotations SET status = 'SUPERSEDED', responded_at = now() WHERE booking_id = $1 AND status = 'SENT'", [bookingId]);
}

export async function insertQuotation(
  client: Queryable,
  input: {
    bookingId: string;
    baseAmount: number;
    additionalCharges: number;
    currency: string;
    includedServices: string;
    notes: string | null;
    validDays: number;
    adminId: string;
  },
): Promise<QuotationRecord> {
  const { rows } = await client.query(
    `INSERT INTO booking_quotations (booking_id, version, base_amount, additional_charges, currency, included_services, notes, valid_until, created_by)
     VALUES ($1, COALESCE((SELECT max(version) FROM booking_quotations WHERE booking_id = $1), 0) + 1, $2, $3, $4, $5, $6,
             now() + make_interval(days => $7), $8)
     RETURNING *`,
    [input.bookingId, input.baseAmount, input.additionalCharges, input.currency, input.includedServices, input.notes, input.validDays, input.adminId],
  );
  return toQuotation(rows[0]);
}

export async function respondToQuotation(client: Queryable, id: string, status: "ACCEPTED" | "REJECTED") {
  await client.query("UPDATE booking_quotations SET status = $2, responded_at = now() WHERE id = $1", [id, status]);
}

// ---------- Payments ----------

export type PaymentRecord = {
  id: string;
  bookingId: string;
  quotationId: string;
  expectedAmount: number;
  currency: string;
  instructions: string;
  status: "PENDING" | "RECEIVED" | "CANCELLED";
  method: string | null;
  amountReceived: number | null;
  paymentReference: string | null;
  receivedAt: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export async function listPayments(client: Queryable, bookingId: string): Promise<PaymentRecord[]> {
  const { rows } = await client.query(
    `SELECT p.*, a.name AS verified_by_name FROM booking_payments p LEFT JOIN admin_users a ON a.id = p.verified_by
     WHERE p.booking_id = $1 ORDER BY p.created_at DESC`,
    [bookingId],
  );
  return rows.map((r) => ({
    id: r.id,
    bookingId: r.booking_id,
    quotationId: r.quotation_id,
    expectedAmount: Number(r.expected_amount),
    currency: r.currency,
    instructions: r.instructions,
    status: r.status,
    method: r.method,
    amountReceived: r.amount_received === null ? null : Number(r.amount_received),
    paymentReference: r.payment_reference,
    receivedAt: r.received_at ? r.received_at.toISOString() : null,
    verifiedByName: r.verified_by_name,
    verifiedAt: r.verified_at ? r.verified_at.toISOString() : null,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function insertPendingPayment(
  client: Queryable,
  input: { bookingId: string; quotationId: string; amount: number; currency: string; instructions: string; adminId: string },
) {
  await client.query(
    `INSERT INTO booking_payments (booking_id, quotation_id, expected_amount, currency, instructions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [input.bookingId, input.quotationId, input.amount, input.currency, input.instructions, input.adminId],
  );
}

export async function pendingPayment(client: Queryable, bookingId: string): Promise<{ id: string; expectedAmount: number } | null> {
  const { rows } = await client.query(
    "SELECT id, expected_amount FROM booking_payments WHERE booking_id = $1 AND status = 'PENDING' FOR UPDATE",
    [bookingId],
  );
  return rows[0] ? { id: rows[0].id, expectedAmount: Number(rows[0].expected_amount) } : null;
}

export async function markPaymentReceived(
  client: Queryable,
  input: { id: string; method: string; amount: number; reference: string | null; receivedAt: string | null; notes: string | null; adminId: string },
) {
  await client.query(
    `UPDATE booking_payments SET status = 'RECEIVED', method = $2, amount_received = $3, payment_reference = $4,
            received_at = COALESCE($5::timestamptz, now()), notes = $6, verified_by = $7, verified_at = now()
     WHERE id = $1`,
    [input.id, input.method, input.amount, input.reference, input.receivedAt, input.notes, input.adminId],
  );
}

export async function cancelOpenPayments(client: Queryable, bookingId: string) {
  await client.query("UPDATE booking_payments SET status = 'CANCELLED' WHERE booking_id = $1 AND status = 'PENDING'", [bookingId]);
}

// ---------- Notification log ----------

export async function logNotification(
  client: Queryable,
  input: {
    bookingId: string | null;
    channel: "EMAIL" | "WHATSAPP";
    template: string;
    recipient: string | null;
    status: "SENT" | "FAILED" | "SKIPPED";
    providerId?: string | null;
    error?: string | null;
  },
) {
  await client.query(
    `INSERT INTO notification_log (booking_id, channel, template, recipient, status, provider_id, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.bookingId, input.channel, input.template, input.recipient, input.status, input.providerId ?? null, input.error?.slice(0, 500) ?? null],
  );
}

export async function listNotifications(client: Queryable, bookingId: string) {
  const { rows } = await client.query(
    "SELECT channel, template, recipient, status, error, created_at FROM notification_log WHERE booking_id = $1 ORDER BY created_at DESC",
    [bookingId],
  );
  return rows.map((r) => ({
    channel: r.channel as string,
    template: r.template as string,
    recipient: r.recipient as string | null,
    status: r.status as string,
    error: r.error as string | null,
    createdAt: r.created_at.toISOString() as string,
  }));
}
