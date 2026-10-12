import type { Experience } from "@/types";

// Trust points shown under the hero
export const trustPoints = ["Professional Drivers", "Private & Comfortable", "No Hidden Fees", "24/7 Support"];

// Large featured tour
export const featuredExperience: Experience = {
  name: "Sintra & Cascais",
  hours: "Full day · 8 hours",
  price: "From €240",
  image: "/images/destinations/sintra.jpg",
};

// Tours with photos
export const experienceCards: Experience[] = [
  { name: "Lisbon City Highlights", hours: "Half day · 4 hours", price: "From €150", image: "/images/destinations/lisbon.png" },
  { name: "Belém & Historic Lisbon", hours: "Half day · 4 hours", price: "From €160", image: "/images/destinations/belem.jpg" },
  { name: "Óbidos & Nazaré", hours: "Full day · 8 hours", price: "From €270", image: "/images/destinations/obidos.jpg" },
  { name: "Arrábida & Setúbal", hours: "Full day · 8 hours", price: "From €280", image: "/images/destinations/arrabida.jpg" },
];

// Tours shown as text rows
export const experienceRows: Experience[] = [
  { name: "Évora & Alentejo", hours: "Full day · 10 hours", price: "From €380" },
  { name: "Porto City Highlights", hours: "Full day · 10 hours", price: "From €420" },
  { name: "Custom Private Tour", hours: "Flexible", price: "On request" },
];
