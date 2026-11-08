import { z } from "zod";
import { email, phone, text } from "./common";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

export const vehicleSchema = z.object({
  name: text("Name", 2, 120),
  vehicleClass: text("Class", 2, 80),
  plate: text("Plate", 2, 20),
  passengerCapacity: z.number().int().min(1).max(60),
});

export const driverSchema = z.object({
  name: text("Name", 2, 120),
  phone,
  email: email.optional(),
});
