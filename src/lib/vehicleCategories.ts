// Shared by the admin form (labels) and the API validation (keys); stored in vehicles.category
export const VEHICLE_CATEGORIES = {
  ECONOMY: "Economy Class",
  STANDARD_COMFORT: "Standard/Comfort Class",
  VAN: "Van",
  FIRST_CLASS: "First Class",
} as const;

export type VehicleCategory = keyof typeof VEHICLE_CATEGORIES;
export const VEHICLE_CATEGORY_KEYS = Object.keys(VEHICLE_CATEGORIES) as [VehicleCategory, ...VehicleCategory[]];
