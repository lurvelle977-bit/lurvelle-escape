import { z } from "zod";
import { REGIONS } from "@/content/tours";
import { cleanText } from "../domain/text";
import { text } from "./common";

// Form posts send strings ("on", "12", ""), JSON sends real values; both must validate the same way
const bool = z.preprocess((v) => v === true || v === "true" || v === "on" || v === "1", z.boolean());

const optionalNumber = (label: string, min: number, max: number, integer = false) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    (integer ? z.number({ error: `${label} must be a number` }).int(`${label} must be a whole number`) : z.number({ error: `${label} must be a number` }))
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .nullable(),
  );

const requiredNumber = (label: string, min: number, max: number, integer = false) =>
  optionalNumber(label, min, max, integer).refine((v): v is number => v !== null, `${label} is required`);

const sortOrder = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number({ error: "Order must be a number" }).int().min(0).max(9999));

const body = (label: string, max: number) =>
  z
    .string()
    .default("")
    .transform(cleanText)
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`));

export const experienceSchema = z.object({
  title: text("Title", 2, 120),
  description: body("Description", 600),
  price: optionalNumber("Price", 0, 100000),
  durationHours: optionalNumber("Duration", 1, 72, true),
  isFeatured: bool,
  isActive: bool.default(true),
  sortOrder,
});

export const destinationSchema = z.object({
  name: text("Name", 2, 120),
  description: body("Description", 600),
  region: z.enum(REGIONS, { error: "Choose a region" }),
  price: requiredNumber("Price", 0, 100000),
  durationHours: requiredNumber("Duration", 1, 72, true),
  lat: requiredNumber("Latitude", -90, 90),
  lon: requiredNumber("Longitude", -180, 180),
  mapLabel: z.string().default("").transform(cleanText).pipe(z.string().max(30, "Map label must be at most 30 characters")),
  labelSide: z.enum(["left", "right"], { error: "Choose a label side" }).default("right"),
  mobileLabelDx: z.preprocess((v) => (v === "" || v == null ? 12 : Number(v)), z.number().int().min(-60).max(60)),
  mobileLabelDy: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(-60).max(60)),
  isFeatured: bool,
  isActive: bool.default(true),
  sortOrder,
});

// One feature per line in the admin form, or an array from JSON clients
const features = z.preprocess(
  (v) => (typeof v === "string" ? v.split(/\r?\n/) : v),
  z
    .array(z.string().transform(cleanText))
    .transform((list) => list.filter(Boolean))
    .pipe(z.array(z.string().max(80, "Each feature must be at most 80 characters")).min(1, "Add at least one feature").max(8, "At most 8 features")),
);

export const tierSchema = z.object({
  eyebrow: text("Label", 2, 40),
  name: text("Name", 2, 60),
  tagline: text("Description", 2, 120),
  price: requiredNumber("Price", 0, 100000),
  features,
  isHighlighted: bool,
  isActive: bool.default(true),
  sortOrder,
});

export const activeSchema = z.object({ isActive: bool });

export type ExperienceInput = z.infer<typeof experienceSchema>;
export type DestinationInput = z.infer<typeof destinationSchema>;
export type TierInput = z.infer<typeof tierSchema>;
