-- Makes the Experiences (home), Destinations (map page) and Comfort tiers (home) sections database-driven.
-- Additive only: existing destinations rows (and the bookings that reference them) are kept and extended.
-- Seeded from the former src/content/tours.ts and tiers.ts. Pictures are linked afterwards by `npm run images:migrate -- --db`.

-- ---------- Destinations: extend the existing table ----------
ALTER TABLE destinations
  ADD COLUMN region           text,
  ADD COLUMN map_label        text,
  ADD COLUMN duration_hours   integer,
  ADD COLUMN lon              numeric(9,6),
  ADD COLUMN lat              numeric(9,6),
  ADD COLUMN label_side       text NOT NULL DEFAULT 'right' CHECK (label_side IN ('left', 'right')),
  ADD COLUMN mobile_label_dx  integer NOT NULL DEFAULT 12,
  ADD COLUMN mobile_label_dy  integer NOT NULL DEFAULT 0,
  ADD COLUMN image_url        text,
  ADD COLUMN image_public_id  text,
  ADD COLUMN is_featured      boolean NOT NULL DEFAULT false,
  ADD COLUMN sort_order       integer NOT NULL DEFAULT 0;

-- Existing rows get the map data of the tour with the same slug; other rows get safe placeholders
INSERT INTO destinations (slug, name, description, kind, base_price, region, map_label, duration_hours, lon, lat, label_side, mobile_label_dx, mobile_label_dy, is_featured, sort_order)
VALUES
  ('lisbon',   'Lisbon City Highlights',   'Miradouros, Alfama and the grand squares of the capital.',            'TOUR', 150, 'Lisbon',   'LISBON',   4,  -9.139,  38.722, 'right',  12,   4, false, 1),
  ('belem',    'Belém & Historic Lisbon',  'Monasteries, the tower and pastéis fresh from the oven.',             'TOUR', 160, 'Lisbon',   'BELÉM',    4,  -9.216,  38.697, 'left',  -12,  14, false, 2),
  ('sintra',   'Sintra & Cascais',         'Palaces, coastline and charming villages. A perfect full-day escape.', 'TOUR', 240, 'Coast',    'SINTRA',   8,  -9.388,  38.798, 'left',  -12,  -8, true,  3),
  ('arrabida', 'Arrábida & Setúbal',       'Turquoise coves and vineyards south of the Tagus.',                   'TOUR', 280, 'Coast',    'ARRÁBIDA', 8,  -8.891,  38.524, 'right',  12,  10, false, 4),
  ('obidos',   'Óbidos & Nazaré',          'A walled medieval town and the giant waves of Nazaré.',               'TOUR', 270, 'Centre',   'ÓBIDOS',   8,  -9.157,  39.361, 'right',  12,   0, false, 5),
  ('evora',    'Évora & Alentejo',         'Roman temples, cork oaks and slow Alentejo afternoons.',              'TOUR', 380, 'Alentejo', 'ÉVORA',    10, -7.909,  38.571, 'right',  12,   0, false, 6),
  ('porto',    'Porto City Highlights',    'Ribeira, port cellars and the bridges of the Douro.',                 'TOUR', 420, 'North',    'PORTO',    10, -8.611,  41.150, 'right',  12,   0, false, 7)
ON CONFLICT (slug) DO UPDATE SET
  region = EXCLUDED.region, map_label = EXCLUDED.map_label, duration_hours = EXCLUDED.duration_hours,
  lon = EXCLUDED.lon, lat = EXCLUDED.lat, label_side = EXCLUDED.label_side,
  mobile_label_dx = EXCLUDED.mobile_label_dx, mobile_label_dy = EXCLUDED.mobile_label_dy,
  is_featured = EXCLUDED.is_featured, sort_order = EXCLUDED.sort_order;

UPDATE destinations SET
  region = COALESCE(region, 'Lisbon'),
  map_label = COALESCE(map_label, upper(name)),
  duration_hours = COALESCE(duration_hours, 4),
  lon = COALESCE(lon, -9.139),
  lat = COALESCE(lat, 38.722),
  base_price = COALESCE(base_price, 0),
  description = COALESCE(description, '');

ALTER TABLE destinations
  ALTER COLUMN region SET NOT NULL,
  ALTER COLUMN map_label SET NOT NULL,
  ALTER COLUMN duration_hours SET NOT NULL,
  ALTER COLUMN lon SET NOT NULL,
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN base_price SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ADD CONSTRAINT destinations_region_check CHECK (region IN ('Lisbon', 'Coast', 'Centre', 'Alentejo', 'North')),
  ADD CONSTRAINT destinations_duration_check CHECK (duration_hours BETWEEN 1 AND 72),
  ADD CONSTRAINT destinations_lon_check CHECK (lon BETWEEN -180 AND 180),
  ADD CONSTRAINT destinations_lat_check CHECK (lat BETWEEN -90 AND 90);
CREATE INDEX destinations_public_idx ON destinations (is_active, sort_order);

-- ---------- Experiences (home page) ----------
-- Separate from destinations on purpose: an experience is a marketing card with no map position.
CREATE TABLE experiences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE,
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  price           numeric(12,2) CHECK (price IS NULL OR price >= 0),
  duration_hours  integer CHECK (duration_hours IS NULL OR duration_hours BETWEEN 1 AND 72),
  image_url       text,
  image_public_id text,
  is_featured     boolean NOT NULL DEFAULT false,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX experiences_public_idx ON experiences (is_active, sort_order);
CREATE TRIGGER experiences_updated_at BEFORE UPDATE ON experiences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Order matches the old home page: featured Sintra, then Lisbon, Belém, Óbidos, Arrábida as photo cards, then Évora and Porto as rows
INSERT INTO experiences (slug, title, description, price, duration_hours, is_featured, sort_order)
SELECT d.slug, d.name, d.description, d.base_price, d.duration_hours, d.is_featured, o.sort_order
FROM destinations d
JOIN (VALUES ('sintra', 1), ('lisbon', 2), ('belem', 3), ('obidos', 4), ('arrabida', 5), ('evora', 6), ('porto', 7)) AS o (slug, sort_order) ON o.slug = d.slug;

-- ---------- Comfort / pricing tiers (home page) ----------
CREATE TABLE pricing_tiers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow        text NOT NULL,
  name           text NOT NULL,
  tagline        text NOT NULL,
  hourly_price   numeric(12,2) NOT NULL CHECK (hourly_price >= 0),
  features       text[] NOT NULL DEFAULT '{}',
  is_highlighted boolean NOT NULL DEFAULT false,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pricing_tiers_public_idx ON pricing_tiers (is_active, sort_order);
CREATE TRIGGER pricing_tiers_updated_at BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO pricing_tiers (eyebrow, name, tagline, hourly_price, features, is_highlighted, sort_order) VALUES
  ('Essential', 'Budget',       'Comfort without compromise',    40,  ARRAY['Private car & driver', 'Comfortable vehicle', 'Bottled water', 'Ideal for short trips'],        false, 1),
  ('Signature', 'Premium',      'Executive comfort & style',     70,  ARRAY['Executive vehicles', 'Professional driver', 'Premium amenities', 'Extra comfort & space'],       true,  2),
  ('Reserve',   'Premium Plus', 'The ultimate Lisbon experience', 120, ARRAY['Luxury vehicles', 'Top class experience', 'VIP amenities', 'Tailor-made service'],                false, 3);
