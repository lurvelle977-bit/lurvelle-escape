"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { VEHICLE_CATEGORIES, type VehicleCategory } from "@/lib/vehicleCategories";
import { cn } from "@/lib/cn";
import type { DriverRecord, VehicleRecord } from "@/server/repositories/resource.repository";
import Dialog from "./Dialog";
import { adminButton, adminField } from "./ui";
import { useAdminAction } from "./useAdminAction";

type Availability = {
  booking: {
    reference: string;
    customerName: string;
    travelDate: string;
    passengers: number;
    vehicleCategory: VehicleCategory | null;
    vehicleId: string | null;
    driverId: string | null;
    canAssign: boolean;
  };
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
};

// Right-side drawer: shows the category the customer asked for and only the vehicles the server says can serve it
// (same category, active, enough seats, free that day). The server re-checks all of this when saving.
export default function AssignVehicleDrawer({ reference, onClose }: { reference: string; onClose: () => void }) {
  const [data, setData] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const save = useAdminAction();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/${reference}/assignment`)
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.ok) throw new Error(result?.error?.message ?? "Could not load availability.");
        return result.data as Availability;
      })
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        // Preselect the current assignment only while it is still a valid choice
        setVehicleId(loaded.vehicles.some((vehicle) => vehicle.id === loaded.booking.vehicleId) ? (loaded.booking.vehicleId ?? "") : "");
        setDriverId(loaded.drivers.some((driver) => driver.id === loaded.booking.driverId) ? (loaded.booking.driverId ?? "") : "");
      })
      .catch((error: Error) => !cancelled && setLoadError(error.message));
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const booking = data?.booking;
  const staleVehicle = booking?.vehicleId && !data?.vehicles.some((vehicle) => vehicle.id === booking.vehicleId);
  const category = booking?.vehicleCategory ? VEHICLE_CATEGORIES[booking.vehicleCategory] : null;

  const submit = async () => {
    if (await save.run("POST", `/api/bookings/${reference}/assignment`, { vehicleId: vehicleId || null, driverId: driverId || null }, "Assignment saved")) onClose();
  };

  return (
    <Dialog title={`Assign vehicle · ${reference}`} variant="drawer" onClose={onClose}>
      {!data && !loadError && <p role="status" className="text-[13px] text-muted">Loading availability…</p>}
      {loadError && <p role="alert" className="text-[13px] text-[#e8907f]">{loadError}</p>}
      {data && booking && (
        <div className="grid gap-5">
          <dl className="grid gap-2 rounded-[4px] border border-cream/10 p-4 text-[13px]">
            {(
              [
                ["Booking", booking.reference],
                ["Customer", booking.customerName],
                ["Travel date", booking.travelDate],
                ["Passengers", String(booking.passengers)],
                ["Requested category", category ?? "Not specified"],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[130px_1fr] gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="text-cream">{value}</dd>
              </div>
            ))}
          </dl>

          {!booking.canAssign ? (
            <p className="text-[13px] text-sand">Start the review (and keep the booking open) before assigning a vehicle or driver.</p>
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 text-[11px] font-semibold tracking-[1.5px] text-muted uppercase">Available vehicles</legend>
                {staleVehicle && (
                  <p className="mb-3 text-[12.5px] text-[#e8907f]">
                    The vehicle currently assigned no longer meets this booking&apos;s requirements and will be removed when you save, unless you choose another.
                  </p>
                )}
                <div className="grid gap-2">
                  <label className={cn("flex cursor-pointer items-center gap-3 rounded-[4px] border p-3 text-[13px]", vehicleId === "" ? "border-gold bg-gold/12 text-cream" : "border-cream/14 text-sand hover:border-gold/60")}>
                    <input type="radio" name="vehicle" checked={vehicleId === ""} onChange={() => setVehicleId("")} className="accent-gold" />
                    No vehicle (clear assignment)
                  </label>
                  {data.vehicles.map((vehicle) => (
                    <label key={vehicle.id} className={cn("flex cursor-pointer items-center gap-3 rounded-[4px] border p-3 text-[13px]", vehicleId === vehicle.id ? "border-gold bg-gold/12" : "border-cream/14 hover:border-gold/60")}>
                      <input type="radio" name="vehicle" checked={vehicleId === vehicle.id} onChange={() => setVehicleId(vehicle.id)} className="accent-gold" />
                      {vehicle.imageUrl ? (
                        <Image src={vehicle.imageUrl} alt="" width={56} height={40} unoptimized className="h-10 w-14 shrink-0 rounded-[4px] object-cover" />
                      ) : (
                        <span aria-hidden className="h-10 w-14 shrink-0 rounded-[4px] border border-cream/14 bg-ink/50" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-cream">{vehicle.name}</span>
                        <span className="block text-[12px] text-muted">
                          {vehicle.plate} · {vehicle.passengerCapacity} seats
                        </span>
                      </span>
                      <span className="rounded-full border border-[#8fcf9d]/60 px-2 py-0.5 text-[10px] font-semibold tracking-[1px] text-[#8fcf9d] uppercase">
                        {vehicle.id === booking.vehicleId ? "Assigned" : "Available"}
                      </span>
                    </label>
                  ))}
                </div>
                {data.vehicles.length === 0 && (
                  <p className="mt-3 text-[13px] text-muted">
                    {category ? "No available vehicles found in the selected category for this travel date." : "No available vehicles found for this travel date."}
                  </p>
                )}
              </fieldset>

              <div>
                <label htmlFor="assign-driver" className="mb-2 block text-[11px] font-semibold tracking-[1.5px] text-muted uppercase">Driver</label>
                <select id="assign-driver" value={driverId} onChange={(event) => setDriverId(event.target.value)} className={adminField}>
                  <option value="">No driver</option>
                  {data.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name} · {driver.phone}</option>
                  ))}
                </select>
              </div>

              {save.error && <p role="alert" className="text-[13px] text-[#e8907f]">{save.error}</p>}
              <div className="flex gap-3">
                <button type="button" disabled={save.busy} onClick={submit} className={adminButton()}>{save.busy ? "Saving…" : "Save assignment"}</button>
                <button type="button" onClick={onClose} className={adminButton("plain")}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
