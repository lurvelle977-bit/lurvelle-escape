-- Vehicle category (replaces free-text vehicle_class), uploaded pictures, and driver -> vehicle assignment.
-- Existing rows are preserved: categories are backfilled from the old class text.

-- Uploaded pictures live in their own table so list queries never load image bytes
CREATE TABLE resource_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  data         bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles
  ADD COLUMN category text CHECK (category IN ('ECONOMY', 'STANDARD_COMFORT', 'VAN', 'FIRST_CLASS')),
  ADD COLUMN image_id uuid REFERENCES resource_images (id) ON DELETE SET NULL;

UPDATE vehicles SET category = CASE
  WHEN vehicle_class ~* '(van|minibus|bus)' THEN 'VAN'
  WHEN vehicle_class ~* '(first|luxury|premium|executive)' THEN 'FIRST_CLASS'
  WHEN vehicle_class ~* 'econom' THEN 'ECONOMY'
  ELSE 'STANDARD_COMFORT'
END;

ALTER TABLE vehicles ALTER COLUMN category SET NOT NULL;
ALTER TABLE vehicles DROP COLUMN vehicle_class;

ALTER TABLE drivers
  ADD COLUMN image_id uuid REFERENCES resource_images (id) ON DELETE SET NULL,
  ADD COLUMN vehicle_id uuid REFERENCES vehicles (id) ON DELETE SET NULL;
CREATE INDEX drivers_vehicle_idx ON drivers (vehicle_id);
