// Every tour is defined once here; the home page and the destinations page both read from this list.

export type Region = "Lisbon" | "Coast" | "Centre" | "Alentejo" | "North";

export type Tour = {
  id: string;
  name: string;
  // Upper-case label next to the map pin
  mapLabel: string;
  durationHours: number;
  // Starting price in euros
  cost: number;
  image: string;
  blurb: string;
  region: Region;
  lon: number;
  lat: number;
  // Which side of the desktop pin the label sits on
  labelSide: "left" | "right";
  // Label offset from the pin on the mobile SVG map
  mobileLabel: { dx: number; dy: number };
};

export const tours: Tour[] = [
  {
    id: "lisbon",
    name: "Lisbon City Highlights",
    mapLabel: "LISBON",
    durationHours: 4,
    cost: 150,
    image: "/images/destinations/lisbon.jpg",
    blurb: "Miradouros, Alfama and the grand squares of the capital.",
    region: "Lisbon",
    lon: -9.139,
    lat: 38.722,
    labelSide: "right",
    mobileLabel: { dx: 12, dy: 4 },
  },
  {
    id: "belem",
    name: "Belém & Historic Lisbon",
    mapLabel: "BELÉM",
    durationHours: 4,
    cost: 160,
    image: "/images/destinations/belem.jpg",
    blurb: "Monasteries, the tower and pastéis fresh from the oven.",
    region: "Lisbon",
    lon: -9.216,
    lat: 38.697,
    labelSide: "left",
    mobileLabel: { dx: -12, dy: 14 },
  },
  {
    id: "sintra",
    name: "Sintra & Cascais",
    mapLabel: "SINTRA",
    durationHours: 8,
    cost: 240,
    image: "/images/destinations/sintra.jpg",
    blurb: "Palaces, coastline and charming villages. A perfect full-day escape.",
    region: "Coast",
    lon: -9.388,
    lat: 38.798,
    labelSide: "left",
    mobileLabel: { dx: -12, dy: -8 },
  },
  {
    id: "arrabida",
    name: "Arrábida & Setúbal",
    mapLabel: "ARRÁBIDA",
    durationHours: 8,
    cost: 280,
    image: "/images/destinations/arrabida.jpg",
    blurb: "Turquoise coves and vineyards south of the Tagus.",
    region: "Coast",
    lon: -8.891,
    lat: 38.524,
    labelSide: "right",
    mobileLabel: { dx: 12, dy: 10 },
  },
  {
    id: "obidos",
    name: "Óbidos & Nazaré",
    mapLabel: "ÓBIDOS",
    durationHours: 8,
    cost: 270,
    image: "/images/destinations/obidos.jpg",
    blurb: "A walled medieval town and the giant waves of Nazaré.",
    region: "Centre",
    lon: -9.157,
    lat: 39.361,
    labelSide: "right",
    mobileLabel: { dx: 12, dy: 0 },
  },
  {
    id: "evora",
    name: "Évora & Alentejo",
    mapLabel: "ÉVORA",
    durationHours: 10,
    cost: 380,
    image: "/images/destinations/evora.jpg",
    blurb: "Roman temples, cork oaks and slow Alentejo afternoons.",
    region: "Alentejo",
    lon: -7.909,
    lat: 38.571,
    labelSide: "right",
    mobileLabel: { dx: 12, dy: 0 },
  },
  {
    id: "porto",
    name: "Porto City Highlights",
    mapLabel: "PORTO",
    durationHours: 10,
    cost: 420,
    image: "/images/destinations/porto.jpg",
    blurb: "Ribeira, port cellars and the bridges of the Douro.",
    region: "North",
    lon: -8.611,
    lat: 41.15,
    labelSide: "right",
    mobileLabel: { dx: 12, dy: 0 },
  },
];

// Bespoke tour offered alongside the fixed tours
export const customTour = { name: "Custom Private Tour", duration: "Flexible", price: "On request" };

// "8 hours"
export function formatHours(tour: Tour) {
  return `${tour.durationHours} hours`;
}

// "Full day · 8 hours"
export function formatDuration(tour: Tour) {
  return `${tour.durationHours <= 4 ? "Half day" : "Full day"} · ${tour.durationHours} hours`;
}

// "From €240"
export function formatPrice(tour: Tour) {
  return `From €${tour.cost}`;
}

export function getTour(id: string) {
  const tour = tours.find((t) => t.id === id);
  if (!tour) throw new Error(`Unknown tour: ${id}`);
  return tour;
}

// Home page Experiences layout: one large card, photo cards, then text rows
export const featuredTour = getTour("sintra");
export const cardTours = ["lisbon", "belem", "obidos", "arrabida"].map(getTour);
export const rowTours = ["evora", "porto"].map(getTour);
