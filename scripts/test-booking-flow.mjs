// End-to-end check of the booking lifecycle against a RUNNING app and a migrated database.
// It creates test bookings, vehicles and drivers, so run it against a development or staging database only.
//
//   BASE_URL=http://localhost:3000 DATABASE_URL=... SESSION_SECRET=<same as the server> //   TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... npm run test:flow
//
// Start the server with the same SESSION_SECRET and BOOKING_RATE_LIMIT=1000 (the test submits many bookings from one IP).
import pg from "pg";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.SESSION_SECRET;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
if (!SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD || !process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL, SESSION_SECRET, TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.");
  process.exit(2);
}
const results = [];
let cookie = "";
const check = (name, cond, extra = "") => {
  results.push([cond, name]);
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + extra}`);
};

async function api(method, path, body, { auth = true, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth && cookie ? { cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get("set-cookie");
  if (set && auth) cookie = set.split(";")[0];
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? true : undefined });
await db.connect();
const future = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

const valid = (over = {}) => ({
  bookingType: "tour", destinationType: "catalog", destination: "lisbon", customDestination: "",
  travelDate: future(10), pickupLocation: "Hotel Avenida, Lisbon", passengers: 2, notes: "Window seats please",
  name: "Ana Silva", email: "ana@example.com", whatsapp: "+351 912 345 678", ...over,
});

// ---- Validation
let r = await api("POST", "/api/bookings", {}, { auth: false });
check("empty body -> 400 with field details", r.status === 400 && r.json.error?.details?.name, JSON.stringify(r.json));
r = await api("POST", "/api/bookings", valid({ travelDate: "2020-01-01" }), { auth: false });
check("past travel date rejected", r.status === 400 && r.json.error.details.travelDate);
r = await api("POST", "/api/bookings", valid({ whatsapp: "912345678" }), { auth: false });
check("phone without country code rejected", r.status === 400 && r.json.error.details.whatsapp);
r = await api("POST", "/api/bookings", valid({ destination: "atlantis" }), { auth: false });
check("unknown catalog destination rejected", r.status === 400 && r.json.error.details.destination);
r = await api("POST", "/api/bookings", valid({ destinationType: "custom", destination: "", customDestination: "" }), { auth: false });
check("custom destination without description rejected", r.status === 400 && r.json.error.details.customDestination);
r = await api("POST", "/api/bookings", valid({ passengers: 0 }), { auth: false });
check("passengers 0 rejected", r.status === 400);
r = await api("POST", "/api/bookings", valid({ email: "nope" }), { auth: false });
check("bad email rejected", r.status === 400 && r.json.error.details.email);

// ---- Create (catalog) with idempotency
const key = "idem-" + Math.random().toString(36).slice(2);
r = await api("POST", "/api/bookings", valid({ idempotencyKey: key }), { auth: false });
check("catalog booking created 201", r.status === 201 && /^LE-[A-Z0-9]{8}$/.test(r.json.data?.reference), JSON.stringify(r.json));
check("initial status PENDING", r.json.data.status === "PENDING");
const ref1 = r.json.data.reference;
const track1 = r.json.data.trackingPath;
const token1 = new URL(BASE + track1).searchParams.get("t");
const dup = await api("POST", "/api/bookings", valid({ idempotencyKey: key }), { auth: false });
check("duplicate submission returns same reference", dup.json.data?.reference === ref1);
const count = (await db.query("select count(*) from bookings where idempotency_key=$1", [key])).rows[0].count;
check("duplicate submission created only one row", count === "1");

// ---- Custom destination: catalog field must not leak in
r = await api("POST", "/api/bookings", valid({ bookingType: "vehicle", vehicleCategory: "VAN", destinationType: "custom", destination: "lisbon", customDestination: "Sintra palaces, private day" , travelDate: future(10)}), { auth: false });
check("custom booking created", r.status === 201);
const ref2 = r.json.data.reference;
const row2 = (await db.query("select destination_id, custom_destination, destination_type, booking_type from bookings where reference=$1", [ref2])).rows[0];
check("custom booking stores no destination_id", row2.destination_id === null && row2.custom_destination.startsWith("Sintra"));
check("vehicle type normalised", row2.booking_type === "VEHICLE_RIDE");
const cust = (await db.query("select count(*) from customers where lower(email)='ana@example.com'")).rows[0].count;
check("repeat customer reused (1 customer row)", cust === "1");

// ---- Activity + notifications
const ev = (await db.query("select e.event_type from booking_events e join bookings b on b.id=e.booking_id where b.reference=$1", [ref1])).rows;
check("BOOKING_CREATED event recorded", ev.some((e) => e.event_type === "BOOKING_CREATED"));
await new Promise((res) => setTimeout(res, 800));
const nl = (await db.query("select n.channel, n.status from notification_log n join bookings b on b.id=n.booking_id where b.reference=$1", [ref1])).rows;
check("notifications logged as SKIPPED (no provider configured), never SENT", nl.length >= 3 && nl.every((n) => n.status === "SKIPPED"), JSON.stringify(nl));

// ---- Authorization
r = await api("GET", "/api/bookings", undefined, { auth: false });
check("list without session -> 401", r.status === 401);
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "CANCELLED" }, { auth: false });
check("status change without session -> 401", r.status === 401);
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "RECORD_RECEIVED" }, { auth: false });
check("payment without session -> 401", r.status === 401);
r = await api("POST", "/api/admin/login", { email: ADMIN_EMAIL, password: "definitely-wrong-password" }, { auth: false });
check("wrong password -> 401", r.status === 401);
r = await api("POST", "/api/admin/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
check("admin login ok", r.status === 200 && cookie.startsWith("le_admin="), JSON.stringify(r.json));
r = await api("GET", "/api/bookings", undefined, { headers: { origin: "https://evil.example" } });
check("GET list with session ok", r.status === 200 && r.json.data.total >= 2);
r = await api("POST", `/api/bookings/${ref1}/status`, undefined, { headers: { origin: "https://evil.example" } });
// forged cookie
const saved = cookie; cookie = "le_admin=" + saved.split("=")[1].split(".")[0] + ".AAAA";
r = await api("GET", "/api/bookings");
check("forged session cookie rejected", r.status === 401);
cookie = saved;
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "UNDER_REVIEW" }, { headers: { origin: "https://evil.example" } });
check("cross-origin state change blocked", r.status === 403);

// ---- Customer view
r = await api("GET", `/api/bookings/${ref1}?t=${token1}`, undefined, { auth: false });
check("customer view with token ok & no email/phone leaked", r.status === 200 && !JSON.stringify(r.json).includes("ana@example.com") && !JSON.stringify(r.json).includes("912"), JSON.stringify(r.json));
r = await api("GET", `/api/bookings/${ref1}?t=${token1}x`, undefined, { auth: false });
check("customer view with wrong token -> 404", r.status === 404);
r = await api("GET", `/api/bookings/${ref2}?t=${token1}`, undefined, { auth: false });
check("token of booking A cannot read booking B", r.status === 404);
r = await api("PATCH", `/api/bookings/${ref1}`, { token: token1, pickupLocation: "Rossio Station", status: "CONFIRMED" }, { auth: false });
check("customer cannot smuggle extra fields (strict)", r.status === 400);
r = await api("PATCH", `/api/bookings/${ref1}`, { token: token1, pickupLocation: "Rossio Station", passengers: 3 }, { auth: false });
check("customer can edit pickup/passengers while pending", r.status === 200 && r.json.data.pickupLocation === "Rossio Station" && r.json.data.passengers === 3, JSON.stringify(r.json));

// ---- List filters
r = await api("GET", `/api/bookings?q=${ref1}`);
check("search by reference", r.json.data.items.length === 1 && r.json.data.items[0].reference === ref1);
r = await api("GET", `/api/bookings?status=PENDING&type=VEHICLE_RIDE`);
check("filter by status + type", r.json.data.items.every((b) => b.status === "PENDING" && b.bookingType === "VEHICLE_RIDE") && r.json.data.items.length >= 1);
r = await api("GET", `/api/bookings?q=%25`);
check("LIKE wildcard in search is escaped", r.status === 200 && r.json.data.total === 0);
r = await api("GET", `/api/bookings?status=BOGUS`);
check("invalid status filter -> 400", r.status === 400);

// ---- Lifecycle guards
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "SCHEDULED" });
check("arbitrary jump PENDING->SCHEDULED rejected (409)", r.status === 409);
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "QUOTED" });
check("QUOTED cannot be set by plain status change", r.status === 409);
r = await api("POST", `/api/bookings/${ref1}/quotation`, { amount: 300, includedServices: "Driver, fuel" });
check("quotation before review rejected", r.status === 409);
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "UNDER_REVIEW" });
check("PENDING -> UNDER_REVIEW", r.status === 200 && r.json.data.status === "UNDER_REVIEW");
r = await api("PATCH", `/api/bookings/${ref1}`, { token: token1, notes: "x" }, { auth: false });
check("customer edit blocked once under review? (UNDER_REVIEW is still editable)", r.status === 200);

// ---- Resources & availability
const veh = await api("POST", "/api/admin/vehicles", { name: "Mercedes V-Class", category: "VAN", plate: "AB-12-CD", passengerCapacity: 7 });
check("vehicle created", veh.status === 201, JSON.stringify(veh.json));
const small = await api("POST", "/api/admin/vehicles", { name: "Skoda Superb", category: "STANDARD_COMFORT", plate: "ZZ-00-ZZ", passengerCapacity: 3 });
const drv = await api("POST", "/api/admin/drivers", { name: "João Pereira", phone: "+351 911 000 111" });
check("driver created with E.164 phone", drv.status === 201 && drv.json.data.phone === "+351911000111", JSON.stringify(drv.json));
r = await api("POST", "/api/admin/vehicles", { name: "dup", category: "ECONOMY", plate: "ab-12-cd", passengerCapacity: 4 });
check("duplicate plate -> 409", r.status === 409);
r = await api("GET", `/api/bookings/${ref1}/assignment`);
check("availability lists vehicle & driver", r.json.data.vehicles.length === 2 && r.json.data.drivers.length === 1);

// make a 5-passenger booking for the same day
r = await api("POST", "/api/bookings", valid({ passengers: 5, email: "bruno@example.com", name: "Bruno Costa" }), { auth: false });
const refBig = r.json.data.reference;
await api("PATCH", `/api/bookings/${refBig}/status`, { status: "UNDER_REVIEW" });
r = await api("POST", `/api/bookings/${refBig}/assignment`, { vehicleId: small.json.data.id });
check("vehicle too small for passengers -> 409", r.status === 409, JSON.stringify(r.json));

r = await api("POST", `/api/bookings/${ref1}/assignment`, { vehicleId: veh.json.data.id, driverId: drv.json.data.id });
check("assign vehicle+driver", r.status === 200);
r = await api("POST", `/api/bookings/${refBig}/assignment`, { vehicleId: veh.json.data.id });
check("double booking same vehicle/day prevented (409)", r.status === 409, JSON.stringify(r.json));
r = await api("POST", `/api/bookings/${refBig}/assignment`, { driverId: drv.json.data.id });
check("double booking same driver/day prevented (409)", r.status === 409);
// race: two concurrent assignments of the same vehicle to two different bookings
r = await api("POST", "/api/bookings", valid({ travelDate: future(20), passengers: 2, email: "c1@example.com", name: "C One" }), { auth: false });
const raceA = r.json.data.reference;
r = await api("POST", "/api/bookings", valid({ travelDate: future(20), passengers: 2, email: "c2@example.com", name: "C Two" }), { auth: false });
const raceB = r.json.data.reference;
await api("PATCH", `/api/bookings/${raceA}/status`, { status: "UNDER_REVIEW" });
await api("PATCH", `/api/bookings/${raceB}/status`, { status: "UNDER_REVIEW" });
const race = await Promise.all([raceA, raceB].map((ref) => api("POST", `/api/bookings/${ref}/assignment`, { vehicleId: veh.json.data.id })));
check("concurrent assignment: exactly one wins", race.filter((x) => x.status === 200).length === 1 && race.filter((x) => x.status === 409).length === 1, JSON.stringify(race.map((x) => x.status)));

// ---- Alternative -> quotation
r = await api("POST", `/api/bookings/${refBig}/alternative`, { message: "We can offer the V-Class on the following day.", proposedTravelDate: future(11) });
check("alternative proposed", r.status === 200 && r.json.data.status === "ALTERNATIVE_PROPOSED", JSON.stringify(r.json));

// ---- Quotation validation
r = await api("POST", `/api/bookings/${ref1}/quotation`, { amount: -5, includedServices: "Driver" });
check("negative quotation rejected", r.status === 400);
r = await api("POST", `/api/bookings/${ref1}/quotation`, { amount: 10.123, includedServices: "Driver" });
check("3-decimal quotation rejected", r.status === 400);
r = await api("POST", `/api/bookings/${ref1}/quotation`, { amount: 300, additionalCharges: 20.5, includedServices: "Private driver, fuel, tolls", notes: "Parking extra" });
check("quotation created -> QUOTED", r.status === 201 && r.json.data.status === "QUOTED" && r.json.data.quotation.totalAmount === 320.5, JSON.stringify(r.json));
r = await api("POST", `/api/bookings/${ref1}/quotation`, { amount: 310, includedServices: "Private driver, fuel, tolls" });
check("quotation revision v2 keeps history", r.status === 201 && r.json.data.quotation.version === 2);
const qs = (await db.query("select q.version, q.status, q.total_amount from booking_quotations q join bookings b on b.id=q.booking_id where b.reference=$1 order by version", [ref1])).rows;
check("v1 SUPERSEDED, v2 SENT", qs[0].status === "SUPERSEDED" && qs[1].status === "SENT" && qs[1].total_amount === "310.00", JSON.stringify(qs));

// ---- Customer response
r = await api("POST", `/api/bookings/${ref1}/quotation/respond`, { token: "bad-token-bad-token", decision: "ACCEPT" }, { auth: false });
check("respond with wrong token -> 404", r.status === 404);
r = await api("POST", `/api/bookings/${ref1}/quotation/respond`, { token: token1, decision: "ACCEPT", amount: 1 }, { auth: false });
check("accept ignores any customer-supplied amount", r.status === 200 && r.json.data.status === "QUOTE_ACCEPTED");
const bq = (await db.query("select quoted_amount from bookings where reference=$1", [ref1])).rows[0];
check("stored amount is the server quotation (310.00)", bq.quoted_amount === "310.00");
r = await api("POST", `/api/bookings/${ref1}/quotation/respond`, { token: token1, decision: "REJECT" }, { auth: false });
check("cannot respond twice (409)", r.status === 409);

// ---- Expired quotation
await api("PATCH", `/api/bookings/${raceA}`, {}, {});
r = await api("POST", `/api/bookings/${raceA}/quotation`, { amount: 100, includedServices: "Driver only" });
const tokenA = (await (async () => {
  // derive token via tracking path from a fresh create is not possible for existing; use admin-only path: recompute using same secret
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", SECRET).update(`customer:${raceA}`).digest("base64url");
})());
await db.query("update booking_quotations set valid_until = now() - interval '1 day' where booking_id=(select id from bookings where reference=$1)", [raceA]);
r = await api("POST", `/api/bookings/${raceA}/quotation/respond`, { token: tokenA, decision: "ACCEPT" }, { auth: false });
check("expired quotation cannot be accepted (409)", r.status === 409 && /expired/i.test(r.json.error.message), JSON.stringify(r.json));

// ---- Rejection flow
r = await api("POST", `/api/bookings/${raceB}/quotation`, { amount: 100, includedServices: "Driver only" });
const { createHmac } = await import("node:crypto");
const tokenB = createHmac("sha256", SECRET).update(`customer:${raceB}`).digest("base64url");
r = await api("POST", `/api/bookings/${raceB}/quotation/respond`, { token: tokenB, decision: "REJECT" }, { auth: false });
const rb = (await db.query("select status, cancel_reason from bookings where reference=$1", [raceB])).rows[0];
check("rejected quotation closes booking as CANCELLED", r.status === 200 && rb.status === "CANCELLED" && /declined/i.test(rb.cancel_reason), JSON.stringify(rb));
const evB = (await db.query("select event_type from booking_events e join bookings b on b.id=e.booking_id where b.reference=$1 order by e.created_at,e.id", [raceB])).rows.map((x) => x.event_type);
check("history shows QUOTATION_REJECTED then BOOKING_CANCELLED", evB.includes("QUOTATION_REJECTED") && evB.at(-1) === "BOOKING_CANCELLED", evB.join(","));

// ---- Payment
r = await api("POST", `/api/bookings/${ref1}/confirm`);
check("confirm before payment rejected (409)", r.status === 409);
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "RECORD_RECEIVED", method: "BANK_TRANSFER", amount: 310, verified: true });
check("record payment before instructions rejected (409)", r.status === 409);
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "SEND_INSTRUCTIONS", instructions: "Transfer to IBAN PT50 0000 0000 0000 0000 0000 0 with the reference." });
check("instructions sent -> PAYMENT_PENDING", r.status === 200 && r.json.data.status === "PAYMENT_PENDING" && r.json.data.paymentStatus === "PENDING", JSON.stringify(r.json));
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "RECORD_RECEIVED", method: "BANK_TRANSFER", amount: 310 });
check("payment needs explicit verified:true (400)", r.status === 400);
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "RECORD_RECEIVED", method: "BANK_TRANSFER", amount: 100, verified: true });
check("wrong payment amount rejected (400)", r.status === 400);
r = await api("POST", `/api/bookings/${ref1}/confirm`);
check("confirm while payment pending rejected (409)", r.status === 409);
r = await api("POST", `/api/bookings/${ref1}/payment`, { action: "RECORD_RECEIVED", method: "BANK_TRANSFER", amount: 310, paymentReference: "TRX-9981", verified: true });
check("payment recorded -> PAYMENT_RECEIVED", r.status === 200 && r.json.data.status === "PAYMENT_RECEIVED" && r.json.data.paymentStatus === "RECEIVED", JSON.stringify(r.json));
const pay = (await db.query("select p.status, p.verified_by, p.verified_at from booking_payments p join bookings b on b.id=p.booking_id where b.reference=$1", [ref1])).rows[0];
check("payment stores verifying admin", pay.status === "RECEIVED" && pay.verified_by && pay.verified_at);
r = await api("GET", `/api/bookings/${ref1}?t=${token1}`, undefined, { auth: false });
check("payment recording alone did not confirm booking", r.json.data.status === "PAYMENT_RECEIVED");
r = await api("POST", `/api/bookings/${ref1}/confirm`);
check("confirm -> SCHEDULED", r.status === 200 && r.json.data.status === "SCHEDULED", JSON.stringify(r.json));
r = await api("GET", `/api/bookings/${ref1}`);
check("admin detail has full history, quotations, payments, notifications", r.json.data.events.length >= 10 && r.json.data.quotations.length === 2 && r.json.data.payments.length === 1 && r.json.data.notifications.length >= 5, `${r.json.data.events.length}/${r.json.data.quotations.length}/${r.json.data.payments.length}/${r.json.data.notifications.length}`);
r = await api("GET", `/api/bookings/${ref1}?t=${token1}`, undefined, { auth: false });
check("customer sees assigned vehicle only after confirmation", r.json.data.vehicle === "Mercedes V-Class" && !JSON.stringify(r.json).includes("AB-12-CD"));

// ---- Terminal states & cancel
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "COMPLETED" });
check("SCHEDULED -> COMPLETED", r.status === 200);
r = await api("PATCH", `/api/bookings/${ref1}/status`, { status: "CANCELLED" });
check("COMPLETED is terminal (409)", r.status === 409);
r = await api("PATCH", `/api/bookings/${refBig}/status`, { status: "CANCELLED", note: "Customer asked to cancel" });
check("admin cancel with reason", r.status === 200 && r.json.data.status === "CANCELLED");

// ---- DB constraints
let bad = false;
try { await db.query("update bookings set status='HACKED' where reference=$1", [ref2]); } catch { bad = true; }
check("DB rejects invalid status value", bad);
bad = false;
try { await db.query("update bookings set destination_type='CUSTOM', destination_id=null, custom_destination=null where reference=$1", [ref2]); } catch { bad = true; }
check("DB rejects inconsistent destination fields", bad);

// ---- Vehicle category, category-matched assignment, soft delete
r = await api("POST", "/api/bookings", valid({ bookingType: "vehicle", destinationType: "custom", customDestination: "Porto" }), { auth: false });
check("vehicle booking without category -> 400", r.status === 400 && r.json.error.details.vehicleCategory, JSON.stringify(r.json));
r = await api("POST", "/api/bookings", valid({ bookingType: "vehicle", vehicleCategory: "SPACESHIP", destinationType: "custom", customDestination: "Porto" }), { auth: false });
check("invalid category -> 400", r.status === 400 && r.json.error.details.vehicleCategory);
r = await api("POST", "/api/bookings", valid({ vehicleCategory: "VAN", travelDate: future(40), email: "t1@example.com" }), { auth: false });
const tourRef = r.json.data.reference;
check("tour booking ignores a posted category", (await db.query("select vehicle_category from bookings where reference=$1", [tourRef])).rows[0].vehicle_category === null);
check("category stored for vehicle booking", (await db.query("select vehicle_category from bookings where reference=$1", [ref2])).rows[0].vehicle_category === "VAN");
bad = false;
try { await db.query("insert into bookings (reference, booking_type, destination_type, custom_destination, travel_date, pickup_location, passengers, customer_id) select 'XX1', 'VEHICLE_RIDE', 'CUSTOM', 'x', current_date + 5, 'x', 1, id from customers limit 1"); } catch { bad = true; }
check("DB rejects a new vehicle booking without category", bad);

const first = await api("POST", "/api/admin/vehicles", { name: "Mercedes S-Class", category: "FIRST_CLASS", plate: "FC-01-FC", passengerCapacity: 3 });
const van2 = await api("POST", "/api/admin/vehicles", { name: "Vito", category: "VAN", plate: "VA-02-VA", passengerCapacity: 8 });
const inactiveVan = await api("POST", "/api/admin/vehicles", { name: "Old Van", category: "VAN", plate: "OV-03-OV", passengerCapacity: 8 });
await db.query("update vehicles set is_active=false where id=$1", [inactiveVan.json.data.id]);
r = await api("POST", "/api/bookings", valid({ bookingType: "vehicle", vehicleCategory: "FIRST_CLASS", destinationType: "custom", customDestination: "Cascais", travelDate: future(50), passengers: 2, email: "fc@example.com", name: "Fiona First" }), { auth: false });
const fcRef = r.json.data.reference;
r = await api("GET", `/api/bookings/${fcRef}`);
check("admin detail exposes vehicleCategory", r.json.data.booking.vehicleCategory === "FIRST_CLASS");
r = await api("GET", "/api/bookings?q=Fiona");
check("admin list exposes vehicleCategory", r.json.data.items[0]?.vehicleCategory === "FIRST_CLASS");
await api("PATCH", `/api/bookings/${fcRef}/status`, { status: "UNDER_REVIEW" });
r = await api("GET", `/api/bookings/${fcRef}/assignment`);
check("availability only lists the requested category", r.json.data.vehicles.length === 1 && r.json.data.vehicles[0].id === first.json.data.id, JSON.stringify(r.json.data.vehicles.map((v) => v.name)));
check("availability returns booking info", r.json.data.booking.vehicleCategory === "FIRST_CLASS" && r.json.data.booking.customerName === "Fiona First");
r = await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: van2.json.data.id });
check("backend rejects a category mismatch (409)", r.status === 409, JSON.stringify(r.json));
r = await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: inactiveVan.json.data.id });
check("inactive vehicle rejected", r.status >= 400);
r = await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: first.json.data.id });
check("matching category assigned", r.status === 200);
r = await api("PATCH", `/api/bookings/${fcRef}`, { passengers: 6 });
check("admin edit that outgrows the assigned vehicle -> 409", r.status === 409, JSON.stringify(r.json));
r = await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: null });
check("assignment can be cleared", r.status === 200 && r.json.data.vehicleId === null);

// soft delete
r = await api("DELETE", `/api/bookings/${fcRef}`, undefined, { auth: false });
check("delete requires admin (401)", r.status === 401);
await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: first.json.data.id });
r = await api("DELETE", `/api/bookings/${fcRef}`);
check("admin soft delete", r.status === 200);
const del = (await db.query("select deleted_at from bookings where reference=$1", [fcRef])).rows[0];
check("row kept with deleted_at set", !!del?.deleted_at);
const delEv = (await db.query("select event_type from booking_events e join bookings b on b.id=e.booking_id where b.reference=$1 order by e.created_at desc limit 1", [fcRef])).rows[0];
check("deletion recorded in booking_events", delEv?.event_type === "BOOKING_DELETED");
r = await api("GET", "/api/bookings?q=Fiona");
check("deleted booking hidden from list and count", r.json.data.total === 0);
r = await api("GET", `/api/bookings/${fcRef}`);
check("deleted booking is 404", r.status === 404);
r = await api("PATCH", `/api/bookings/${fcRef}`, { notes: "x" });
check("deleted booking cannot be modified", r.status === 404);
r = await api("POST", `/api/bookings/${fcRef}/assignment`, { vehicleId: first.json.data.id });
check("deleted booking cannot be assigned", r.status === 404);
r = await api("DELETE", `/api/bookings/${fcRef}`);
check("deleting twice -> 404", r.status === 404);
r = await api("POST", "/api/bookings", valid({ bookingType: "vehicle", vehicleCategory: "FIRST_CLASS", destinationType: "custom", customDestination: "Cascais", travelDate: future(50), passengers: 2, email: "fc2@example.com", name: "Second FC" }), { auth: false });
await api("PATCH", `/api/bookings/${r.json.data.reference}/status`, { status: "UNDER_REVIEW" });
r = await api("POST", `/api/bookings/${r.json.data.reference}/assignment`, { vehicleId: first.json.data.id });
check("vehicle freed by the deleted booking can be assigned again", r.status === 200, JSON.stringify(r.json));

await db.end();
const failed = results.filter(([ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
