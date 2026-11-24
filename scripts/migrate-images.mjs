// Uploads local images from public/images to Cloudinary, once each, using the same credentials as the app.
// Usage: npm run images:migrate [-- <subfolder> ...] [--db] [--dry-run]
//   default subfolder: destinations (the only images used by the Experiences, Destinations and Tiers sections)
//   --db       also point destinations/experiences rows that have no picture yet at the uploaded image (matched by slug = filename)
//   --dry-run  list what would be uploaded without uploading
// Public IDs mirror the local path: public/images/destinations/lisbon.jpg -> public/images/destinations/lisbon
// Re-running is safe: images already in Cloudinary are skipped, never re-uploaded or overwritten.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import pg from "pg";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const folders = args.filter((arg) => !arg.startsWith("--"));
if (folders.length === 0) folders.push("destinations");

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be set.");
  process.exit(1);
}
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "images");
const IMAGE = /\.(jpe?g|png|webp)$/i;

const found = [];
for (const folder of folders) {
  for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
    if (entry.isFile() && IMAGE.test(entry.name)) found.push({ folder, file: entry.name });
  }
}

const results = { uploaded: [], skipped: [], failed: [] };
const urls = new Map(); // slug -> { secureUrl, publicId } for the --db step

for (const { folder, file } of found) {
  const slug = file.replace(IMAGE, "");
  const publicId = `public/images/${folder}/${slug}`;
  try {
    let resource;
    try {
      resource = await cloudinary.api.resource(publicId);
      results.skipped.push(publicId);
    } catch (error) {
      if (error?.error?.http_code !== 404) throw error;
      if (flags.has("--dry-run")) {
        results.uploaded.push(`${publicId} (dry run)`);
        continue;
      }
      resource = await cloudinary.uploader.upload(path.join(root, folder, file), {
        public_id: publicId,
        asset_folder: `public/images/${folder}`,
        resource_type: "image",
        overwrite: false,
        unique_filename: false,
      });
      results.uploaded.push(publicId);
    }
    if (folder === "destinations") urls.set(slug, { secureUrl: resource.secure_url, publicId: resource.public_id });
  } catch (error) {
    results.failed.push(`${publicId}: ${error?.error?.message ?? error?.message ?? error}`);
  }
}

if (flags.has("--db") && !flags.has("--dry-run") && urls.size > 0) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? true : undefined });
  await client.connect();
  try {
    for (const [slug, { secureUrl, publicId }] of urls) {
      for (const table of ["destinations", "experiences"]) {
        const { rowCount } = await client.query(
          `UPDATE ${table} SET image_url = $2, image_public_id = $3 WHERE slug = $1 AND image_url IS NULL`,
          [slug, secureUrl, publicId],
        );
        if (rowCount) console.log(`  ${table}.${slug} -> ${publicId}`);
      }
    }
  } finally {
    await client.end();
  }
}

console.log(`\nUploaded ${results.uploaded.length}, already in Cloudinary ${results.skipped.length}, failed ${results.failed.length}`);
results.uploaded.forEach((id) => console.log(`  + ${id}`));
results.skipped.forEach((id) => console.log(`  = ${id}`));
results.failed.forEach((message) => console.log(`  ! ${message}`));
if (results.failed.length) process.exit(1);
