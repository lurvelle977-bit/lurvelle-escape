import type { Metadata } from "next";
import { DriverForm, VehicleForm } from "@/features/admin/ResourceForms";
import { Panel } from "@/features/admin/ui";
import { requireAdminPage } from "@/server/auth/page";
import { db } from "@/server/db/pool";
import { listDrivers, listVehicles } from "@/server/repositories/resource.repository";

export const metadata: Metadata = { title: "Vehicles & drivers" };

// Fleet and driver register used by the availability checks on each booking
export default async function ResourcesPage() {
  await requireAdminPage();
  const [vehicles, drivers] = await Promise.all([listVehicles(db), listDrivers(db)]);
  return (
    <>
      <h1 className="font-serif text-[30px] text-cream">Vehicles &amp; drivers</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-5">
          <Panel title={`Vehicles (${vehicles.length})`}>
            {vehicles.length === 0 ? <p className="text-[13px] text-muted">No vehicles yet.</p> : (
              <ul className="grid gap-2 text-[13.5px] text-cream">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id}>{vehicle.name} <span className="text-muted">· {vehicle.vehicleClass} · {vehicle.plate} · {vehicle.passengerCapacity} seats{vehicle.isActive ? "" : " · inactive"}</span></li>
                ))}
              </ul>
            )}
          </Panel>
          <VehicleForm />
        </div>
        <div className="grid content-start gap-5">
          <Panel title={`Drivers (${drivers.length})`}>
            {drivers.length === 0 ? <p className="text-[13px] text-muted">No drivers yet.</p> : (
              <ul className="grid gap-2 text-[13.5px] text-cream">
                {drivers.map((driver) => (
                  <li key={driver.id}>{driver.name} <span className="text-muted">· {driver.phone}{driver.isActive ? "" : " · inactive"}</span></li>
                ))}
              </ul>
            )}
          </Panel>
          <DriverForm />
        </div>
      </div>
    </>
  );
}
