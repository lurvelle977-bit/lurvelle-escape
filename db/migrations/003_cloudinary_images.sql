-- Pictures now live in Cloudinary. resource_images keeps its id (vehicles.image_id / drivers.image_id are unchanged)
-- and stores the Cloudinary URL and public_id. Rows from migration 002 keep their bytes and are still served by
-- /api/admin/images/[id] until they are replaced or deleted.
ALTER TABLE resource_images
  ADD COLUMN secure_url text,
  ADD COLUMN public_id  text,
  ALTER COLUMN data DROP NOT NULL,
  ALTER COLUMN content_type DROP NOT NULL;

ALTER TABLE resource_images
  ADD CONSTRAINT resource_images_has_source CHECK (
    (secure_url IS NOT NULL AND public_id IS NOT NULL) OR data IS NOT NULL
  );
CREATE UNIQUE INDEX resource_images_public_id_key ON resource_images (public_id) WHERE public_id IS NOT NULL;
