import type { HTMLInputTypeAttribute } from "react";

export type FormField = {
  name: string;
  label: string;
  type: HTMLInputTypeAttribute;
  autoComplete?: string;
  required?: boolean;
};

// Single-line inputs shown above the message box
export const formFields: FormField[] = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name", required: true },
  { name: "email", label: "Your email", type: "email", autoComplete: "email", required: true },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
  { name: "dates", label: "Preferred dates", type: "text" },
];

// Maximum message length shown in the counter
export const MESSAGE_MAX_LENGTH = 500;
