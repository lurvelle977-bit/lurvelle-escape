import type { Vehicle } from "@/types";

// Fleet vehicles (imagePosition keeps the crop chosen in the design)
export const fleet: Vehicle[] = [
  {
    className: "Executive Class",
    name: "Mercedes-Benz E-Class or similar",
    seats: "Passengers 3",
    bags: "Luggage 2",
    image: "/images/fleet/e-class.webp",
    imagePosition: "50% 72%",
  },
  {
    className: "Business Van",
    name: "Mercedes-Benz V-Class or similar",
    seats: "Passengers 7",
    bags: "Luggage 8",
    image: "/images/fleet/v-class.webp",
    imagePosition: "50% 50%",
  },
  {
    className: "First Class",
    name: "Mercedes-Benz S-Class or similar",
    seats: "Passengers 3",
    bags: "Luggage 2",
    image: "/images/fleet/s-class.webp",
    imagePosition: "50% 50%",
  },
  {
    className: "Comfort Van",
    name: "Mercedes-Benz Vito or similar",
    seats: "Passengers 7",
    bags: "Luggage 6",
    image: "/images/fleet/vito.webp",
    imagePosition: "50% 50%",
  },
];
