// Types and display helpers for tours. The data itself lives in PostgreSQL (see src/server/services/content.service.ts).

export const REGIONS = ["Lisbon", "Coast", "Centre", "Alentejo", "North"] as const;
export type Region = (typeof REGIONS)[number];

// Card on the home page Experiences section
export type Experience = {
  id: string;
  name: string;
  blurb: string;
  // Starting price in euros; null shows "On request"
  cost: number | null;
  // null shows "Flexible"
  durationHours: number | null;
  image: string | null;
  featured: boolean;
};

export type Tour = {
  id: string;
  name: string;
  // Upper-case label next to the map pin
  mapLabel: string;
  durationHours: number;
  // Starting price in euros
  cost: number;
  // Cloudinary URL; null until a picture is uploaded
  image: string | null;
  blurb: string;
  region: Region;
  lon: number;
  lat: number;
  // Which side of the desktop pin the label sits on
  labelSide: "left" | "right";
  // Label offset from the pin on the mobile SVG map
  mobileLabel: { dx: number; dy: number };
};

// Bespoke tour offered alongside the fixed tours
export const customTour = { name: "Custom Private Tour", duration: "Flexible", price: "On request" };

type Priced = { durationHours: number | null; cost: number | null };

// "8 hours"
export function formatHours(tour: Pick<Priced, "durationHours">) {
  return tour.durationHours === null ? "Flexible" : `${tour.durationHours} hours`;
}

// "Full day · 8 hours"
export function formatDuration(tour: Pick<Priced, "durationHours">) {
  if (tour.durationHours === null) return "Flexible";
  return `${tour.durationHours <= 4 ? "Half day" : "Full day"} · ${tour.durationHours} hours`;
}

// "From €240"
export function formatPrice(tour: Pick<Priced, "cost">) {
  return tour.cost === null ? "On request" : `From €${tour.cost}`;
}
