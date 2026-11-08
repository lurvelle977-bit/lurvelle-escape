-- Booking system schema. Additive only: creates new tables and never touches existing data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keeps updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Staff who can sign in to /admin
CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text NOT NULL,
  password_hash text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email_key ON admin_users (lower(email));

-- Catalog destinations/tours. Rows are upserted from src/content/tours.ts on first use.
CREATE TABLE destinations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  kind        text NOT NULL DEFAULT 'TOUR' CHECK (kind IN ('TOUR', 'DESTINATION')),
  base_price  numeric(12,2) CHECK (base_price IS NULL OR base_price >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- One row per person, matched by email so repeat customers are not duplicated
CREATE TABLE customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  whatsapp   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_email_key ON customers (lower(email));
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE vehicles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  vehicle_class      text NOT NULL,
  plate              text NOT NULL,
  passenger_capacity integer NOT NULL CHECK (passenger_capacity > 0),
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vehicles_plate_key ON vehicles (upper(plate));
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE drivers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text NOT NULL,
  email      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference         text NOT NULL UNIQUE,
  booking_type      text NOT NULL CHECK (booking_type IN ('TOUR_PACKAGE', 'VEHICLE_RIDE')),
  destination_type  text NOT NULL CHECK (destination_type IN ('CATALOG', 'CUSTOM')),
  destination_id    uuid REFERENCES destinations (id),
  custom_destination text,
  travel_date       date NOT NULL,
  pickup_location   text NOT NULL,
  passengers        integer NOT NULL CHECK (passengers BETWEEN 1 AND 60),
  notes             text,
  customer_id       uuid NOT NULL REFERENCES customers (id),
  status            text NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'UNDER_REVIEW', 'ALTERNATIVE_PROPOSED', 'QUOTED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
    'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED', 'SCHEDULED', 'CANCELLED', 'COMPLETED')),
  quoted_amount     numeric(12,2) CHECK (quoted_amount IS NULL OR quoted_amount > 0),
  currency          text NOT NULL DEFAULT 'EUR' CHECK (currency ~ '^[A-Z]{3}$'),
  payment_status    text NOT NULL DEFAULT 'NOT_REQUESTED' CHECK (payment_status IN ('NOT_REQUESTED', 'PENDING', 'RECEIVED')),
  vehicle_id        uuid REFERENCES vehicles (id),
  driver_id         uuid REFERENCES drivers (id),
  cancel_reason     text,
  idempotency_key   text UNIQUE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- A catalog booking has a destination row and no custom text; a custom booking is the opposite
  CONSTRAINT bookings_destination_consistent CHECK (
    (destination_type = 'CATALOG' AND destination_id IS NOT NULL AND custom_destination IS NULL) OR
    (destination_type = 'CUSTOM' AND destination_id IS NULL AND custom_destination IS NOT NULL)
  )
);
CREATE INDEX bookings_status_idx ON bookings (status, created_at DESC);
CREATE INDEX bookings_type_idx ON bookings (booking_type);
CREATE INDEX bookings_customer_idx ON bookings (customer_id);
CREATE INDEX bookings_travel_date_idx ON bookings (travel_date);
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Database-level double-booking guard: a vehicle or driver can hold only one live booking per day
CREATE UNIQUE INDEX bookings_vehicle_day_key ON bookings (vehicle_id, travel_date)
  WHERE vehicle_id IS NOT NULL
    AND status IN ('UNDER_REVIEW', 'ALTERNATIVE_PROPOSED', 'QUOTED', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED', 'SCHEDULED');
CREATE UNIQUE INDEX bookings_driver_day_key ON bookings (driver_id, travel_date)
  WHERE driver_id IS NOT NULL
    AND status IN ('UNDER_REVIEW', 'ALTERNATIVE_PROPOSED', 'QUOTED', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED', 'SCHEDULED');

-- Alternatives (other date, vehicle or destination) suggested to the customer
CREATE TABLE booking_alternatives (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  message               text NOT NULL,
  proposed_travel_date  date,
  proposed_vehicle_id   uuid REFERENCES vehicles (id),
  proposed_destination_id uuid REFERENCES destinations (id),
  created_by            uuid NOT NULL REFERENCES admin_users (id),
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_alternatives_booking_idx ON booking_alternatives (booking_id);

-- Every quotation version is kept; only one can be live (SENT) per booking
CREATE TABLE booking_quotations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  version            integer NOT NULL,
  base_amount        numeric(12,2) NOT NULL CHECK (base_amount > 0),
  additional_charges numeric(12,2) NOT NULL DEFAULT 0 CHECK (additional_charges >= 0),
  total_amount       numeric(12,2) GENERATED ALWAYS AS (base_amount + additional_charges) STORED,
  currency           text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  included_services  text NOT NULL,
  notes              text,
  valid_until        timestamptz NOT NULL,
  status             text NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED')),
  created_by         uuid NOT NULL REFERENCES admin_users (id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  responded_at       timestamptz,
  UNIQUE (booking_id, version)
);
CREATE UNIQUE INDEX booking_quotations_one_live_key ON booking_quotations (booking_id) WHERE status = 'SENT';

-- Manual payments: a PENDING row is created with the payment instructions, then marked RECEIVED by an admin
CREATE TABLE booking_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  quotation_id     uuid NOT NULL REFERENCES booking_quotations (id),
  expected_amount  numeric(12,2) NOT NULL CHECK (expected_amount > 0),
  currency         text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  instructions     text NOT NULL,
  status           text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'CANCELLED')),
  method           text CHECK (method IN ('BANK_TRANSFER', 'MBWAY', 'CASH', 'CARD_TERMINAL', 'OTHER')),
  amount_received  numeric(12,2) CHECK (amount_received IS NULL OR amount_received > 0),
  payment_reference text,
  received_at      timestamptz,
  verified_by      uuid REFERENCES admin_users (id),
  verified_at      timestamptz,
  notes            text,
  created_by       uuid NOT NULL REFERENCES admin_users (id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_payments_received_complete CHECK (
    status <> 'RECEIVED' OR (method IS NOT NULL AND amount_received IS NOT NULL AND received_at IS NOT NULL
                             AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
  )
);
CREATE UNIQUE INDEX booking_payments_one_open_key ON booking_payments (booking_id) WHERE status IN ('PENDING', 'RECEIVED');

-- Audit trail of everything that happens to a booking
CREATE TABLE booking_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  from_status text,
  to_status   text,
  actor_type  text NOT NULL CHECK (actor_type IN ('CUSTOMER', 'ADMIN', 'SYSTEM')),
  actor_id    uuid REFERENCES admin_users (id),
  message     text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_events_booking_idx ON booking_events (booking_id, created_at);

-- Outcome of every email/WhatsApp attempt. FAILED and SKIPPED are recorded honestly, never as sent.
CREATE TABLE notification_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings (id) ON DELETE CASCADE,
  channel     text NOT NULL CHECK (channel IN ('EMAIL', 'WHATSAPP')),
  template    text NOT NULL,
  recipient   text,
  status      text NOT NULL CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
  provider_id text,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_log_booking_idx ON notification_log (booking_id, created_at);
