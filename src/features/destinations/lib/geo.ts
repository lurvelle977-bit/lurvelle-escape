import type { Tour } from "@/content/tours";
import routesJson from "../data/routes.json";
import { HOME_LOCATION } from "../data/filters";

// Driving route from Lisbon, precomputed by scripts/generate-routes.mjs
export type DrivingRoute = {
  points: [number, number][];
  // metres
  distance: number;
  // seconds
  duration: number;
};

// JSON imports widen tuples to number[][], so assert the generated shape
const routes = routesJson as unknown as Record<string, DrivingRoute>;

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

// True when the tour starts inside Lisbon itself (no route line)
export function isInCity(tour: Tour) {
  return Math.hypot(tour.lon - HOME_LOCATION.lon, tour.lat - HOME_LOCATION.lat) < 0.05;
}

export function getRoute(tour: Tour): DrivingRoute | undefined {
  return routes[tour.id];
}

// "123 km · 1 h 30 min from Lisbon", or the straight-line distance if no route was generated
export function describeRoute(tour: Tour) {
  if (isInCity(tour)) return "In the city";
  const route = getRoute(tour);
  if (!route) {
    const km = Math.round(distanceInMeters(HOME_LOCATION.lat, HOME_LOCATION.lon, tour.lat, tour.lon) / 1000);
    return `≈ ${km} km from Lisbon (straight line)`;
  }
  const km = Math.round(route.distance / 1000);
  const hours = Math.floor(route.duration / 3600);
  const minutes = Math.round((route.duration % 3600) / 60);
  return `${km} km · ${hours ? `${hours} h ` : ""}${minutes} min from Lisbon`;
}
