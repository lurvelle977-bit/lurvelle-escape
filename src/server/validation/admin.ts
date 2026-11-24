import { z } from "zod";
import { VEHICLE_CATEGORY_KEYS } from "@/lib/vehicleCategories";
import { email, phone, text } from "./common";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

export const vehicleSchema = z.object({
  name: text("Name", 2, 120),
  category: z.enum(VEHICLE_CATEGORY_KEYS, { error: "Choose a vehicle category" }),
  plate: text("Plate", 2, 20),
  passengerCapacity: z.coerce.number({ error: "Seats must be a number" }).int().min(1).max(60),
});

export const driverSchema = z.object({
  name: text("Name", 2, 120),
  phone,
  email: email.optional(),
  vehicleId: z.uuid("Choose a valid vehicle").optional(),
});
