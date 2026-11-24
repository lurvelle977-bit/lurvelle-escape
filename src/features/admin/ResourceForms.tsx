"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { VEHICLE_CATEGORIES } from "@/lib/vehicleCategories";
import { adminButton, adminField, Panel } from "./ui";
import { useAdminAction } from "./useAdminAction";

export const fileField = cn(
  adminField,
  "cursor-pointer py-2 text-[13px] file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1 file:text-[11px] file:font-semibold file:tracking-[1px] file:text-dark file:uppercase",
);
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // mirrored by the server, which is the real check

// Drops an empty file input so the server sees "no picture" rather than an empty file
export function formData(element: HTMLFormElement) {
  const form = new FormData(element);
  const file = form.get("image");
  if (file instanceof File && file.size === 0) form.delete("image");
  return form;
}

// Quick feedback before uploading; the server re-checks size and the real file type
export function imageProblem(form: FormData, label: string) {
  const file = form.get("image");
  if (!(file instanceof File)) return "";
  if (!IMAGE_TYPES.includes(file.type)) return `${label} must be a JPEG, PNG or WebP image.`;
  if (file.size > MAX_IMAGE_BYTES) return `${label} must be 2 MB or smaller.`;
  return "";
}

export function VehicleForm() {
  const { run, busy, error, done } = useAdminAction();
  const [fileError, setFileError] = useState("");
  return (
    <Panel title="Add vehicle">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = formData(element);
          const problem = imageProblem(form, "Vehicle picture");
          setFileError(problem);
          if (problem) return;
          const saved = await run("POST", "/api/admin/vehicles", form, "Vehicle added");
          if (saved) element.reset();
        }}
      >
        <input name="name" required placeholder="Name, e.g. Mercedes V-Class" aria-label="Name" className={adminField} />
        <select name="category" required defaultValue="" aria-label="Vehicle category" className={adminField}>
          <option value="" disabled>Vehicle category</option>
          {Object.entries(VEHICLE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input name="plate" required placeholder="Plate" aria-label="Plate" className={adminField} />
          <input name="passengerCapacity" type="number" min={1} max={60} required placeholder="Seats" aria-label="Passenger capacity" className={adminField} />
        </div>
        <label className="grid gap-1.5 text-[12px] text-muted">
          Vehicle picture (optional · JPEG, PNG or WebP, up to 2 MB)
          <input name="image" type="file" accept={IMAGE_TYPES.join(",")} className={fileField} onChange={() => setFileError("")} />
        </label>
        <div><button type="submit" disabled={busy} className={adminButton()}>Add vehicle</button></div>
        {(fileError || error) && <p role="alert" className="text-[13px] text-[#e8907f]">{fileError || error}</p>}
        {done && !error && !fileError && <p role="status" className="text-[13px] text-[#8fcf9d]">{done}</p>}
      </form>
    </Panel>
  );
}

export function DriverForm({ vehicles }: { vehicles: { id: string; name: string; plate: string }[] }) {
  const { run, busy, error, done } = useAdminAction();
  const [fileError, setFileError] = useState("");
  return (
    <Panel title="Add driver">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const element = event.currentTarget;
          const form = formData(element);
          const problem = imageProblem(form, "Profile picture");
          setFileError(problem);
          if (problem) return;
          const saved = await run("POST", "/api/admin/drivers", form, "Driver added");
          if (saved) element.reset();
        }}
      >
        <input name="name" required placeholder="Name" aria-label="Name" className={adminField} />
        <input name="phone" type="tel" required placeholder="Phone with country code" aria-label="Phone" className={adminField} />
        <input name="email" type="email" placeholder="Email (optional)" aria-label="Email" className={adminField} />
        <select name="vehicleId" defaultValue="" aria-label="Assigned vehicle" className={adminField}>
          <option value="">{vehicles.length === 0 ? "No vehicles registered yet" : "Assign vehicle (optional)"}</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.plate}</option>)}
        </select>
        <label className="grid gap-1.5 text-[12px] text-muted">
          Profile picture (optional · JPEG, PNG or WebP, up to 2 MB)
          <input name="image" type="file" accept={IMAGE_TYPES.join(",")} className={fileField} onChange={() => setFileError("")} />
        </label>
        <div><button type="submit" disabled={busy} className={adminButton()}>Add driver</button></div>
        {(fileError || error) && <p role="alert" className="text-[13px] text-[#e8907f]">{fileError || error}</p>}
        {done && !error && !fileError && <p role="status" className="text-[13px] text-[#8fcf9d]">{done}</p>}
      </form>
    </Panel>
  );
}
