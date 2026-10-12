import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";

// Brand, contact details and navigation shared by every page.
// Values marked PLACEHOLDER must be replaced with real details before launch.

export const SITE_NAME = "Lurvelle Escapes";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_TAGLINE = "Private tours and executive transfers with professional drivers — quiet comfort from door to door.";

// PLACEHOLDER — replace before launch
export const PHONE = "+351 910 123 456";
export const PHONE_HREF = "tel:+351910123456";
export const EMAIL = "hello@lurvelleescapes.com";
export const EMAIL_HREF = `mailto:${EMAIL}`;

// PLACEHOLDER — must match the real Google listing before launch
export const RATING = { score: "4.9", reviews: 312, award: "Travellers' Choice 2026" };

// Booking link used by every "Book" button
export const BOOKING_HREF = "/#contact";

// Main navigation links (num is shown in the mobile menu)
export type NavLink = {
  id: string;
  label: string;
  href: string;
  num: string;
};

export const navLinks: NavLink[] = [
  { id: "destinations", label: "Destinations", href: "/destinations", num: "00" },
  { id: "experiences", label: "Experiences", href: "/#experiences", num: "01" },
  { id: "tiers", label: "Comfort", href: "/#tiers", num: "02" },
  { id: "fleet", label: "Fleet", href: "/#fleet", num: "03" },
  { id: "about", label: "About", href: "/#about", num: "04" },
  { id: "contact", label: "Contact", href: "/#contact", num: "05" },
];

// Contact detail rows (href is omitted for rows that are plain text)
export type ContactItem = {
  label: string;
  value: string;
  href?: string;
  icon: LucideIcon;
};

export const contactItems: ContactItem[] = [
  { label: "Phone / WhatsApp", value: PHONE, href: PHONE_HREF, icon: Phone },
  { label: "Email", value: EMAIL, href: EMAIL_HREF, icon: Mail },
  { label: "Address", value: "Lisbon, Portugal", icon: MapPin },
  { label: "Working hours", value: "24/7 — We're here for you", icon: Clock },
];

// Trust points shown under the hero
export const trustPoints = ["Professional Drivers", "Private & Comfortable", "No Hidden Fees", "24/7 Support"];
