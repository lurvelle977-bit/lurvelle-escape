import type { NavLink } from "@/types";

// Main navigation links (num is shown in the mobile menu)
export const navLinks: NavLink[] = [
  { id: "destinations", label: "Destinations", href: "/destinations", num: "00" },
  { id: "experiences", label: "Experiences", href: "/#experiences", num: "01" },
  { id: "tiers", label: "Comfort", href: "/#tiers", num: "02" },
  { id: "fleet", label: "Fleet", href: "/#fleet", num: "03" },
  { id: "about", label: "About", href: "/#about", num: "04" },
  { id: "contact", label: "Contact", href: "/#contact", num: "05" },
];

// Booking link used by every "Book" button
export const BOOKING_HREF = "/#contact";
