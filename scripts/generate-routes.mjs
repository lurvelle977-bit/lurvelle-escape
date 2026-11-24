// Precompute driving routes from Lisbon to every active destination so the site makes no routing calls at runtime.
// Run with `npm run routes` after adding a destination or changing its coordinates, then commit the generated JSON.
// Destinations without a precomputed route still work: the map draws a straight dashed line instead.
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";

const FILTERS_FILE = new URL("../src/features/destinations/data/filters.ts", import.meta.url);
const OUTPUT_FILE = new URL("../src/features/destinations/data/routes.json", import.meta.url);
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// Read slugs and coordinates from the destinations table
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? true : undefined });
await client.connect();
const tours = (await client.query("SELECT slug, lon, lat FROM destinations WHERE is_active ORDER BY sort_order")).rows.map((row) => ({
  id: row.slug,
  lon: Number(row.lon),
  lat: Number(row.lat),
}));
await client.end();
const filtersSource = await readFile(FILTERS_FILE, "utf8");
const [, homeLon, homeLat] = filtersSource.match(/HOME_LOCATION = \{ lon: (-?[\d.]+), lat: (-?[\d.]+) \}/);

const round = (n) => Math.round(n * 1e5) / 1e5;
const routes = {};

for (const tour of tours) {
  // Tours inside Lisbon itself have no route line
  if (Math.hypot(tour.lon - homeLon, tour.lat - homeLat) < 0.05) continue;
  const response = await fetch(`${OSRM_URL}/${homeLon},${homeLat};${tour.lon},${tour.lat}?overview=simplified&geometries=geojson`);
  if (!response.ok) throw new Error(`Routing failed for ${tour.id}: HTTP ${response.status}`);
  const route = (await response.json()).routes?.[0];
  if (!route) throw new Error(`No route found for ${tour.id}`);
  routes[tour.id] = {
    points: route.geometry.coordinates.map(([lon, lat]) => [round(lat), round(lon)]),
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
  };
  console.log(`${tour.id}: ${routes[tour.id].points.length} points, ${Math.round(route.distance / 1000)} km`);
}

await writeFile(OUTPUT_FILE, `${JSON.stringify(routes)}\n`);
console.log(`Wrote ${Object.keys(routes).length} routes`);
