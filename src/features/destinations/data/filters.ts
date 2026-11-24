import type { Region } from "@/content/tours";

// Region chip value ("All" shows every tour)
export type RegionFilter = Region | "All";

// Budget chip: inclusive price range in euros
export type BudgetOption = {
  label: string;
  min: number;
  max: number;
};

// Starting point for routes ("You are here")
export const HOME_LOCATION = { lon: -9.139, lat: 38.722 };

export const regions: RegionFilter[] = ["All", "Lisbon", "Coast", "Centre", "Alentejo", "North"];

export const budgets: BudgetOption[] = [
  { label: "Any", min: 0, max: Infinity },
  { label: "Under €200", min: 0, max: 199 },
  { label: "€200–300", min: 200, max: 300 },
  { label: "€300+", min: 301, max: Infinity },
];
