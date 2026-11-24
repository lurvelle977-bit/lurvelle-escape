-- The vehicle category a customer asked for (the admin assigns the actual vehicle later in vehicle_id) and
-- soft deletion of bookings. Existing rows are preserved: historical bookings keep vehicle_category = NULL.

ALTER TABLE bookings
  ADD COLUMN vehicle_category text CHECK (vehicle_category IN ('ECONOMY', 'STANDARD_COMFORT', 'VAN', 'FIRST_CLASS')),
  ADD COLUMN deleted_at       timestamptz;

-- Tour bookings never carry a category
ALTER TABLE bookings
  ADD CONSTRAINT bookings_category_only_for_rides CHECK (booking_type = 'VEHICLE_RIDE' OR vehicle_category IS NULL);

-- Every NEW vehicle / ride booking must name a category. A trigger (not a CHECK) so historical vehicle bookings,
-- which have no category, can still be updated.
CREATE FUNCTION require_vehicle_category() RETURNS trigger AS $$
BEGIN
  IF NEW.booking_type = 'VEHICLE_RIDE' AND NEW.vehicle_category IS NULL THEN
    RAISE EXCEPTION 'vehicle_category is required for vehicle / ride bookings' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER bookings_require_vehicle_category BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION require_vehicle_category();

-- A deleted booking must not keep holding a vehicle or driver for its travel date
DROP INDEX bookings_vehicle_day_key;
DROP INDEX bookings_driver_day_key;
CREATE UNIQUE INDEX bookings_vehicle_day_key ON bookings (vehicle_id, travel_date)
  WHERE vehicle_id IS NOT NULL AND deleted_at IS NULL
    AND status IN ('UNDER_REVIEW', 'ALTERNATIVE_PROPOSED', 'QUOTED', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED', 'SCHEDULED');
CREATE UNIQUE INDEX bookings_driver_day_key ON bookings (driver_id, travel_date)
  WHERE driver_id IS NOT NULL AND deleted_at IS NULL
    AND status IN ('UNDER_REVIEW', 'ALTERNATIVE_PROPOSED', 'QUOTED', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED', 'SCHEDULED');

CREATE INDEX bookings_live_created_idx ON bookings (created_at DESC) WHERE deleted_at IS NULL;
