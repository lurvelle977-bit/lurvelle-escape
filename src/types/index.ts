// Navigation link
export type NavLink = {
  id: string;
  label: string;
  href: string;
  num: string;
};

// Tour shown in the Experiences section
export type Experience = {
  name: string;
  hours: string;
  price: string;
  image?: string;
};

// Comfort level card
export type Tier = {
  eyebrow: string;
  name: string;
  tag: string;
  price: string;
  highlighted: boolean;
  features: string[];
};

// Fleet vehicle card
export type Vehicle = {
  className: string;
  name: string;
  seats: string;
  bags: string;
  image: string;
  imagePosition: string;
};

// About section statistic
export type Stat = {
  value: string;
  label: string;
};

// Contact detail row
export type ContactItem = {
  label: string;
  value: string;
  href: string;
  icon: "phone" | "mail" | "pin" | "clock";
};

// Region filter value on the destinations page
export type Region = "All" | "Lisbon" | "Coast" | "Centre" | "Alentejo" | "North";

// Destination shown on the map and list
export type Destination = {
  id: string;
  name: string;
  mapLabel: string;
  hours: string;
  price: string;
  image: string;
  blurb: string;
  lon: number;
  lat: number;
  dx: number;
  dy: number;
  mobileDx: number;
  mobileDy: number;
  region: Exclude<Region, "All">;
  cost: number;
};

// Budget filter option
export type BudgetOption = {
  label: string;
  min: number;
  max: number;
};
