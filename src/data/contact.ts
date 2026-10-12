import type { ContactItem } from "@/types";

// Company contact details
export const PHONE = "+351 910 123 456";
export const PHONE_HREF = "tel:+351910123456";
export const EMAIL = "hello@lurvelleescapes.com";
export const EMAIL_HREF = "mailto:hello@lurvelleescapes.com";

// Contact rows with icons (desktop)
export const contactItems: ContactItem[] = [
  { label: "Phone / WhatsApp", value: PHONE, href: PHONE_HREF, icon: "phone" },
  { label: "Email", value: EMAIL, href: EMAIL_HREF, icon: "mail" },
  { label: "Address", value: "Lisbon, Portugal", href: "#contact", icon: "pin" },
  { label: "Working hours", value: "24/7 — We're here for you", href: "#contact", icon: "clock" },
];

// Desktop form inputs
export const desktopFormFields = [
  { name: "name", placeholder: "Your name", type: "text" },
  { name: "email", placeholder: "Your email", type: "email" },
  { name: "phone", placeholder: "Phone number", type: "tel" },
];

// Mobile form inputs
export const mobileFormFields = [
  { name: "name", placeholder: "Your name", type: "text" },
  { name: "email", placeholder: "Email address", type: "email" },
  { name: "phone", placeholder: "Phone number", type: "tel" },
  { name: "dates", placeholder: "Preferred dates", type: "text" },
];

// Maximum message length shown in the counter
export const MESSAGE_MAX_LENGTH = 500;
