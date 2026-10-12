// Precompute driving routes from Lisbon to every tour so the site makes no routing calls at runtime.
// Run with `npm run routes` whenever a tour's coordinates change, then commit the generated JSON.
import { readFile, writeFile } from "node:fs/promises";

const TOURS_FILE = new URL("../src/content/tours.ts", import.meta.url);
const FILTERS_FILE = new URL("../src/features/destinations/data/filters.ts", import.meta.url);
const OUTPUT_FILE = new URL("../src/features/destinations/data/routes.json", import.meta.url);
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// Read ids and coordinates straight from the TypeScript source
const toursSource = await readFile(TOURS_FILE, "utf8");
const tours = [...toursSource.matchAll(/id: "([^"]+)",[\s\S]*?lon: (-?[\d.]+),\s*lat: (-?[\d.]+),/g)].map(([, id, lon, lat]) => ({
  id,
  lon: Number(lon),
  lat: Number(lat),
}));
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
