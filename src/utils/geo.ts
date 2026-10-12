import { MAP_SCALE, MAP_TRANSLATE } from "@/data/portugalMap";

// Driving route returned by the routing service
export type DrivingRoute = {
  points: [number, number][];
  distance: number;
  duration: number;
};

// Earth radius used by Leaflet (metres)
const EARTH_RADIUS = 6371000;

// Straight-line distance between two points in metres
export function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// "123 km · 1 h 30 min from Lisbon"
export function formatRoute(route: DrivingRoute) {
  const km = Math.round(route.distance / 1000);
  const hours = Math.floor(route.duration / 3600);
  const minutes = Math.round((route.duration % 3600) / 60);
  return `${km} km · ${hours ? `${hours} h ` : ""}${minutes} min from Lisbon`;
}

// Fetch the real driving route from Lisbon using the public OSRM service
export async function fetchDrivingRoute(from: { lon: number; lat: number }, to: { lon: number; lat: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const json = await response.json();
  const route = json.routes?.[0];
  if (!route) throw new Error("No route found");
  return {
    points: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]),
    distance: route.distance,
    duration: route.duration,
  } as DrivingRoute;
}

// Mercator projection for the mobile SVG map (matches the stored country outlines)
export function projectToMobileMap(lon: number, lat: number): [number, number] {
  const rad = Math.PI / 180;
  const x = MAP_SCALE * lon * rad + MAP_TRANSLATE[0];
  const y = -MAP_SCALE * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2)) + MAP_TRANSLATE[1];
  return [x, y];
}
